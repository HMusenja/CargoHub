// src/api/ratesApi.js
import axios from "axios";

export async function getQuote(payload) {
  try {
    const { data } = await axios.post("/api/rates/quote", payload, {
      withCredentials: true,
    });
    return data; // e.g. { total, currency, ... }
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = data?.message || "Failed to fetch quote";
    const e = new Error(message);
    e.status = status;
    e.errors = data?.errors || [];
    throw e;
  }
}
