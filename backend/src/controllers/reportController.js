// server/controllers/reportController.js
import createError from "http-errors";
import Shipment from "../models/Shipment.js";

const VALID_RANGES = new Set(["week", "month"]);
const DEFAULT_TZ = "Europe/Berlin";

/**
 * GET /reports/summary?range=week|month&tz=Europe/Berlin
 * - range: rolling last 7 days ("week") or 30 days ("month"), default "week"
 * - tz: IANA timezone for daily bucketing (Mongo handles this), default Europe/Berlin
 *
 * Totals:
 *  - shipmentsCreated: count of shipments created in window
 *  - pickups: count of scans with status=PICKED_UP in window
 *  - deliveries: count of scans with status=DELIVERED in window
 *  - revenue: sum(price.amount) for shipments with deliveredAt in window
 *
 * byDay[] (YYYY-MM-DD in tz):
 *  - shipments, pickups, deliveries, revenue
 */
export async function getReportsSummary(req, res, next) {
  try {
    const range = VALID_RANGES.has((req.query.range || "week").toLowerCase())
      ? req.query.range.toLowerCase()
      : "week";

    const tz = (req.query.tz || DEFAULT_TZ).trim() || DEFAULT_TZ;

    // Rolling windows: 7 or 30 days ending "now"
    const now = new Date();
    const days = range === "month" ? 30 : 7;
    const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000); // inclusive
    const end = now; // exclusive-ish in practice, but we'll use < endOfDay via tz bucketing

    // Mongo facet: build per-day buckets for the 4 series, plus quick totals.
    // We rely on Mongo's timezone-aware $dateToString for YYYY-MM-DD keys in the requested tz.
    const dateKey = {
      $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: tz },
    };
    const scanDateKey = {
      $dateToString: { date: "$scans.createdAt", format: "%Y-%m-%d", timezone: tz },
    };
    const deliveredDateKey = {
      $dateToString: { date: "$deliveredAt", format: "%Y-%m-%d", timezone: tz },
    };

    const [agg] = await Shipment.aggregate([
      {
        $facet: {
          // Shipments created by day
          shipmentsByDay: [
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
              $group: {
                _id: dateKey,
                count: { $sum: 1 },
              },
            },
          ],

          // Pickups by day (scan status = PICKED_UP)
          pickupsByDay: [
            { $unwind: "$scans" },
            {
              $match: {
                "scans.createdAt": { $gte: start, $lte: end },
                "scans.status": "PICKED_UP",
              },
            },
            {
              $group: {
                _id: scanDateKey,
                count: { $sum: 1 },
              },
            },
          ],

          // Deliveries by day (scan status = DELIVERED)
          deliveriesByDay: [
            { $unwind: "$scans" },
            {
              $match: {
                "scans.createdAt": { $gte: start, $lte: end },
                "scans.status": "DELIVERED",
              },
            },
            {
              $group: {
                _id: scanDateKey,
                count: { $sum: 1 },
              },
            },
          ],

          // Revenue by day (sum price.amount by deliveredAt day)
          revenueByDay: [
            {
              $match: {
                deliveredAt: { $gte: start, $lte: end },
                "price.amount": { $gt: 0 },
              },
            },
            {
              $group: {
                _id: deliveredDateKey,
                revenue: { $sum: "$price.amount" },
              },
            },
          ],

          // Totals (quick one-shot)
          totals: [
            {
              $facet: {
                shipmentsCreated: [
                  { $match: { createdAt: { $gte: start, $lte: end } } },
                  { $count: "n" },
                ],
                pickups: [
                  { $unwind: "$scans" },
                  {
                    $match: {
                      "scans.createdAt": { $gte: start, $lte: end },
                      "scans.status": "PICKED_UP",
                    },
                  },
                  { $count: "n" },
                ],
                deliveries: [
                  { $unwind: "$scans" },
                  {
                    $match: {
                      "scans.createdAt": { $gte: start, $lte: end },
                      "scans.status": "DELIVERED",
                    },
                  },
                  { $count: "n" },
                ],
                revenue: [
                  {
                    $match: {
                      deliveredAt: { $gte: start, $lte: end },
                      "price.amount": { $gt: 0 },
                    },
                  },
                  {
                    $group: { _id: null, sum: { $sum: "$price.amount" } },
                  },
                ],
              },
            },
            {
              $project: {
                shipmentsCreated: { $ifNull: [{ $arrayElemAt: ["$shipmentsCreated.n", 0] }, 0] },
                pickups: { $ifNull: [{ $arrayElemAt: ["$pickups.n", 0] }, 0] },
                deliveries: { $ifNull: [{ $arrayElemAt: ["$deliveries.n", 0] }, 0] },
                revenue: { $ifNull: [{ $arrayElemAt: ["$revenue.sum", 0] }, 0] },
              },
            },
          ],
        },
      },
      {
        $project: {
          shipmentsByDay: 1,
          pickupsByDay: 1,
          deliveriesByDay: 1,
          revenueByDay: 1,
          totals: { $arrayElemAt: ["$totals", 0] },
        },
      },
    ]);

    // Merge facet results per day into a single array, filling missing dates with zeros
    const map = new Map(); // key: 'YYYY-MM-DD' in tz

    const ensure = (d) => {
      if (!map.has(d)) map.set(d, { date: d, shipments: 0, pickups: 0, deliveries: 0, revenue: 0 });
      return map.get(d);
    };

    for (const r of agg.shipmentsByDay || []) ensure(r._id).shipments = r.count || 0;
    for (const r of agg.pickupsByDay || []) ensure(r._id).pickups = r.count || 0;
    for (const r of agg.deliveriesByDay || []) ensure(r._id).deliveries = r.count || 0;
    for (const r of agg.revenueByDay || []) ensure(r._id).revenue = r.revenue || 0;

    // Generate continuous day keys in tz from start..end (inclusive)
    // We'll render keys using Intl in tz to avoid gaps visually
    const daysArr = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      // to YYYY-MM-DD in tz using Intl
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(cursor); // yyyy-mm-dd (en-CA)
      const key = parts; // same format
      daysArr.push(key);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const byDay = daysArr.map((d) => map.get(d) || { date: d, shipments: 0, pickups: 0, deliveries: 0, revenue: 0 });

    // Totals
    const totals = agg.totals || { shipmentsCreated: 0, pickups: 0, deliveries: 0, revenue: 0 };

    // Optional comparison block placeholder (can be implemented later)
    const response = {
      range,
      start: start.toISOString(),
      end: end.toISOString(),
      totals: {
        shipmentsCreated: totals.shipmentsCreated || 0,
        pickups: totals.pickups || 0,
        deliveries: totals.deliveries || 0,
        revenue: totals.revenue || 0,
      },
      byDay,
      comparison: {
        // Simple placeholder for future: prevRangeRevenue & delta
        prevRangeRevenue: 0,
        deltaRevenuePct: 0,
      },
    };

    return res.json(response);
  } catch (err) {
    return next(createError(500, err.message || "Failed to build reports summary"));
  }
}
