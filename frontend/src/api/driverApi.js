// File: src/api/driverApi.js

import axios from "axios";


export const driverApi = {
/**
n * GET /driver/assignments
* params: { date: 'YYYY-MM-DD', type: 'pickup'|'delivery'|'all' }
*/
async getAssignments({ date, type } = {}) {
const params = {};
if (date) params.date = date;
if (type) params.type = type;
const res = await axios.get("/api/driver/assignments", { params, withCredentials: true });
return res.data;
},


/**
* POST /shipments/:id/pod
* payload: { recipientName, receivedAt?, notes?, signatureDataUrl?, photoUrl?, location? }
*/
async postPOD(shipmentId, payload) {
if (!shipmentId) throw new Error("shipmentId required");
const url = `/api/shipments/${shipmentId}/pod`;
const res = await axios.post(url, payload, { withCredentials: true });
return res.data;
},
};