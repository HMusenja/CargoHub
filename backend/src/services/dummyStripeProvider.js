import { customAlphabet } from "nanoid";
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

/**
 * Create a pretend PaymentIntent and return a client secret.
 */
export async function createPaymentIntent({ amount, currency, metadata }) {
  if (!amount || Number(amount) <= 0) {
    throw new Error("Amount must be > 0");
  }
  const id = `pi_${nano()}`;
  const clientSecret = `test_${id}_secret_${nano()}`;
  return {
    id,
    client_secret: clientSecret,
    status: "requires_payment_method",
    amount: Number(amount),
    currency,
    metadata: metadata || {},
  };
}

/**
 * Parse webhook event from raw buffer.
 * (No signature verification for dummy mode.)
 */
export function parseWebhookEvent(rawBuffer) {
  try {
    const json = JSON.parse(rawBuffer.toString("utf8"));
    // Expect: { type: "payment_intent.succeeded", data: { object: { id, ... } } }
    return json;
  } catch {
    const err = new Error("Invalid JSON payload for webhook");
    err.status = 400;
    throw err;
  }
}
