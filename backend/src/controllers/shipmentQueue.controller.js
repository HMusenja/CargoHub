import Shipment from "../models/Shipment.js";
import { ACTIONABLE_STATUSES } from "../utils/statusMachine.js";

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_SORT = { updatedAt: -1 };

/**
 * GET /shipments?status=…&search=…&page=…&limit=…
 * Returns a paginated queue grouped by actionable statuses.
 */
export async function listShipmentsQueue(req, res, next) {
  try {
    // ---------------- Params ----------------
    const rawStatus = (req.query.status || "").trim();
    const search = (req.query.search || "").trim();
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(MAX_LIMIT, Math.max(1, toInt(req.query.limit, DEFAULT_LIMIT)));

    // Sort: supports ?sort=updatedAt:asc|desc or lastScanAt:asc|desc
    const sortParam = (req.query.sort || "updatedAt:desc").trim();
    let sort = DEFAULT_SORT;
    if (sortParam.includes(":")) {
      const [field, dir] = sortParam.split(":");
      const direction = dir?.toLowerCase() === "asc" ? 1 : -1;
      if (["updatedAt", "lastScanAt"].includes(field)) {
        sort = { [field]: direction };
      }
    }

    // Status filters
    const statuses = rawStatus
      ? rawStatus.split(",").map((s) => s.trim()).filter(Boolean)
      : ACTIONABLE_STATUSES;

    const match = {};
    if (statuses.length) {
      match.status = { $in: statuses };
    }

    // --- Text search
    if (search) {
      const like = new RegExp(escapeRegex(search), "i");
      match.$or = [
        { ref: like },
        { "receiver.name": like },
        { "receiver.email": like },
        { "receiver.phone": like },
      ];
    }

    // ---------------- Aggregation ----------------
    const pipeline = [
      { $match: match },

      // Project necessary fields
      {
        $project: {
          ref: 1,
          status: 1,
          sender: { city: "$sender.address.city" },
          receiver: {
            name: "$receiver.name",
            city: "$receiver.address.city",
          },
          itemCount: {
            $cond: [{ $isArray: "$contents" }, { $size: "$contents" }, null],
          },
          updatedAt: 1,
          scans: 1,
        },
      },

      // Derive last scan event directly from embedded array
      {
        $addFields: {
          __lastScan: { $arrayElemAt: [{ $slice: ["$scans", -1] }, 0] },
        },
      },
      {
        $addFields: {
          lastEvent: {
            type: "$__lastScan.status",
            createdAt: "$__lastScan.createdAt",
            location: {
              $ifNull: ["$__lastScan.location.city", "$__lastScan.location"],
            },
          },
        },
      },
      { $project: { scans: 0, __lastScan: 0 } },

      { $sort: sort },

      // ---------------- Pagination ----------------
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          meta: [{ $count: "total" }],
        },
      },
      {
        $addFields: {
          total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
        },
      },
      {
        $project: {
          data: 1,
          total: 1,
          page: { $literal: page },
          totalPages: {
            $cond: [
              { $gt: ["$total", 0] },
              { $ceil: { $divide: ["$total", limit] } },
              0,
            ],
          },
        },
      },
    ];

    // ---------------- Execute ----------------
    const [result] = await Shipment.aggregate(pipeline);
    const response = result || { data: [], total: 0, page, totalPages: 0 };
    return res.json(response);
  } catch (err) {
    next(err);
  }
}

// ---------------- Utility ----------------
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

