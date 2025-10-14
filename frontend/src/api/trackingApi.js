// src/api/trackingApi.js
// Depends on your existing axios instance (with baseURL + withCredentials)
import axios from "axios";

/** Lightweight API error with user-facing message */
export class ApiError extends Error {
  constructor(message, { status, code, userMessage } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 0;
    this.code = code || "API_ERROR";
    this.userMessage = userMessage || message;
  }
}

/** Map HTTP/network issues to friendly strings */
function friendlyMessage(status, fallback = "Etwas ist schiefgelaufen. Bitte versuche es erneut.") {
  if (status === 404) return "Wir konnten keine Sendung mit dieser Referenz finden.";
  if (status === 410) return "Diese Sendung ist archiviert.";
  if (status === 400) return "Ungültige Eingabe. Bitte prüfe die Referenz/Status.";
  if (status === 401) return "Nicht angemeldet. Bitte erneut einloggen.";
  if (status === 403) return "Unzureichende Berechtigung für diese Aktion.";
  if (status >= 500) return "Serverfehler. Bitte später erneut versuchen.";
  return fallback;
}

/** Extract best server-side error message (if any) */
function serverMsg(error) {
  return error?.response?.data?.message || error?.message || "Request fehlgeschlagen";
}

function normalizeRef(ref) {
  return String(ref || "").trim().toUpperCase();
}

/**
 * GET /track/:ref
 * @param {string} ref - Shipment reference
 * @returns {Promise<object>} tracking payload (ref, status, origin, destination, itemsSummary, progress, timeline, etc.)
 */
export async function trackShipment(ref) {
  const clean = normalizeRef(ref);
  if (!clean) {
    throw new ApiError("Missing reference", {
      status: 400,
      code: "BAD_INPUT",
      userMessage: "Bitte gib eine gültige Referenz ein.",
    });
  }

  try {
    const { data } = await axios.get(`/api/track/${clean}`);
    return data;
  } catch (err) {
    const status = err?.response?.status ?? 0;
    throw new ApiError(serverMsg(err), {
      status,
      code: status === 0 ? "NETWORK_ERROR" : "HTTP_ERROR",
      userMessage: friendlyMessage(status),
    });
  }
}

/**
 * POST /scan
 * @param {object} payload
 * @param {string} payload.ref - required
 * @param {string} payload.status - required (enum)
 * @param {object} [payload.location] - { city?, country?, lat?, lng? }
 * @param {string} [payload.note] - <= 500 chars
 * @param {string} [payload.photoUrl]
 * @returns {Promise<object>} updated tracking payload (same shape as GET /track)
 */
export async function postScan(payload = {}) {
  const body = {
    ref: normalizeRef(payload.ref),
    status: payload.status,
    location: payload.location,
    note: payload.note,
    photoUrl: payload.photoUrl,
  };

  if (!body.ref || !body.status) {
    throw new ApiError("Missing ref or status", {
      status: 400,
      code: "BAD_INPUT",
      userMessage: "Referenz und Status sind erforderlich.",
    });
  }

  try {
    const { data } = await axios.post(`/api/scan`, body);
    return data;
  } catch (err) {
    const status = err?.response?.status ?? 0;
    // Special-cases from backend:
    // 400 invalid transition, 409 stale timestamp, 403 forbidden, etc.
    let msg = friendlyMessage(status, "Scan konnte nicht gespeichert werden.");
    if (status === 409) msg = "Der Scan-Zeitstempel ist zu alt. Bitte erneut versuchen.";
    throw new ApiError(serverMsg(err), {
      status,
      code: status === 0 ? "NETWORK_ERROR" : "HTTP_ERROR",
      userMessage: msg,
    });
  }
}
