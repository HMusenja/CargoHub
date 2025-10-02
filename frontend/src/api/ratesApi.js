// src/api/ratesApi.js
import axios from "axios";

export async function getQuote(payload) {
  const { data } = await axios.post("/api/rates/quote", payload, {
    withCredentials: true,
  });
  return data;
}