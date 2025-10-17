import { Schema, model } from "mongoose";
import { SCAN_TYPES } from "./constants/scanTypes.js";

const scanEventSchema = new Schema(
  {
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
      index: true,
    },
    // Human-readable reference for quick lookups & ops terminals
    ref: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: SCAN_TYPES,
      required: true,
    },
    note: { type: String, trim: true },
    // free text e.g. "HH-DE/Hub A" or "Dakar/Customs Gate 2"
    location: { type: String, trim: true },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // roles: admin | staff | customer (we'll authorize in controllers)
      required: true,
      index: true,
    },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

// ---- Indexes (for queue/history screens & timeline queries)
scanEventSchema.index({ ref: 1, createdAt: -1 });
scanEventSchema.index({ shipmentId: 1, createdAt: -1 });

export default model("ScanEvent", scanEventSchema);
