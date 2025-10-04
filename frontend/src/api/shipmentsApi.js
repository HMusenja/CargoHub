// src/api/shipmentsApi.js
import axios from "axios";

export async function createShipment(payload) {
  try {
    const { data } = await axios.post("/api/shipments", payload, {
      withCredentials: true,
    });
    return data; // { ref, shipmentId, status }
  } catch (e) {
    const status = e?.response?.status || 500;
    const message =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Request failed";
    const errors = e?.response?.data?.errors || null;

    // helpful for your dev console
    // eslint-disable-next-line no-console
    console.error("[createShipment] failed:", { status, message, errors, payload });

    const err = new Error(message);
    err.status = status;
    err.errors = errors;
    throw err;
  }
}
export function downloadLabelByRef(ref) {
  // open in a new tab
  window.open(`/api/shipments/by-ref/${encodeURIComponent(ref)}/label.pdf`, "_blank");
}
