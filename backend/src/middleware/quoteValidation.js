// src/middleware/quoteValidation.js
// Validates and normalizes a QuoteRequest body.
// - Required: origin{country}, destination{country}, weightKg>0, dimsCm{L,W,H} >= 0, quantity >= 1
// - Optional: origin.postalCode, destination.postalCode, serviceLevel ("economy"|"standard"|"express")
// - Optional units: weightUnit ("kg"|"g"|"lb"), dimsUnit ("cm"|"mm"|"m"|"in")
// - Normalizes to: country = ISO2 uppercase (best-effort), weight in KG, dims in CM

import createError from "http-errors";

// If you created src/utils/zones.js, we'll try to use its normalizeCountry; otherwise we fall back.
let normalizeCountryFromZones = null;
try {
  // prefer a named export if you added one; otherwise read from __ZONE_CONFIG__
  const zones = await import("../utils/zones.js");
  normalizeCountryFromZones =
    zones.normalizeCountry ||
    (zones.__ZONE_CONFIG__ && zones.__ZONE_CONFIG__.normalizeCountry) ||
    null;
} catch {
  // zones.js not present yet → fine, we use a local normalizer
}

function localNormalizeCountry(input = "") {
  const s = String(input).trim();
  if (!s) return "";
  if (s.length === 2) return s.toUpperCase();
  const key = s.toLowerCase().replace(/\s+/g, "");
  const map = {
    germany: "DE",
    deutschland: "DE",
    france: "FR",
    espana: "ES",
    spain: "ES",
    italia: "IT",
    italy: "IT",
    belgium: "BE",
    belgique: "BE",
    nederland: "NL",
    netherlands: "NL",
    austria: "AT",
    poland: "PL",
    unitedkingdom: "GB",
    uk: "GB",
    ireland: "IE",
    portugal: "PT",
    cameroon: "CM",
    senegal: "SN",
    nigeria: "NG",
    kenya: "KE",
    morocco: "MA",
    southafrica: "ZA",
    usa: "US",
    unitedstates: "US",
    canada: "CA",
  };
  return map[key] || s.toUpperCase();
}

const normalizeCountry = (c) =>
  (normalizeCountryFromZones ? normalizeCountryFromZones(c) : localNormalizeCountry(c));

/* ---------------- unit conversions ---------------- */

function toKg(value, unit = "kg") {
  const v = Number(value);
  if (!Number.isFinite(v)) return NaN;
  switch (String(unit).toLowerCase()) {
    case "kg":
      return v;
    case "g":
      return v / 1000;
    case "lb":
    case "lbs":
    case "pound":
    case "pounds":
      return v * 0.45359237;
    default:
      return NaN;
  }
}

function toCm(value, unit = "cm") {
  const v = Number(value);
  if (!Number.isFinite(v)) return NaN;
  switch (String(unit).toLowerCase()) {
    case "cm":
      return v;
    case "mm":
      return v / 10;
    case "m":
    case "meter":
    case "metre":
      return v * 100;
    case "in":
    case "inch":
    case "inches":
      return v * 2.54;
    default:
      return NaN;
  }
}

/* ---------------- core validator ---------------- */

const ALLOWED_SERVICE = new Set(["economy", "standard", "express"]);

export default function validateQuoteRequest(req, res, next) {
  const errors = [];

  const body = req.body || {};
  const origin = body.origin || {};
  const destination = body.destination || {};
  const dims = body.dimsCm || body.dims || {}; // allow "dims" alias

  const weightUnit = (body.weightUnit || "kg").toLowerCase();
  const dimsUnit = (body.dimsUnit || "cm").toLowerCase();
  const quantityRaw = body.quantity ?? 1;

  // origin/destination
  const originCountry = normalizeCountry(origin.country);
  const destCountry = normalizeCountry(destination.country);
  const originPostal = origin.postalCode ? String(origin.postalCode).trim() : undefined;
  const destPostal = destination.postalCode ? String(destination.postalCode).trim() : undefined;

  if (!originCountry) errors.push({ field: "origin.country", message: "origin.country is required" });
  if (!destCountry) errors.push({ field: "destination.country", message: "destination.country is required" });

  // weight
  const weightKg = toKg(body.weightKg ?? body.weight, weightUnit);
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    errors.push({ field: "weightKg", message: "weightKg must be a number > 0 (supports kg/g/lb)" });
  }

  // dims
  const L = toCm(dims.L ?? dims.length ?? dims.l, dimsUnit);
  const W = toCm(dims.W ?? dims.width ?? dims.w, dimsUnit);
  const H = toCm(dims.H ?? dims.height ?? dims.h, dimsUnit);
  if (![L, W, H].every((n) => Number.isFinite(n) && n >= 0)) {
    errors.push({
      field: "dimsCm",
      message: "dimsCm.{L,W,H} must be numbers ≥ 0 (supports cm/mm/m/in)",
    });
  }

  // quantity
  const quantity = Number.parseInt(quantityRaw, 10);
  if (!Number.isFinite(quantity) || quantity < 1) {
    errors.push({ field: "quantity", message: "quantity must be an integer ≥ 1" });
  }

  // serviceLevel (optional)
  let serviceLevel = body.serviceLevel ? String(body.serviceLevel).toLowerCase() : undefined;
  if (serviceLevel && !ALLOWED_SERVICE.has(serviceLevel)) {
    errors.push({
      field: "serviceLevel",
      message: `serviceLevel must be one of: ${Array.from(ALLOWED_SERVICE).join(", ")}`,
    });
  }

 if (errors.length) {
  return next(
    createError(422, "Invalid quote request", { details: errors })
  );
}

  // Build normalized payload (countries ISO2, weight in KG, dims in CM)
  const normalized = {
    origin: {
      country: originCountry,
      postalCode: originPostal,
      city: origin.city || undefined,
    },
    destination: {
      country: destCountry,
      postalCode: destPostal,
      city: destination.city || undefined,
    },
    weightKg: Number(weightKg),
    dimsCm: { L: Number(L), W: Number(W), H: Number(H) },
    quantity,
    serviceLevel, // may be undefined
  };

  // Attach to request for controller consumption
  req.quoteInput = normalized;
  next();
}
