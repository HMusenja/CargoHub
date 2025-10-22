// server/controllers/reportController.js
import createError from "http-errors";
import Shipment from "../models/Shipment.js";

/**
 * GET /reports/summary?range=week|month&tz=Europe/Berlin
 *
 * Implementation note:
 * - Runs separate aggregations in parallel (no nested $facet).
 * - Buckets by day using $dateToString with timezone.
 */
const VALID_RANGES = new Set(["week", "month"]);
const DEFAULT_TZ = "Europe/Berlin";

export async function getReportsSummary(req, res, next) {
  try {
    const rangeQ = (req.query.range || "week").toLowerCase();
    const range = VALID_RANGES.has(rangeQ) ? rangeQ : "week";
    const tz = (req.query.tz || DEFAULT_TZ).trim() || DEFAULT_TZ;

    const now = new Date();
    const days = range === "month" ? 30 : 7;
    const msInDay = 24 * 60 * 60 * 1000;

    // start at beginning of (days-1) ago, inclusive
    const start = new Date(now.getTime() - (days - 1) * msInDay);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);

    // Aggregation pipelines (no nested facets)
    const shipmentsByDayPipeline = [
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: tz } },
          count: { $sum: 1 },
        },
      },
    ];

    const pickupsByDayPipeline = [
      { $unwind: { path: "$scans", preserveNullAndEmptyArrays: false } },
      {
        $match: {
          "scans.createdAt": { $gte: start, $lte: end },
          "scans.status": "PICKED_UP",
        },
      },
      {
        $group: {
          _id: { $dateToString: { date: "$scans.createdAt", format: "%Y-%m-%d", timezone: tz } },
          count: { $sum: 1 },
        },
      },
    ];

    const deliveriesByDayPipeline = [
      { $unwind: { path: "$scans", preserveNullAndEmptyArrays: false } },
      {
        $match: {
          "scans.createdAt": { $gte: start, $lte: end },
          "scans.status": "DELIVERED",
        },
      },
      {
        $group: {
          _id: { $dateToString: { date: "$scans.createdAt", format: "%Y-%m-%d", timezone: tz } },
          count: { $sum: 1 },
        },
      },
    ];

    const revenueByDayPipeline = [
      {
        $match: {
          deliveredAt: { $gte: start, $lte: end },
          "price.amount": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: { $dateToString: { date: "$deliveredAt", format: "%Y-%m-%d", timezone: tz } },
          revenue: { $sum: "$price.amount" },
        },
      },
    ];

    const totalsShipmentsPipeline = [
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $count: "n" },
    ];

    const totalsPickupsPipeline = [
      { $unwind: { path: "$scans", preserveNullAndEmptyArrays: false } },
      { $match: { "scans.createdAt": { $gte: start, $lte: end }, "scans.status": "PICKED_UP" } },
      { $count: "n" },
    ];

    const totalsDeliveriesPipeline = [
      { $unwind: { path: "$scans", preserveNullAndEmptyArrays: false } },
      { $match: { "scans.createdAt": { $gte: start, $lte: end }, "scans.status": "DELIVERED" } },
      { $count: "n" },
    ];

    const totalsRevenuePipeline = [
      { $match: { deliveredAt: { $gte: start, $lte: end }, "price.amount": { $exists: true, $ne: null } } },
      { $group: { _id: null, sum: { $sum: "$price.amount" } } },
    ];

    // Run aggregations in parallel
    const [
      shipmentsByDay,
      pickupsByDay,
      deliveriesByDay,
      revenueByDay,
      totalShipmentsArr,
      totalPickupsArr,
      totalDeliveriesArr,
      totalRevenueArr,
    ] = await Promise.all([
      Shipment.aggregate(shipmentsByDayPipeline),
      Shipment.aggregate(pickupsByDayPipeline),
      Shipment.aggregate(deliveriesByDayPipeline),
      Shipment.aggregate(revenueByDayPipeline),
      Shipment.aggregate(totalsShipmentsPipeline),
      Shipment.aggregate(totalsPickupsPipeline),
      Shipment.aggregate(totalsDeliveriesPipeline),
      Shipment.aggregate(totalsRevenuePipeline),
    ]);

    const totals = {
      shipmentsCreated: (totalShipmentsArr && totalShipmentsArr[0]?.n) || 0,
      pickups: (totalPickupsArr && totalPickupsArr[0]?.n) || 0,
      deliveries: (totalDeliveriesArr && totalDeliveriesArr[0]?.n) || 0,
      revenue: (totalRevenueArr && totalRevenueArr[0]?.sum) || 0,
    };

    // Merge day buckets into a map
    const map = new Map();
    (shipmentsByDay || []).forEach((r) => {
      if (!r?._id) return;
      map.set(r._id, { date: r._id, shipments: r.count || 0, pickups: 0, deliveries: 0, revenue: 0 });
    });
    (pickupsByDay || []).forEach((r) => {
      if (!r?._id) return;
      const existing = map.get(r._id) || { date: r._id, shipments: 0, pickups: 0, deliveries: 0, revenue: 0 };
      existing.pickups = r.count || 0;
      map.set(r._id, existing);
    });
    (deliveriesByDay || []).forEach((r) => {
      if (!r?._id) return;
      const existing = map.get(r._id) || { date: r._id, shipments: 0, pickups: 0, deliveries: 0, revenue: 0 };
      existing.deliveries = r.count || 0;
      map.set(r._id, existing);
    });
    (revenueByDay || []).forEach((r) => {
      if (!r?._id) return;
      const existing = map.get(r._id) || { date: r._id, shipments: 0, pickups: 0, deliveries: 0, revenue: 0 };
      existing.revenue = r.revenue || 0;
      map.set(r._id, existing);
    });

    // Build contiguous day array
    const byDay = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * msInDay);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      byDay.push(map.get(key) || { date: key, shipments: 0, pickups: 0, deliveries: 0, revenue: 0 });
    }

    return res.json({
      range,
      start: start.toISOString(),
      end: end.toISOString(),
      totals,
      byDay,
      comparison: { prevRangeRevenue: 0, deltaRevenuePct: 0 },
    });
  } catch (err) {
    console.error("GET /reports/summary — error building report:", err && err.stack ? err.stack : err);
    return next(createError(500, `Failed to build reports summary: ${err.message || "unknown error"}`));
  }
}
