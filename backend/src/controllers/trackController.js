// controllers/trackController.js
import Shipment, { SHIPMENT_STATUS, SHIPMENT_MILESTONES } from "../models/Shipment.js";
import { buildTrackingPayload } from "./_trackingFormatter.js";

/**
 * GET /track/:ref  (public)
 */
export async function getTrackingByRef(req, res, next) {
  try {
    const ref = String(req.params.ref || "").trim().toUpperCase();
    if (!ref) return res.status(400).json({ message: "Missing shipment reference" });

    // Projection keeps response lean; we’ll compute from these fields
    const shipment = await Shipment.findOne({ ref })
      .select(
        "ref status sender receiver contents serviceLevel quote scans lastScanAt deliveredAt archived archivedAt"
      )
      .lean();

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    // Optional archive behavior if you later add archived/archivedAt to schema
    if (shipment.archived || shipment.archivedAt) {
      return res.status(410).json({ message: "Shipment is archived" });
    }

    // Compute origin/destination from embedded quote (preferred) or sender/receiver
    const origin = shipment.quote?.origin?.city
      ? {
          city: shipment.quote.origin.city,
          country: shipment.quote.origin.country,
          postalCode: shipment.quote.origin.postalCode,
        }
      : {
          city: shipment.sender?.address?.city,
          country: shipment.sender?.address?.country,
          postalCode: shipment.sender?.address?.postalCode,
        };

    const destination = shipment.quote?.destination?.city
      ? {
          city: shipment.quote.destination.city,
          country: shipment.quote.destination.country,
          postalCode: shipment.quote.destination.postalCode,
        }
      : {
          city: shipment.receiver?.address?.city,
          country: shipment.receiver?.address?.country,
          postalCode: shipment.receiver?.address?.postalCode,
        };

    // Items summary
    const itemCount = Array.isArray(shipment.contents) ? shipment.contents.length : 0;
    const totalQty = (shipment.contents || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
    const totalWeightKg = (shipment.contents || []).reduce(
      (acc, it) => acc + (Number(it.weightKg) || 0) * (it.quantity || 1),
      0
    );

    const itemsSummary = {
      itemCount,
      totalQty,
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
    };

    // Timeline: scans sorted oldest → newest
    const timeline = (shipment.scans || [])
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((s) => ({
        status: s.status,
        createdAt: s.createdAt,
        location: s.location || null,
        note: s.note || "",
        actor: s.actor ? { role: s.actor.role } : null, // avoid leaking internal IDs publicly
        photoUrl: s.photoUrl || null,
      }));

    // Progress index
    const currentIdx = Math.max(
      0,
      SHIPMENT_MILESTONES.indexOf(shipment.status ?? SHIPMENT_STATUS.BOOKED)
    );

    const progress = {
      currentIndex: currentIdx === -1 ? 0 : currentIdx,
      milestones: SHIPMENT_MILESTONES,
    };

    // Estimated delivery (if you set quote.etaISO earlier)
    const estimatedDelivery = shipment.quote?.etaISO || null;

    const payload = {
      ref: shipment.ref,
      status: shipment.status,
      origin,
      destination,
      serviceLevel: shipment.serviceLevel,
      itemsSummary,
      estimatedDelivery,
      deliveredAt: shipment.deliveredAt || null,
      progress,
      timeline,
    };

    return res.json(payload);
  } catch (err) {
    next(err);
  }
}
