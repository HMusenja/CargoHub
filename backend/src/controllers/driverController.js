// server/controllers/driverController.js
import createError from "http-errors";

/**
 * GET /driver/assignments
 * Query: date=YYYY-MM-DD (default today), type=pickup|delivery|all (default all)
 * Auth: driver (or admin via roleGuard)
 */
export async function getDriverAssignments(req, res, next) {
  try {
    const { date: qDate, type = "all" } = req.query;

    const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateStr = isISODate(qDate) ? qDate : todayStr;

    const driverId = req.user?._id?.toString?.() || "dummyDriverId";

    // Toggle dummy with env (default: true)
    const useDummy =
      String(process.env.DRIVER_ASSIGNMENTS_DUMMY ?? "true").toLowerCase() !== "false";

    if (useDummy) {
      // ---------- DUMMY DATA (MVP) ----------
      const makeId = (n = 8) =>
        Math.random().toString(36).slice(2, 2 + n) +
        Math.random().toString(36).slice(2, 2 + n);

      const timeWindow = (fromH, toH) => ({
        from: `${dateStr}T${String(fromH).padStart(2, "0")}:00:00.000Z`,
        to: `${dateStr}T${String(toH).padStart(2, "0")}:00:00.000Z`,
      });

      const pickups = [
        {
          shipmentId: makeId(),
          ref: "CH-BOOK-1001",
          sender: {
            name: "ACME GmbH",
            phone: "+49 40 123456",
            city: "Hamburg",
            address: "Spaldingstraße 12",
          },
          pickupWindow: timeWindow(9, 11),
          notes: "Tor 3, bitte klingeln.",
        },
        {
          shipmentId: makeId(),
          ref: "CH-BOOK-1002",
          sender: {
            name: "Müller & Sohn",
            phone: "+49 40 987654",
            city: "Hamburg",
            address: "Wandsbeker Marktstraße 7",
          },
          pickupWindow: timeWindow(12, 14),
          notes: "2 Kartons (zerbrechlich).",
        },
      ];

      const deliveries = [
        {
          shipmentId: makeId(),
          ref: "CH-DEL-2001",
          receiver: {
            name: "Fatou Ndiaye",
            phone: "+221 77 000 0000",
            city: "Dakar",
            address: "Rue 12, Plateau",
          },
          deliveryWindow: timeWindow(15, 17),
          notes: "Empfänger spricht FR/EN.",
        },
        {
          shipmentId: makeId(),
          ref: "CH-DEL-2002",
          receiver: {
            name: "Kofi Mensah",
            phone: "+233 24 123 4567",
            city: "Accra",
            address: "Osu Oxford Street 25",
          },
          deliveryWindow: timeWindow(17, 19),
          notes: "Nachbarn sind informiert.",
        },
      ];

      return res.json({
        date: dateStr,
        driverId,
        pickups: type === "delivery" ? [] : pickups,
        deliveries: type === "pickup" ? [] : deliveries,
      });
    }

    // ---------- REAL DATA (TODO) ----------
    // TODO: Query Shipment collection once available
    // - assignedDriverId == req.user.driverProfileId (or equivalent)
    // - status in ["PICKUP_SCHEDULED", "OUT_FOR_DELIVERY"]
    // - date window overlaps queried date
    //
    // const driverProfileId = req.user?.driverProfileId;
    // if (!driverProfileId) throw createError(403, "Driver profile not found");
    //
    // const start = new Date(`${dateStr}T00:00:00.000Z`);
    // const end   = new Date(`${dateStr}T23:59:59.999Z`);
    //
    // const shipments = await Shipment.find({
    //   assignedDriverId: driverProfileId,
    //   status: { $in: ["PICKUP_SCHEDULED", "OUT_FOR_DELIVERY"] },
    //   // overlap logic when you add pickup/delivery windows
    // }).lean();
    //
    // const pickups = ...;      // map to response shape
    // const deliveries = ...;   // map to response shape
    //
    // return res.json({
    //   date: dateStr,
    //   driverId,
    //   pickups: type === "delivery" ? [] : pickups,
    //   deliveries: type === "pickup" ? [] : deliveries,
    // });

    return res.json({ date: dateStr, driverId, pickups: [], deliveries: [] });
  } catch (err) {
    next(err);
  }
}
