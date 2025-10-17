import axios from "axios";


/** Default actionable statuses for the board */
export const ACTIONABLE_STATUSES = [
  "PICKED_UP",          // (legacy INTAKE)
  "IN_TRANSIT",         // (legacy BAGGED/LOADED/CUSTOMS_*)
  "AT_HUB",             // (legacy ARRIVED_HUB)
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/**
 * GET /shipments?status=…&search=…&page=…&limit=…
 * @param {{status?: string[]; page?: number; limit?: number; search?: string; sort?: string}} params
 * @returns {Promise<{data: any[], page: number, totalPages: number, total: number}>}
 */
export async function getShipments(params = {}) {
  const {
    status = ACTIONABLE_STATUSES,
    page = 1,
    limit = 20,
    search = "",
    sort = "updatedAt:desc",
  } = params;

  const qs = new URLSearchParams();
  if (status?.length) qs.set("status", status.join(","));
  if (search) qs.set("search", search);
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (sort) qs.set("sort", sort);

  const res = await axios.get(`/api/shipments?${qs.toString()}`);
  return res.data;
}

/**
 * POST /scan
 * Accepts canonical status or legacy type.
 * @param {{ref: string; status?: string; type?: string; note?: string; location?: string|{city:string,country?:string,lat?:number,lng?:number}}} body
 * @returns {Promise<{ok: boolean; shipment: any; event: any}>}
 */
export async function postScan(body) {
  // Small normalization: trim ref & note
  const payload = { ...body };
  if (payload.ref) payload.ref = String(payload.ref).trim();
  if (payload.note) payload.note = String(payload.note).trim();
  const res = await axios.post("/api/scan", payload);
  return res.data;
}
