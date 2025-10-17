// controllers/scanController.js
import Shipment, { SHIPMENT_STATUS } from "../models/Shipment.js";
import { buildTrackingPayload } from "./_trackingFormatter.js";
import { emitShipmentScanCreated } from "../realtime/socket.js";
import { notifyShipmentMilestone } from "../services/notifications.js";

const DEFAULT_LOCATION_STR = process.env.LOCATION || "Unknown";

// Optional: map legacy scan “type” → canonical SHIPMENT_STATUS
const LEGACY_TO_STATUS = {
  INTAKE: SHIPMENT_STATUS.PICKED_UP,
  BAGGED: SHIPMENT_STATUS.IN_TRANSIT,
  LOADED: SHIPMENT_STATUS.IN_TRANSIT,
  UNLOADED: SHIPMENT_STATUS.AT_HUB,
  ARRIVED_HUB: SHIPMENT_STATUS.AT_HUB,
  CUSTOMS_IN: SHIPMENT_STATUS.IN_TRANSIT,
  CUSTOMS_OUT: SHIPMENT_STATUS.IN_TRANSIT,
  IN_TRANSIT: SHIPMENT_STATUS.IN_TRANSIT,
  OUT_FOR_DELIVERY: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  DELIVERED: SHIPMENT_STATUS.DELIVERED,
  RETURNED: SHIPMENT_STATUS.EXCEPTION,
  DAMAGED: SHIPMENT_STATUS.EXCEPTION,
  LOST: SHIPMENT_STATUS.EXCEPTION,
  HOLD: SHIPMENT_STATUS.EXCEPTION,

  // allow canonical inputs too
  BOOKED: SHIPMENT_STATUS.BOOKED,
  PICKED_UP: SHIPMENT_STATUS.PICKED_UP,
  AT_HUB: SHIPMENT_STATUS.AT_HUB,
  EXCEPTION: SHIPMENT_STATUS.EXCEPTION,
};


export async function postScan(req, res, next) {
  try {
    const refClean = String(req.body?.ref || "").trim().toUpperCase();
    if (!refClean) return res.status(400).json({ message: "ref is required" });

    // Prefer canonical `status`; else map from legacy `type`
    const rawState = String(req.body?.status ?? req.body?.type ?? "")
      .trim()
      .toUpperCase();
    if (!rawState) {
      return res.status(400).json({ message: "status/type is required" });
    }
    const targetStatus = LEGACY_TO_STATUS[rawState] || SHIPMENT_STATUS[rawState];
    if (!targetStatus) {
      return res.status(400).json({ message: `Unsupported status/type: ${rawState}` });
    }

    const note = req.body?.note ? String(req.body.note).trim() : undefined;
    if (note && note.length > 500) {
      return res.status(400).json({ message: "note must be <= 500 characters" });
    }

    // Normalize location: accept object or free-text; default to env
    let loc = req.body?.location;
    if (!loc) {
      loc = { city: DEFAULT_LOCATION_STR };
    } else if (typeof loc === "string") {
      loc = { city: loc };
    } else {
      loc = sanitizeLocation(loc);
    }

    const actor = { userId: req.user?._id, role: req.user?.role };
    if (!actor.userId) return res.status(401).json({ message: "Unauthorized" });

    // Find shipment
    const shipment = await Shipment.findOne({ ref: refClean });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    // Idempotency: prevent accidental double-scan within 2 minutes for same {status, actor.role}
    const now = new Date();
    const last = shipment.scans?.[shipment.scans.length - 1];
    if (last) {
      const sameRole = (last.actor?.role || "").toLowerCase() === (actor.role || "").toLowerCase();
      const sameStatus = last.status === targetStatus;
      const within2min = now - new Date(last.createdAt) < 2 * 60 * 1000;
      if (sameRole && sameStatus && within2min) {
        return res.status(200).json(buildTrackingPayload(shipment));
      }
    }

    // Apply scan (uses your model guard: forward-only + EXCEPTION rules)
    const adminOverride = req.user?.role === "admin";
    await shipment.applyScan(
      { status: targetStatus, location: loc, note, actor, photoUrl: req.body?.photoUrl },
      { adminOverride }
    );

    // Emit + notify (async)
    emitShipmentScanCreated({ ref: shipment.ref, status: targetStatus });
    await notifyShipmentMilestone(shipment, targetStatus);

    // Safety: deliveredAt ensured by applyScan; keep just in case
    if (shipment.status === SHIPMENT_STATUS.DELIVERED && !shipment.deliveredAt) {
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

/**
 * GET /api/shipments/:ref/scans
 * Query:
 *  - order: "asc" | "desc"  (default: "asc")
 *  - page: number           (default: 1)
 *  - limit: number          (default: 50, max 200)
 *
 * Response:
 *  { data: [ { _id, status, createdAt, location, note, actor, photoUrl } ],
 *    page, totalPages, total, ref, lastScanAt, status }
 */


export async function getShipmentScans(req, res, next) {
  try {
    const ref = String(req.params.ref || "").trim().toUpperCase();
    if (!ref) return res.status(400).json({ message: "ref is required" });

    const order = (req.query.order || "asc").toString().toLowerCase() === "desc" ? "desc" : "asc";
    const page = Math.max(parseInt(req.query.page || "1", 10) || 1, 1);
    const rawLimit = Math.max(parseInt(req.query.limit || "50", 10) || 50, 1);
    const limit = Math.min(rawLimit, 200);

    const shipment = await Shipment
      .findOne({ ref })
      .select({
        ref: 1,
        status: 1,
        lastScanAt: 1,
        scans: 1,
      })
      .lean();

    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const scans = (shipment.scans || []).slice().sort((a, b) => {
      const da = +new Date(a.createdAt);
      const db = +new Date(b.createdAt);
      return order === "asc" ? da - db : db - da;
    });

    const total = scans.length;
    const totalPages = total ? Math.ceil(total / limit) : 0;
    const start = (page - 1) * limit;
    const data = scans.slice(start, start + limit).map((s) => ({
      _id: s._id,
      status: s.status,
      createdAt: s.createdAt,
      location: s.location,
      note: s.note,
      actor: s.actor,       // { userId, role }
      photoUrl: s.photoUrl,
    }));

    return res.json({
      ref: shipment.ref,
      status: shipment.status,
      lastScanAt: shipment.lastScanAt || null,
      data,
      page,
      totalPages,
      total,
      order,
      limit,
    });
  } catch (err) {
    next(err);
  }
}
