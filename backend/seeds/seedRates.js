import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js"
import RateCard from "../src/models/RateCard.js";

/**
 * Helper to build a RateCard doc
 */
function mkRate({
  serviceLevel,
  originZone,
  destinationZone,
  currency = "EUR",
  baseFee,
  minCharge,
  perKgRates,
  volumetricDivisor = 5000,
  fuelSurchargePct,
  remoteAreaSurchargePct,
  transitDays,
  effectiveFrom = new Date("2025-01-01T00:00:00.000Z"),
  effectiveTo = null,
  notes = "",
  isActive = true,
}) {
  return {
    serviceLevel,
    originZone,
    destinationZone,
    currency,
    baseFee,
    minCharge,
    perKgRates,
    volumetricDivisor,
    fuelSurchargePct,
    remoteAreaSurchargePct,
    transitDays,
    effectiveFrom,
    effectiveTo,
    notes,
    isActive,
  };
}

/**
 * Tier presets (values are realistic-ish; tweak for your business)
 * - 3 tiers: 0–5 kg, 5–20 kg, 20+ kg (open-ended)
 */
const TIERS = {
  EU_ECONOMY: [
    { minKg: 0,  maxKg: 5,  pricePerKg: 3.2 },
    { minKg: 5,  maxKg: 20, pricePerKg: 2.4 },
    { minKg: 20, maxKg: null, pricePerKg: 1.9 },
  ],
  EU_STANDARD: [
    { minKg: 0,  maxKg: 5,  pricePerKg: 4.2 },
    { minKg: 5,  maxKg: 20, pricePerKg: 3.1 },
    { minKg: 20, maxKg: null, pricePerKg: 2.4 },
  ],
  EU_EXPRESS: [
    { minKg: 0,  maxKg: 5,  pricePerKg: 6.0 },
    { minKg: 5,  maxKg: 20, pricePerKg: 4.9 },
    { minKg: 20, maxKg: null, pricePerKg: 3.8 },
  ],
  AFR_STANDARD: [
    { minKg: 0,  maxKg: 5,  pricePerKg: 8.0 },
    { minKg: 5,  maxKg: 20, pricePerKg: 6.2 },
    { minKg: 20, maxKg: null, pricePerKg: 5.1 },
  ],
  AFR_EXPRESS: [
    { minKg: 0,  maxKg: 5,  pricePerKg: 11.0 },
    { minKg: 5,  maxKg: 20, pricePerKg: 9.3 },
    { minKg: 20, maxKg: null, pricePerKg: 7.6 },
  ],
  INT_STANDARD: [
    { minKg: 0,  maxKg: 5,  pricePerKg: 7.0 },
    { minKg: 5,  maxKg: 20, pricePerKg: 5.6 },
    { minKg: 20, maxKg: null, pricePerKg: 4.4 },
  ],
  INT_EXPRESS: [
    { minKg: 0,  maxKg: 5,  pricePerKg: 9.5 },
    { minKg: 5,  maxKg: 20, pricePerKg: 7.9 },
    { minKg: 20, maxKg: null, pricePerKg: 6.2 },
  ],
};

const MATRIX = [
  // EU1 → EU1
  mkRate({
    serviceLevel: "economy",
    originZone: "EU1",
    destinationZone: "EU1",
    baseFee: 2.5,
    minCharge: 8.0,
    perKgRates: TIERS.EU_ECONOMY,
    fuelSurchargePct: 10,
    remoteAreaSurchargePct: 6,
    transitDays: 2,
    notes: "EU domestic economy",
  }),
  mkRate({
    serviceLevel: "standard",
    originZone: "EU1",
    destinationZone: "EU1",
    baseFee: 3.0,
    minCharge: 10.0,
    perKgRates: TIERS.EU_STANDARD,
    fuelSurchargePct: 12,
    remoteAreaSurchargePct: 8,
    transitDays: 1,
    notes: "EU domestic standard",
  }),
  mkRate({
    serviceLevel: "express",
    originZone: "EU1",
    destinationZone: "EU1",
    baseFee: 5.0,
    minCharge: 14.0,
    perKgRates: TIERS.EU_EXPRESS,
    fuelSurchargePct: 14,
    remoteAreaSurchargePct: 10,
    transitDays: 1,
    notes: "EU domestic express (D+1)",
  }),

  // EU1 → EU2
  mkRate({
    serviceLevel: "standard",
    originZone: "EU1",
    destinationZone: "EU2",
    baseFee: 4.0,
    minCharge: 12.0,
    perKgRates: TIERS.EU_STANDARD,
    fuelSurchargePct: 12,
    remoteAreaSurchargePct: 10,
    transitDays: 2,
    notes: "Intra-EU cross-zone standard",
  }),
  mkRate({
    serviceLevel: "express",
    originZone: "EU1",
    destinationZone: "EU2",
    baseFee: 6.0,
    minCharge: 16.0,
    perKgRates: TIERS.EU_EXPRESS,
    fuelSurchargePct: 14,
    remoteAreaSurchargePct: 12,
    transitDays: 1,
    notes: "Intra-EU cross-zone express",
  }),

  // EU2 → EU1
  mkRate({
    serviceLevel: "standard",
    originZone: "EU2",
    destinationZone: "EU1",
    baseFee: 4.0,
    minCharge: 12.0,
    perKgRates: TIERS.EU_STANDARD,
    fuelSurchargePct: 12,
    remoteAreaSurchargePct: 10,
    transitDays: 2,
    notes: "Intra-EU reverse flow standard",
  }),

  // EU1 → AFR1
  mkRate({
    serviceLevel: "standard",
    originZone: "EU1",
    destinationZone: "AFR1",
    baseFee: 8.0,
    minCharge: 22.0,
    perKgRates: TIERS.AFR_STANDARD,
    fuelSurchargePct: 15,
    remoteAreaSurchargePct: 12,
    transitDays: 5,
    notes: "EU → Africa standard",
  }),
  mkRate({
    serviceLevel: "express",
    originZone: "EU1",
    destinationZone: "AFR1",
    baseFee: 12.0,
    minCharge: 32.0,
    perKgRates: TIERS.AFR_EXPRESS,
    fuelSurchargePct: 18,
    remoteAreaSurchargePct: 14,
    transitDays: 3,
    notes: "EU → Africa express",
  }),

  // EU2 → AFR1
  mkRate({
    serviceLevel: "standard",
    originZone: "EU2",
    destinationZone: "AFR1",
    baseFee: 9.0,
    minCharge: 24.0,
    perKgRates: TIERS.AFR_STANDARD,
    fuelSurchargePct: 15,
    remoteAreaSurchargePct: 12,
    transitDays: 6,
    notes: "EU (outer) → Africa standard",
  }),

  // EU1 → INT (e.g., US/CA etc.)
  mkRate({
    serviceLevel: "standard",
    originZone: "EU1",
    destinationZone: "INT",
    baseFee: 7.0,
    minCharge: 20.0,
    perKgRates: TIERS.INT_STANDARD,
    fuelSurchargePct: 14,
    remoteAreaSurchargePct: 10,
    transitDays: 4,
    notes: "EU → INT standard",
  }),
  mkRate({
    serviceLevel: "express",
    originZone: "EU1",
    destinationZone: "INT",
    baseFee: 10.0,
    minCharge: 28.0,
    perKgRates: TIERS.INT_EXPRESS,
    fuelSurchargePct: 18,
    remoteAreaSurchargePct: 12,
    transitDays: 2,
    notes: "EU → INT express",
  }),
];

/**------------main---------- */
async function main() {
  await connectDB();

 
  console.log("🌱 Seeding RateCards…");

  // Upsert by (serviceLevel, originZone, destinationZone, effectiveFrom)
  const upserts = MATRIX.map(async (doc) => {
    const filter = {
      serviceLevel: doc.serviceLevel,
      originZone: doc.originZone,
      destinationZone: doc.destinationZone,
      effectiveFrom: doc.effectiveFrom,
    };
    const res = await RateCard.replaceOne(filter, doc, { upsert: true });
    return { key: `${doc.serviceLevel}:${doc.originZone}->${doc.destinationZone}`, res };
  });

  const results = await Promise.all(upserts);
  results.forEach(({ key, res }) => {
    const action =
      res.modifiedCount ? "updated" : res.upsertedCount ? "inserted" : "unchanged";
    console.log(`  • ${key} → ${action}`);
  });

  const count = await RateCard.countDocuments();
  console.log(`✅ Done. RateCards in DB: ${count}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});