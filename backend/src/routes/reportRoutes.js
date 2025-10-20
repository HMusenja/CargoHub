// server/routes/reportRoutes.js
import express from "express";
import checkToken from "../middleware/checkToken.js";
import { getReportsSummary } from "../controllers/reportController.js";

const router = express.Router();

/**
 * GET /reports/summary
 * Simple dummy summary report (MVP)
 */
// router.get("/summary", (req, res) => {
//   res.json({
//     message: "Reports summary endpoint (MVP)",
//     range: "week",
//     start: new Date(),
//     end: new Date(),
//     totals: {
//       shipmentsCreated: 0,
//       pickups: 0,
//       deliveries: 0,
//       revenue: 0,
//     },
//     byDay: [],
//   });
// });

router.get(
  "/summary",
  checkToken,
  // roleGuard(["admin"]),
  getReportsSummary
);

export default router;
