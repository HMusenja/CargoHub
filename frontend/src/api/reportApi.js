/* ==================================================================
File: src/api/reportApi.js
================================================================== */
import axios from "axios";


export const reportApi = {
/** GET /reports/summary?range=week|month */
async getSummary({ range = "week", tz } = {}) {
const params = { range };
if (tz) params.tz = tz;
const res = await axios.get("/api/reports/summary", { params, withCredentials: true });
return res.data;
},
};