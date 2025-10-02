// utils/ref.js
import Counter from "../models/Counter.js";

/**
 * Returns YYYYMMDD for today (local server time).
 */
function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/**
 * Atomically increments & returns the next daily sequence for the given key.
 * Ensures uniqueness per day via (key,date) unique index + findOneAndUpdate.
 */
async function getDailySequence(key = "shipment", date = todayStr()) {
  const doc = await Counter.findOneAndUpdate(
    { key, date },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return { date, seq: doc.seq };
}

/**
 * Format → "SHP-YYYYMMDD-XXXX" (zero-padded to 4+ digits).
 */
function formatShipmentRef(date, seq) {
  const padded = String(seq).padStart(4, "0");
  return `SHP-${date}-${padded}`;
}

/**
 * Public API:
 * Generate a shipment ref using a daily atomic counter.
 * Example: "SHP-20251001-0007"
 */
export async function generateShipmentRef() {
  const { date, seq } = await getDailySequence("shipment");
  return formatShipmentRef(date, seq);
}

/**
 * Helper to detect duplicate-key (unique index) errors from Mongo.
 */
export function isDuplicateKeyError(err) {
  return err?.code === 11000;
}
