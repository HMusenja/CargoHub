// src/pages/new-shipment/quoteUtils.js
import { mapToPayload } from "./utils";

export function toNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

export function computeBillableWeightKg(items = [], volumetricDivisor = 5000, roundTo = 0.1) {
  let totalActual = 0;
  let totalVol = 0;

  for (const it of items) {
    const qty = Math.max(1, toNumber(it.quantity, 1));
    const w = Math.max(0, toNumber(it.weightKg, 0));
    const L = Math.max(0, toNumber(it.lengthCm, 0));
    const W = Math.max(0, toNumber(it.widthCm, 0));
    const H = Math.max(0, toNumber(it.heightCm, 0));

    totalActual += w * qty;
    const volEach = L && W && H ? (L * W * H) / volumetricDivisor : 0;
    totalVol += volEach * qty;
  }

  const billable = Math.max(totalActual, totalVol);
  const f = 1 / roundTo; // e.g. 10 for 0.1 kg
  return Math.ceil(billable * f) / f;
}

/**
 * Build the SAME flat payload your QuotePage/QuoteForm sends.
 * This is the typical contract many /rates/quote endpoints expect.
 */
export function buildFlatQuoteRequest(formData) {
  const p = mapToPayload(formData);

  const sender = p?.sender?.address || {};
  const receiver = p?.receiver?.address || {};

  const items = (p.contents || []).map((it) => ({
    quantity: Math.max(1, toNumber(it.quantity, 1)),
    weightKg: Math.max(0, toNumber(it.weightKg, 0)),
    lengthCm: Math.max(0, toNumber(it.lengthCm, 0)),
    widthCm: Math.max(0, toNumber(it.widthCm, 0)),
    heightCm: Math.max(0, toNumber(it.heightCm, 0)),
  }));

  const billableWeightKg = computeBillableWeightKg(items, 5000);

  return {
    // FLAT lane fields (mirror Instant Quote input keys)
    originCountry: String(sender.country || "").toUpperCase(),
    originPostalCode: String(sender.postalCode || ""),
    originCity: sender.city || "",

    destinationCountry: String(receiver.country || "").toUpperCase(),
    destinationPostalCode: String(receiver.postalCode || ""),
    destinationCity: receiver.city || "",

    // rating inputs
    serviceLevel: p.serviceLevel || "standard",
    billableWeightKg,

    // optional toggles (safe defaults)
    applyVat: false,
    vatPct: 0,
    remote: false,

    // optional echo for transparency / debugging
    items,

    // optional timing (if your quote uses them)
    pickup: p?.pickup?.date || null,
    dropoff: p?.dropoff?.date || null,
  };
}

/** Only call the endpoint when lane + billable are valid */
export function isFlatQuoteReady(req) {
  return Boolean(
    req?.originCountry &&
      req?.originPostalCode &&
      req?.destinationCountry &&
      req?.destinationPostalCode &&
      toNumber(req?.billableWeightKg, 0) > 0
  );
}
