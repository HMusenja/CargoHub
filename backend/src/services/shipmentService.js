// services/shipmentService.js
import Shipment from "../models/Shipment.js";
import { generateShipmentRef, isDuplicateKeyError } from "../utils/ref.js";

/**
 * Create a Shipment with a unique ref.
 * @param {object} payload - Cleaned shipment object (from DTO + middleware).
 * @param {number} maxRetries - How many times to retry on duplicate ref.
 */
export async function createShipmentWithUniqueRef(payload, maxRetries = 3) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    const ref = await generateShipmentRef();

    try {
      const shipment = await Shipment.create({
        ...payload,
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
