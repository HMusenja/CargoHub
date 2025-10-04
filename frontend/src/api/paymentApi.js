// Uses global axios defaults set by setAxiosDefaults()
import axios from "axios";

// body: { shipmentRef? , shipmentId? , amountCents? , currency? }
export async function createIntentByRef(body) {
  if (!body || (!body.shipmentRef && !body.shipmentId)) {
    throw new Error("shipmentRef or shipmentId is required");
  }
  const { data } = await axios.post("/api/payments/create-intent", {
    currency: "EUR",
    ...body,
  });
  return data; // { paymentId, clientSecret, status, reused? }
}

export async function devMarkSucceeded(paymentId) {
  if (!paymentId) throw new Error("paymentId is required");
  const { data } = await axios.post("/api/payments/dev/mark-succeeded", { paymentId });
  return data; // { ok: true, shipmentId }
}

