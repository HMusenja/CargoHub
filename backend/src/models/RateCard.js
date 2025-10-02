// src/models/RateCard.js
import { Schema, model } from "mongoose";

const tierSchema = new Schema(
  {
    minKg: { type: Number, required: true, min: 0 },
    maxKg: { type: Number, default: null }, // null → open-ended
    pricePerKg: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const rateCardSchema = new Schema(
  {
    serviceLevel: {
      type: String,
      enum: ["standard", "express", "economy"],
      required: true,
      index: true,
    },
    originZone: { type: String, required: true, index: true },
    destinationZone: { type: String, required: true, index: true },

    currency: { type: String, default: "EUR" },
    baseFee: { type: Number, default: 0, min: 0 },
    minCharge: { type: Number, default: 0, min: 0 },

    perKgRates: {
      type: [tierSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "perKgRates must contain at least one tier",
      },
    },

    volumetricDivisor: { type: Number, default: 5000, min: 1 },
    fuelSurchargePct: { type: Number, default: 0, min: 0 },
    remoteAreaSurchargePct: { type: Number, default: 0, min: 0 },

    transitDays: { type: Number, required: true, min: 0 },

    effectiveFrom: { type: Date, default: () => new Date(0) },
    effectiveTo: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// compound index
rateCardSchema.index(
  {
    serviceLevel: 1,
    originZone: 1,
    destinationZone: 1,
    isActive: 1,
    effectiveFrom: 1,
    effectiveTo: 1,
  },
  { name: "ratecard_lookup_idx" }
);

// pre-validation: check tier overlaps
rateCardSchema.pre("validate", function (next) {
  const tiers = this.perKgRates || [];
  tiers.sort((a, b) => a.minKg - b.minKg);

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    if (t.maxKg != null && t.maxKg <= t.minKg) {
      return next(new Error(`Invalid tier: maxKg must be > minKg`));
    }
    if (i > 0) {
      const prev = tiers[i - 1];
      if (prev.maxKg == null || prev.maxKg > t.minKg) {
        return next(new Error(`Tier overlap between ${i - 1} and ${i}`));
      }
    }
  }
  next();
});

// static helper to fetch active ratecards
rateCardSchema.statics.findActiveForZones = function ({
  originZone,
  destinationZone,
  serviceLevel,
  quoteDate = new Date(),
}) {
  const qDate = new Date(quoteDate);
  const query = {
    originZone,
    destinationZone,
    isActive: true,
    effectiveFrom: { $lte: qDate },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: qDate } }],
  };
  if (serviceLevel) query.serviceLevel = serviceLevel;
  return this.find(query).sort({ effectiveFrom: -1 }).lean();
};

export default model("RateCard", rateCardSchema);
