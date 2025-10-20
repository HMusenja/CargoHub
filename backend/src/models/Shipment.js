// models/Shipment.js
import { Schema, model } from "mongoose";

export const SHIPMENT_STATUS = Object.freeze({
  BOOKED: "BOOKED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  AT_HUB: "AT_HUB",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  EXCEPTION: "EXCEPTION",
  CANCELED: "CANCELED", // kept for compatibility
});
const SHIPMENT_STATUS_VALUES = Object.values(SHIPMENT_STATUS);


const AddressSchema = new Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const PartySchema = new Schema({
  name: { type: String, required: true },
  company: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: AddressSchema, required: true },
});

const ContentItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  weightKg: { type: Number },
  lengthCm: { type: Number },
  widthCm: { type: Number },
  heightCm: { type: Number },
  valueCurrency: { type: String },
  valueAmount: { type: Number },
});

// NEW: small sub-schema to embed the computed quote
const QuoteBreakdownSchema = new Schema(
  {
    base: Number,
    weight: Number,
    fuel: Number,
    remote: Number,
    subtotalBeforeVat: Number,
    vat: Number,
    total: Number,
  },
  { _id: false }
);

const ShipmentQuoteSchema = new Schema(
  {
    currency: { type: String, default: "EUR" },
    total: { type: Number, required: true },
    billableWeightKg: { type: Number, required: true },
    serviceLevel: { type: String, enum: ["standard", "express"], required: true },
    origin: {
      country: String,
      postalCode: String,
      city: String,
    },
    destination: {
      country: String,
      postalCode: String,
      city: String,
    },
    breakdown: { type: QuoteBreakdownSchema },
    etaISO: { type: Date },
    notes: String,
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    city: { type: String, trim: true },
    country: { type: String, trim: true }, // prefer ISO-2, but not required
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  { _id: false }
);

const ActorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    role: { type: String, trim: true, lowercase: true }, // "agent" | "driver" | "admin" | "system"
  },
  { _id: false }
);

const ScanEventSchema = new Schema(
  {
    status: { type: String, enum: SHIPMENT_STATUS_VALUES, required: true },
    location: { type: LocationSchema, default: undefined },
    note: { type: String, trim: true, maxlength: 500 },
    actor: { type: ActorSchema, default: undefined },
    photoUrl: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { _id: true }
);

const ShipmentSchema = new Schema(
  {
    ref: { type: String, unique: true, required: true },

    // UPDATED: expanded enum
    status: {
      type: String,
      enum: SHIPMENT_STATUS_VALUES,
      default: SHIPMENT_STATUS.BOOKED,
      index: true,
    },

    sender: { type: PartySchema, required: true },
    receiver: { type: PartySchema, required: true },
    contents: {
      type: [ContentItemSchema],
      required: true,
      validate: (v) => v.length > 0,
    },
    pickup: {
      date: { type: Date, required: true },
      notes: { type: String },
    },
    dropoff: {
      date: { type: Date },
      notes: { type: String },
    },
    serviceLevel: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },

    // keep if you also persist a separate Quote model
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote" },

    // NEW: embed the computed quote we return to the client
    quote: { type: ShipmentQuoteSchema },

    // source of truth for amount to charge
    price: {
      currency: { type: String },
      amount: { type: Number },
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "succeeded", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    paidAt: { type: Date },

    // label lifecycle
    labelGeneratedAt: { type: Date },
    labelPath: { type: String },

    /** -----------------------------
     * NEW: tracking fields
     * ----------------------------- */
    scans: { type: [ScanEventSchema], default: [] },
    lastScanAt: { type: Date },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);



/** Convenience method (existing) */
ShipmentSchema.methods.isPaid = function () {
  return this.paymentStatus === "succeeded";
};

/** Maintain lastScanAt automatically when scans change via .save() */
ShipmentSchema.pre("save", function (next) {
  if (this.isModified("scans") && this.scans?.length) {
    const last = this.scans[this.scans.length - 1];
    this.lastScanAt = last?.createdAt || new Date();
  }
  // Set deliveredAt once when status becomes DELIVERED (if not already set)
  if (
    this.isModified("status") &&
    this.status === SHIPMENT_STATUS.DELIVERED &&
    !this.deliveredAt
  ) {
    this.deliveredAt = new Date();
  }
  next();
});

/** Indexes */


// Optimize queue filtering by current status + recent scan
ShipmentSchema.index({ status: 1, lastScanAt: -1 });

// Also optimize general timeline updates (fallback if lastScanAt not yet used)
ShipmentSchema.index({ status: 1, updatedAt: -1 });



// Requested: timeline sorting helper (sparse makes sense if some shipments have no scans yet)
ShipmentSchema.index({ "scans.createdAt": 1 }, { sparse: true });

// Ordered forward-delivery milestones
export const SHIPMENT_MILESTONES = [
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

// Helper: forward-only check with exception rule + admin override
export function canTransition(prev, next, { adminOverride = false } = {}) {
  if (adminOverride) return { ok: true };

  // EXCEPTION allowed from any non-DELIVERED
  if (next === SHIPMENT_STATUS.EXCEPTION) {
    if (prev === SHIPMENT_STATUS.DELIVERED) {
      return { ok: false, reason: "Cannot set EXCEPTION after DELIVERED" };
    }
    return { ok: true };
  }

  // Disallow CANCELED via scan flow (keep for other flows if you want)
  if (next === "CANCELED") {
    return { ok: false, reason: "CANCELED is not part of scan transitions" };
  }

  const prevIdx = SHIPMENT_MILESTONES.indexOf(prev);
  const nextIdx = SHIPMENT_MILESTONES.indexOf(next);

  if (prevIdx === -1 || nextIdx === -1) {
    return { ok: false, reason: "Invalid milestone transition" };
  }

  if (prev === SHIPMENT_STATUS.DELIVERED) {
    return { ok: false, reason: "Shipment already delivered" };
  }

  // Forward-only: strictly increasing (no repeats or backward jumps)
  if (nextIdx <= prevIdx) {
    return { ok: false, reason: "Only forward-moving transitions are allowed" };
  }

  return { ok: true };
}

/**
 * Apply a scan event with full validation.
 * Server timestamps only: createdAt = now, must be > lastScanAt.
 *
 * @param {Object} payload - { status, location?, note?, actor?, photoUrl? }
 * @param {Object} options - { adminOverride?: boolean }
 * @returns {Promise<Shipment>} saved shipment
 */
ShipmentSchema.methods.applyScan = async function (payload, { adminOverride = false } = {}) {
  const { status, location, note, actor, photoUrl } = payload || {};
  if (!status) {
    throw new Error("Scan status is required");
  }

  // Transition guard
  const { ok, reason } = canTransition(this.status, status, { adminOverride });
  if (!ok) {
    const msg = reason || `Transition ${this.status} → ${status} not allowed`;
    const err = new Error(msg);
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  // Server timestamp (no client supplied timestamps)
  const now = new Date();

  // Monotonic timeline: reject if now <= lastScanAt
  if (this.lastScanAt && now <= this.lastScanAt) {
    const err = new Error("Scan timestamp must be newer than last scan");
    err.code = "STALE_SCAN_TIMESTAMP";
    throw err;
  }

  // Build scan event
  const scan = {
    status,
    createdAt: now,
  };
  if (location) scan.location = location;
  if (note) scan.note = note;
  if (actor) scan.actor = actor; // e.g., { userId, role }
  if (photoUrl) scan.photoUrl = photoUrl;

  // Mutate shipment
  this.scans.push(scan);
  this.status = status;
  this.lastScanAt = now;

  // On DELIVERED, set deliveredAt = now (once)
  if (status === SHIPMENT_STATUS.DELIVERED && !this.deliveredAt) {
    this.deliveredAt = now;
  }

  // Persist
  return this.save();
};

export default model("Shipment", ShipmentSchema);