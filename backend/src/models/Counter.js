// models/Counter.js
import { Schema, model } from "mongoose";

/**
 * Stores daily sequences for different keys (e.g., "shipment").
 * Unique by (key, date).
 */
const CounterSchema = new Schema(
  {
    key: { type: String, required: true },        // e.g., "shipment"
    date: { type: String, required: true },       // YYYYMMDD
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

CounterSchema.index({ key: 1, date: 1 }, { unique: true });

const Counter = model("Counter", CounterSchema);
export default Counter;
