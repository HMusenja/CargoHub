// src/controllers/ratesController.js
import createError from "http-errors";
import RateCard from "../models/RateCard.js";
import { getZoneForAddress, isRemote } from "../utils/zones.js";
import { calcBillableWeight } from "../utils/weightCalculator.js";
import { priceQuote } from "../utils/priceCalculator.js";
import { calculateEta, getTransitDaysFromMap, DEFAULT_TRANSIT_MAP } from "../utils/eta.js";
import { ratesConfig } from "../config/ratesConfig.js";

/**
 * POST /api/rates/quote
 * Requires req.quoteInput from validateQuoteRequest middleware.
 */
export async function quoteRatesController(req, res, next) {
  try {
    const input = req.quoteInput; // normalized payload from middleware
    if (!input) return next(createError(400, "Missing quote input"));

    // 1) Determine zones + remote flag
    const originZone = getZoneForAddress(input.origin);
    const destinationZone = getZoneForAddress(input.destination);
    const remote = isRemote(input.destination);

    // 2) Compute weights
    const { actualWeightKg, volumetricWeightKg, billableWeightKg } = calcBillableWeight({
      actualWeightKg: input.weightKg,
      dimsCm: input.dimsCm,
      quantity: input.quantity,
      volumetricDivisor: ratesConfig.volumetricDivisor,
      roundStepKg: ratesConfig.roundingStepKg,
    });

    // 3) Fetch candidate rates
    const rateCards = await RateCard.findActiveForZones({
      originZone,
      destinationZone,
      quoteDate: new Date(),
    });
    if (!rateCards.length) {
      return next(
        createError(404, `No rates available from ${originZone} to ${destinationZone}`)
      );
    }

    // 4) Price (cheapest or forced service level)
    let priced;
    try {
      priced = priceQuote({
        rateCards,
        billableWeightKg,
        options: {
          serviceLevel: input.serviceLevel,      // optional
          applyVat: ratesConfig.vatApply,
          vatPct: ratesConfig.vatPct,
          remote,
          moneyRounding: 2,
          currencyFallback: "EUR",
        },
      });
    } catch (err) {
      return next(createError(422, err.message));
    }

    // 5) ETA
    const transitDays =
      priced.transitDays ??
      getTransitDaysFromMap({
        originZone,
        destinationZone,
        serviceLevel: priced.serviceLevel,
        transitMap: DEFAULT_TRANSIT_MAP,
      }) ??
      0;

    const { etaISO } = calculateEta({
      startTime: new Date(),
      transitDays,
      businessDays: true,
      holidays: ratesConfig.localHolidays,
      shipCutoffHourLocal: ratesConfig.shipCutoffHour,
    });

    // 6) Respond
    return res.json({
      currency: priced.currency,
      total: priced.total,
      priceBreakdown: priced.priceBreakdown,
      actualWeightKg,
      volumetricWeightKg,
      billableWeightKg,
      serviceLevel: priced.serviceLevel,
      originZone,
      destinationZone,
      transitDays,
      etaISO,
      notes: priced.notes,
      minChargeApplied: priced.minChargeApplied,
      inputEcho: {
        origin: input.origin,
        destination: input.destination,
        quantity: input.quantity,
        dimsCm: input.dimsCm,
      },
    });
  } catch (err) {
    next(createError(500, err.message || "Quote calculation failed"));
  }
}
