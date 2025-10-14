// src/services/quoteService.js
import { priceQuote } from "../utils/priceCalculator.js";
import RateCard from "../models/RateCard.js";
import { getZoneForAddress, isRemote } from "../utils/zones.js";
import { calcBillableWeight } from "../utils/weightCalculator.js";
import { calculateEta, getTransitDaysFromMap, DEFAULT_TRANSIT_MAP } from "../utils/eta.js";
import { ratesConfig } from "../config/ratesConfig.js";

export async function buildQuoteFromShipmentPayload(payload) {
  const { sender, receiver, contents, serviceLevel } = payload;

  const origin = {
    country: String(sender?.address?.country || "").toUpperCase(),
    postalCode: String(sender?.address?.postalCode || ""),
    city: String(sender?.address?.city || ""),
  };
  const destination = {
    country: String(receiver?.address?.country || "").toUpperCase(),
    postalCode: String(receiver?.address?.postalCode || ""),
    city: String(receiver?.address?.city || ""),
  };

  // Zones + remote same as controller
  const originZone = getZoneForAddress(origin);
  const destinationZone = getZoneForAddress(destination);
  const remote = isRemote(destination);

  // Compute weights the same way the controller does
  // Aggregate items to actual weight / dims / quantity
  const qty = (contents || []).reduce((s, it) => s + Number(it?.quantity || 1), 0);
  const actualWeight = (contents || []).reduce((s, it) => s + Number(it?.weightKg || 0) * Number(it?.quantity || 1), 0);

  // Use first item's dims if fully present
  const first = (contents || [])[0] || {};
  const dimsCm = (first.lengthCm && first.widthCm && first.heightCm)
    ? { L: Number(first.lengthCm), W: Number(first.widthCm), H: Number(first.heightCm) }
    : null;

  const { actualWeightKg, volumetricWeightKg, billableWeightKg } = calcBillableWeight({
    actualWeightKg: actualWeight,
    dimsCm,
    quantity: qty,
    volumetricDivisor: ratesConfig.volumetricDivisor,
    roundStepKg: ratesConfig.roundingStepKg,
  });

  // Use the same finder the controller uses
  const rateCards = await RateCard.findActiveForZones({
    originZone,
    destinationZone,
    quoteDate: new Date(),
  });
  if (!rateCards.length) {
    const err = new Error(`No rates available from ${originZone} to ${destinationZone}`);
    err.status = 422; // make it a client error, not 500
    throw err;
  }

  // Price with same options as controller
  const priced = priceQuote({
    rateCards,
    billableWeightKg,
    options: {
      serviceLevel: serviceLevel || "standard",
      applyVat: ratesConfig.vatApply,
      vatPct: ratesConfig.vatPct,
      remote,
      moneyRounding: 2,
      currencyFallback: "EUR",
    },
  });

  const transitDays =
    priced.transitDays ??
    getTransitDaysFromMap({
      originZone,
      destinationZone,
      serviceLevel: priced.serviceLevel,
      transitMap: DEFAULT_TRANSIT_MAP,
    }) ?? 0;

  const { etaISO } = calculateEta({
    startTime: new Date(),
    transitDays,
    businessDays: true,
    holidays: ratesConfig.localHolidays,
    shipCutoffHourLocal: ratesConfig.shipCutoffHour,
  });

  return {
    currency: priced.currency,
    total: priced.total,
    billableWeightKg,              // echo back for UI consistency
    serviceLevel: priced.serviceLevel,
    origin,
    destination,
    breakdown: priced.priceBreakdown,
    etaISO,
    notes: priced.notes || "",
    minChargeApplied: priced.minChargeApplied,
    originZone,
    destinationZone,
    actualWeightKg,
    volumetricWeightKg,
    transitDays,
  };
}
