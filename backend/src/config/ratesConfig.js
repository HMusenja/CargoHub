// src/config/ratesConfig.js
// Central config for rate/quote calculations.
// Reads from env, provides sane defaults.

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const ratesConfig = {
  volumetricDivisor: toNumber(process.env.RATE_VOLUMETRIC_DIVISOR, 5000),
  roundingStepKg: toNumber(process.env.ROUNDING_STEP_KG, 0.5),
  vatPct: toNumber(process.env.VAT_PCT, 0), // 0 = no VAT
  vatApply: String(process.env.VAT_APPLY || "false").toLowerCase() === "true",
  shipCutoffHour: toNumber(process.env.SHIP_CUTOFF_HOUR, 16),
  localHolidays: process.env.LOCAL_HOLIDAYS
    ? process.env.LOCAL_HOLIDAYS.split(",").map((d) => d.trim())
    : [],
};
