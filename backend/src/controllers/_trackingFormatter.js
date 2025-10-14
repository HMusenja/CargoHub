// controllers/_trackingFormatter.js
import { SHIPMENT_MILESTONES, SHIPMENT_STATUS } from "../models/Shipment.js";

export function buildTrackingPayload(s) {
  const doc = typeof s.toObject === "function" ? s.toObject() : s;

  const origin = doc.quote?.origin?.city
    ? { city: doc.quote.origin.city, country: doc.quote.origin.country, postalCode: doc.quote.origin.postalCode }
    : { city: doc.sender?.address?.city, country: doc.sender?.address?.country, postalCode: doc.sender?.address?.postalCode };

  const destination = doc.quote?.destination?.city
    ? { city: doc.quote.destination.city, country: doc.quote.destination.country, postalCode: doc.quote.destination.postalCode }
    : { city: doc.receiver?.address?.city, country: doc.receiver?.address?.country, postalCode: doc.receiver?.address?.postalCode };

  const itemCount = Array.isArray(doc.contents) ? doc.contents.length : 0;
  const totalQty = (doc.contents || []).reduce((a, it) => a + (it.quantity || 0), 0);
  const totalWeightKg = (doc.contents || []).reduce(
    (a, it) => a + (Number(it.weightKg) || 0) * (it.quantity || 1),
    0
  );

  const itemsSummary = {
    itemCount,
    totalQty,
    totalWeightKg: Number(totalWeightKg.toFixed(2)),
  };

  const timeline = (doc.scans || [])
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((scan) => ({
      status: scan.status,
      createdAt: scan.createdAt,
      location: scan.location || null,
      note: scan.note || "",
      actor: scan.actor ? { role: scan.actor.role } : null, // no userId in public response
      photoUrl: scan.photoUrl || null,
    }));

  const currentIndex = Math.max(0, SHIPMENT_MILESTONES.indexOf(doc.status ?? SHIPMENT_STATUS.BOOKED));

  return {
    ref: doc.ref,
    status: doc.status,
    origin,
    destination,
    serviceLevel: doc.serviceLevel,
    itemsSummary,
    estimatedDelivery: doc.quote?.etaISO || null,
    deliveredAt: doc.deliveredAt || null,
    progress: { currentIndex: currentIndex === -1 ? 0 : currentIndex, milestones: SHIPMENT_MILESTONES },
    timeline,
  };
}
