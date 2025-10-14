// controllers/scanController.js
import Shipment, { SHIPMENT_STATUS } from "../models/Shipment.js";
import { buildTrackingPayload } from "./_trackingFormatter.js";
import { emitShipmentScanCreated } from "../realtime/socket.js";
import { notifyShipmentMilestone } from "../services/notifications.js";

export async function postScan(req, res, next) {
  try {
    const { ref, status, location, note, photoUrl } = req.body || {};

    // Basic validation
    const refClean = String(ref || "")
      .trim()
      .toUpperCase();
    if (!refClean) return res.status(400).json({ message: "ref is required" });
    if (!status) return res.status(400).json({ message: "status is required" });
    if (note && String(note).length > 500) {
      return res
        .status(400)
        .json({ message: "note must be <= 500 characters" });
    }

    // Find shipment
    const shipment = await Shipment.findOne({ ref: refClean });
    if (!shipment)
      return res.status(404).json({ message: "Shipment not found" });

    // Basic idempotency: prevent duplicate scan within 2 minutes for same {status, actor.role}
    const actorRole = (req.user?.role || "").toLowerCase();
    const now = new Date();
    const last = shipment.scans?.[shipment.scans.length - 1];
    if (last) {
      const lastRole = (last.actor?.role || "").toLowerCase();
      const sameRole = lastRole === actorRole;
      const sameStatus = last.status === status;
      const within2min = now - new Date(last.createdAt) < 2 * 60 * 1000;
      if (sameRole && sameStatus && within2min) {
        // Return current state without adding a duplicate
        return res.status(200).json(buildTrackingPayload(shipment));
      }
    }

    // Apply scan (uses Step 2 logic: forward-only, EXCEPTION rule, server timestamps)
    const adminOverride = req.user?.role === "admin";
    await shipment.applyScan(
      {
        status,
        location: sanitizeLocation(location),
        note,
        photoUrl,
        actor: { userId: req.user?._id, role: req.user?.role },
      },
      { adminOverride }
    );
    emitShipmentScanCreated({ ref: shipment.ref, status });
    await notifyShipmentMilestone(shipment, status);

    // Safety: ensure deliveredAt set if delivered (applyScan already does this)
    if (
      shipment.status === SHIPMENT_STATUS.DELIVERED &&
      !shipment.deliveredAt
    ) {
      shipment.deliveredAt = new Date();
      await shipment.save();
    }

    return res.status(200).json(buildTrackingPayload(shipment));
  } catch (err) {
    if (err?.code === "INVALID_TRANSITION") {
      return res.status(400).json({ message: err.message });
    }
    if (err?.code === "STALE_SCAN_TIMESTAMP") {
      return res.status(409).json({ message: err.message });
    }
    next(err);
  }
}
/**
 * PATCH /scan/:scanId (admin only)
 * Allows editing: note, location, status
 * Recomputes shipment.status, deliveredAt, lastScanAt from scans.
 */
export async function patchScan(req, res, next) {
  try {
    const scanId = String(req.params.scanId || "").trim();
    if (!scanId) return res.status(400).json({ message: "scanId is required" });

    const { note, location, status } = req.body || {};
    if (note && String(note).length > 500) {
      return res
        .status(400)
        .json({ message: "note must be <= 500 characters" });
    }

    // Find shipment containing this scan
    const shipment = await Shipment.findOne({ "scans._id": scanId });
    if (!shipment) return res.status(404).json({ message: "Scan not found" });

    // Get the subdocument
    const scan = shipment.scans.id(scanId);
    if (!scan) return res.status(404).json({ message: "Scan not found" });

    // Apply edits (admin override; no forward-only enforcement here)
    if (note !== undefined) scan.note = String(note);
    if (location !== undefined) scan.location = sanitizeLocation(location);
    if (status !== undefined) scan.status = String(status);

    // Recompute derived fields from full scans array
    recomputeShipmentFromScans(shipment);

    const beforeStatus = shipment.status;
    // (apply edits + recompute)
    recomputeShipmentFromScans(shipment);
    await shipment.save();

    // If final status changed, emit + optionally notify (only milestone statuses notify)
    if (shipment.status !== beforeStatus) {
      emitShipmentScanCreated({ ref: shipment.ref, status: shipment.status });
      await notifyShipmentMilestone(shipment, shipment.status);
    }
    return res.status(200).json(buildTrackingPayload(shipment));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /scan/:scanId (admin only)
 * Removes a scan and recomputes shipment fields.
 */
export async function deleteScan(req, res, next) {
  try {
    const scanId = String(req.params.scanId || "").trim();
    if (!scanId) return res.status(400).json({ message: "scanId is required" });

    const shipment = await Shipment.findOne({ "scans._id": scanId });
    if (!shipment) return res.status(404).json({ message: "Scan not found" });

    const scan = shipment.scans.id(scanId);
    if (!scan) return res.status(404).json({ message: "Scan not found" });

    // Remove it
    scan.deleteOne(); // or scan.remove() if older mongoose

    // Recompute derived fields from full scans array
    recomputeShipmentFromScans(shipment);
    const beforeStatus2 = shipment.status;
    // (remove + recompute)
    recomputeShipmentFromScans(shipment);
    await shipment.save();

    if (shipment.status !== beforeStatus2) {
      emitShipmentScanCreated({ ref: shipment.ref, status: shipment.status });
      await notifyShipmentMilestone(shipment, shipment.status);
    }
    return res.status(200).json(buildTrackingPayload(shipment));
  } catch (err) {
    next(err);
  }
}

/** ---------- helpers ---------- */

function sanitizeLocation(raw) {
  if (!raw) return undefined;
  const { city, country, lat, lng } = raw;
  const out = {};
  if (city !== undefined) out.city = String(city).trim();
  if (country !== undefined) out.country = String(country).trim();
  if (lat !== undefined) out.lat = Number(lat);
  if (lng !== undefined) out.lng = Number(lng);
  return out;
}

/**
 * Recomputes:
 * - shipment.status = status of the last chronological scan (if any), else keep as-is or BOOKED
 * - lastScanAt = createdAt of last chronological scan (or undefined)
 * - deliveredAt = earliest createdAt among scans with DELIVERED (or null if none)
 */
function recomputeShipmentFromScans(shipment) {
  const scans = (shipment.scans || [])
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  if (scans.length === 0) {
    // No scans left — keep status if already BOOKED, else fall back to BOOKED
    shipment.status = SHIPMENT_STATUS.BOOKED;
    shipment.lastScanAt = undefined;
    shipment.deliveredAt = null;
    return;
  }

  const last = scans[scans.length - 1];

  // Status = last scan’s status (admin corrected history defines truth)
  shipment.status = last.status;

  // lastScanAt = last createdAt
  shipment.lastScanAt = last.createdAt;

  // deliveredAt = earliest DELIVERED (if any), else null
  const deliveredScan = scans.find(
    (s) => s.status === SHIPMENT_STATUS.DELIVERED
  );
  shipment.deliveredAt = deliveredScan ? deliveredScan.createdAt : null;
}
