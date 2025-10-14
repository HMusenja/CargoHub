// src/pages/new-shipment/quoteBridge.js
import { mapToPayload } from "./utils";

// small coercer
const N = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

// Optional helper you already have – keep if you still want it elsewhere
export function computeBillable(items = [], volFactor = 5000) {
  let actual = 0;
  let volumetric = 0;

  for (const it of items) {
    const qty = Math.max(1, N(it.quantity, 1));
    const w = Math.max(0, N(it.weightKg, 0));
    const L = Math.max(0, N(it.lengthCm, 0));
    const W = Math.max(0, N(it.widthCm, 0));
    const H = Math.max(0, N(it.heightCm, 0));

    actual += w * qty;
    if (L > 0 && W > 0 && H > 0 && volFactor > 0) {
      volumetric += qty * ((L * W * H) / volFactor);
    }
  }

  return { actualKg: actual, volumetricKg: volumetric, billableKg: Math.max(actual, volumetric) };
}

// ---- NEW: helpers the backend expects ----
function totalActualWeightKg(items = []) {
  return items.reduce((sum, it) => {
    const qty = Math.max(1, N(it.quantity, 1));
    const w = Math.max(0, N(it.weightKg, 0));
    return sum + qty * w;
  }, 0);
}

function totalQuantity(items = []) {
  return items.reduce((sum, it) => sum + Math.max(1, N(it.quantity, 1)), 0);
}

// Per-piece dims: use first item only if fully present; otherwise omit (null)
function perPieceDimsOrNull(items = []) {
  const it = items[0] || {};
  const L = N(it.lengthCm, 0);
  const W = N(it.widthCm, 0);
  const H = N(it.heightCm, 0);
  return L > 0 && W > 0 && H > 0 ? { L, W, H } : null;
}

/**
 * Build the EXACT payload /api/rates/quote expects.
 * Uses mapToPayload to normalize values first, then aggregates.
 */
export function buildInstantQuotePayload(formData) {
  if (!formData) return null;

  const data = mapToPayload(formData);
  const s = data?.sender?.address || {};
  const r = data?.receiver?.address || {};
  const items = Array.isArray(data?.contents) ? data.contents : [];

  return {
    serviceLevel: data?.serviceLevel || "standard",
    origin: {
      country: (s.country || "").toUpperCase().trim(),
      postalCode: (s.postalCode || "").trim(),
      city: (s.city || "").trim(),
    },
    destination: {
      country: (r.country || "").toUpperCase().trim(),
      postalCode: (r.postalCode || "").trim(),
      city: (r.city || "").trim(),
    },
    quantity: totalQuantity(items),
    weightKg: totalActualWeightKg(items), // <-- ACTUAL total, backend computes billable itself
    dimsCm: perPieceDimsOrNull(items),    // optional; null if incomplete
    // pickup/dropoff can be included if your validator accepts them:
    // pickup: data.pickup?.date || null,
    // dropoff: data.dropoff?.date || null,
  };
}

/**
 * Only call getQuote when the minimal required fields exist.
 */
export function isInstantQuoteReady(p) {
  if (!p) return false;
  const hasOrigin =
    !!p.origin?.country && (!!p.origin?.postalCode || !!p.origin?.city);
  const hasDest =
    !!p.destination?.country && (!!p.destination?.postalCode || !!p.destination?.city);
  const hasSvc = !!p.serviceLevel;
  const hasQty = Number(p.quantity) > 0;
  const hasWeight = Number(p.weightKg) > 0;
  return hasOrigin && hasDest && hasSvc && hasQty && hasWeight;
}
