// src/utils/priceCalculator.js

/**
 * Price Calculator for Quotes
 *
 * Inputs:
 * - rateCards: array of RateCard docs (lean objects) from Mongo
 * - billableWeightKg: number
 * - options:
 *    - serviceLevel?: "economy" | "standard" | "express"
 *    - applyVat?: boolean (default false)
 *    - vatPct?: number (e.g., 19 for 19%)
 *    - remote?: boolean (apply remoteAreaSurchargePct if true)
 *    - currencyFallback?: string (default "EUR")
 *    - moneyRounding?: number (2 = cents; default 2)
 *
 * Output:
 * {
 *   currency,
 *   total,
 *   priceBreakdown: {
 *     base,
 *     weight,
 *     fuel,
 *     remote,
 *     vat,
 *     subtotalBeforeVat,
 *     total
 *   },
 *   tier: { minKg, maxKg, pricePerKg },
 *   serviceLevel,
 *   originZone,
 *   destinationZone,
 *   transitDays,
 *   notes,
 *   minChargeApplied: boolean
 * }
 */

function roundMoney(n, decimals = 2) {
  const f = Math.pow(10, decimals);
  return Math.round((Number(n) + Number.EPSILON) * f) / f;
}

function findTier(perKgRates = [], billableWeightKg) {
  // perKgRates are validated/sorted by the schema pre-validate hook
  for (const t of perKgRates) {
    const within =
      (billableWeightKg >= t.minKg) &&
      (t.maxKg == null || billableWeightKg < t.maxKg);
    if (within) return t;
  }
  // Fallback: use the last (should be open-ended)
  return perKgRates[perKgRates.length - 1] || null;
}

function computeWithRateCard(rate, billableWeightKg, {
  applyVat = false,
  vatPct = 0,
  remote = false,
  moneyRounding = 2,
  currencyFallback = "EUR",
} = {}) {
  if (!rate) throw new Error("No RateCard provided to compute price");

  const currency = rate.currency || currencyFallback;
  const tier = findTier(rate.perKgRates, billableWeightKg);
  if (!tier) {
    throw new Error("No valid tier found for the given billable weight");
  }

  // Charges
  const base = Number(rate.baseFee || 0);
  const weight = billableWeightKg * Number(tier.pricePerKg);

  // Percent surcharges on (base + weight)
  const pctBase = base + weight;
  const fuel = pctBase * (Number(rate.fuelSurchargePct || 0) / 100);
  const remoteAmt = remote ? pctBase * (Number(rate.remoteAreaSurchargePct || 0) / 100) : 0;

  // Subtotal before VAT
  let subtotalBeforeVat = base + weight + fuel + remoteAmt;

  // Enforce minCharge
  let minChargeApplied = false;
  const minCharge = Number(rate.minCharge || 0);
  if (subtotalBeforeVat < minCharge) {
    subtotalBeforeVat = minCharge;
    minChargeApplied = true;
  }

  // VAT
  const vat = applyVat ? subtotalBeforeVat * (Number(vatPct) / 100) : 0;
  const total = subtotalBeforeVat + vat;

  // Round money fields
  const rounded = {
    base: roundMoney(base, moneyRounding),
    weight: roundMoney(weight, moneyRounding),
    fuel: roundMoney(fuel, moneyRounding),
    remote: roundMoney(remoteAmt, moneyRounding),
    subtotalBeforeVat: roundMoney(subtotalBeforeVat, moneyRounding),
    vat: roundMoney(vat, moneyRounding),
    total: roundMoney(total, moneyRounding),
  };

  return {
    currency,
    total: rounded.total,
    priceBreakdown: rounded,
    tier: { minKg: tier.minKg, maxKg: tier.maxKg, pricePerKg: tier.pricePerKg },
    serviceLevel: rate.serviceLevel,
    originZone: rate.originZone,
    destinationZone: rate.destinationZone,
    transitDays: rate.transitDays,
    notes: rate.notes || "",
    minChargeApplied,
  };
}

/**
 * Choose the cheapest rate among candidates for a given billableWeightKg.
 * If serviceLevel is specified, filters to that serviceLevel first.
 */
export function pickBestRateCard(rateCards = [], billableWeightKg, {
  serviceLevel,
  applyVat = false,
  vatPct = 0,
  remote = false,
  moneyRounding = 2,
  currencyFallback = "EUR",
} = {}) {
  if (!Array.isArray(rateCards) || rateCards.length === 0) {
    throw new Error("No rate cards available for this lane");
  }

  const candidates = serviceLevel
    ? rateCards.filter(rc => String(rc.serviceLevel).toLowerCase() === String(serviceLevel).toLowerCase())
    : rateCards;

  if (candidates.length === 0) {
    throw new Error(`No rate cards match service level "${serviceLevel}"`);
  }

  let best = null;

  for (const rc of candidates) {
    const quote = computeWithRateCard(rc, billableWeightKg, {
      applyVat, vatPct, remote, moneyRounding, currencyFallback,
    });
    if (!best || quote.total < best.total) {
      best = quote;
    }
  }

  return best;
}

/**
 * Public: Given rateCards + billable weight, produce the final priced quote.
 */
export function priceQuote({
  rateCards,
  billableWeightKg,
  options = {},
}) {
  return pickBestRateCard(rateCards, billableWeightKg, options);
}

// Also export the low-level function in case you already selected a RateCard
export { computeWithRateCard };

