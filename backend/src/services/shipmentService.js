// services/shipmentService.js
import Shipment from "../models/Shipment.js";
import { generateShipmentRef, isDuplicateKeyError } from "../utils/ref.js";
import { buildQuoteFromShipmentPayload } from "../services/quoteService.js";

/**
 * Ensures a payload has `quote` and `price` fields.
 * - If caller already supplies `price.amount`, we leave it as-is.
 * - Otherwise we compute a quote from the shipment-like payload and set both:
 *     payload.quote  = full quote object
 *     payload.price  = { currency, amount: quote.total }
 */
async function ensureQuoteAndPrice(payload) {
  if (payload?.price?.amount != null) return payload;
  try {
    const quote = await buildQuoteFromShipmentPayload(payload);
    payload.quote = quote;
    payload.price = { currency: quote.currency || "EUR", amount: Number(quote.total || 0) };
    return payload;
  } catch (err) {
    // Preserve status from buildQuoteFromShipmentPayload (e.g., 422)
    throw err;
  }
}

/**
 * Create a Shipment with a unique ref.
 * @param {object} payload - Cleaned shipment object (from DTO + middleware).
 * @param {number} maxRetries - How many times to retry on duplicate ref.
 */
export async function createShipmentWithUniqueRef(payload, maxRetries = 3) {
  let attempt = 0;

  // make sure we persist a server-trusted quote+price
  const withPrice = await ensureQuoteAndPrice({ ...payload });

  while (attempt <= maxRetries) {
    const ref = await generateShipmentRef();

    try {
      const shipment = await Shipment.create({
        ...withPrice,
        ref,
        status: "BOOKED",
      });

      return shipment;
    } catch (err) {
      if (isDuplicateKeyError(err) && attempt < maxRetries) {
        attempt++;
        continue; // retry with a new ref
      }
      throw err; // bubble up other errors
    }
  }

  const error = new Error("Failed to create shipment after multiple attempts");
  error.status = 409;
  throw error;
}

/**
 * Optionally: fetch shipment by ID or ref (for confirmation / labels later).
 */
export async function getShipmentById(id) {
  return Shipment.findById(id).populate("createdBy", "name email");
}

export async function getShipmentByRef(ref) {
  return Shipment.findOne({ ref }).populate("createdBy", "name email");
}
