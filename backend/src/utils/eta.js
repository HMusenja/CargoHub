// src/utils/eta.js

/**
 * Simple ETA / transit-time helpers (no external deps).
 *
 * Core:
 *   calculateEta({ startTime, transitDays, businessDays, holidays, shipCutoffHourLocal })
 *
 * Optionals:
 *   getTransitDaysFromMap({ originZone, destinationZone, serviceLevel, transitMap })
 *
 * Notes:
 * - Weekends = Saturday(6) + Sunday(0). Customize via weekendDays if needed.
 * - Holidays: pass as array of ISO 'YYYY-MM-DD' strings (local calendar).
 * - shipCutoffHourLocal: hour-of-day (0..23). If startTime is after cutoff, adds 1 day before counting.
 */

function isWeekend(d, weekendDays = [0, 6]) {
  const wd = d.getDay();
  return weekendDays.includes(wd);
}

function isHoliday(d, holidaysSet) {
  if (!holidaysSet) return false;
  // Compare by local date component
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return holidaysSet.has(`${y}-${m}-${day}`);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addBusinessDays(start, days, { holidaysSet, weekendDays = [0, 6] } = {}) {
  if (days <= 0) return new Date(start);
  let d = new Date(start);
  let added = 0;
  while (added < days) {
    d = addDays(d, 1);
    if (!isWeekend(d, weekendDays) && !isHoliday(d, holidaysSet)) {
      added++;
    }
  }
  return d;
}

/**
 * Calculate ETA date.
 * @param {Object} params
 * @param {Date|string|number} [params.startTime=new Date()] - shipment creation/booking time
 * @param {number} params.transitDays - number of days to add (calendar or business)
 * @param {boolean} [params.businessDays=true] - if true, skip weekends/holidays
 * @param {string[]} [params.holidays=[]] - ISO dates 'YYYY-MM-DD' (local)
 * @param {number} [params.shipCutoffHourLocal=16] - if start after cutoff, add +1 day before counting
 * @param {number[]} [params.weekendDays=[0,6]] - days treated as weekend (0=Sun..6=Sat)
 * @returns {{ etaDate: Date, etaISO: string }}
 */
export function calculateEta({
  startTime = new Date(),
  transitDays,
  businessDays = true,
  holidays = [],
  shipCutoffHourLocal = 16,
  weekendDays = [0, 6],
} = {}) {
  if (!Number.isFinite(transitDays) || transitDays < 0) {
    throw new Error("transitDays must be a non-negative number");
  }

  const start = new Date(startTime);
  // Apply cutoff: if current local hour > cutoff, push start by +1 day
  const startLocalHour = start.getHours();
  const preCountStart =
    Number.isFinite(shipCutoffHourLocal) && startLocalHour >= shipCutoffHourLocal
      ? addDays(start, 1)
      : start;

  const holidaysSet = holidays.length ? new Set(holidays) : undefined;

  let eta;
  if (businessDays) {
    eta = addBusinessDays(preCountStart, transitDays, { holidaysSet, weekendDays });
  } else {
    eta = addDays(preCountStart, transitDays);
  }

  return { etaDate: eta, etaISO: eta.toISOString() };
}

/**
 * Optional: Transit map lookup for lanes (use when a RateCard lacks transitDays).
 * transitMap shape example:
 * {
 *   "EU1->EU1": { economy: 3, standard: 2, express: 1 },
 *   "EU1->AFR1": { standard: 5, express: 3 }
 * }
 */
export function getTransitDaysFromMap({
  originZone,
  destinationZone,
  serviceLevel = "standard",
  transitMap = {},
}) {
  const key = `${originZone}->${destinationZone}`;
  const lane = transitMap[key];
  if (!lane) return null;
  const lvl = String(serviceLevel).toLowerCase();
  return lane[lvl] ?? lane.standard ?? null;
}

/* ---------- Example default map (optional export) ---------- */
export const DEFAULT_TRANSIT_MAP = {
  "EU1->EU1": { economy: 2, standard: 1, express: 1 },
  "EU1->EU2": { standard: 2, express: 1 },
  "EU2->EU1": { standard: 2, express: 1 },
  "EU1->AFR1": { standard: 5, express: 3 },
  "EU2->AFR1": { standard: 6, express: 4 },
  "EU1->INT": { standard: 4, express: 2 },
};
