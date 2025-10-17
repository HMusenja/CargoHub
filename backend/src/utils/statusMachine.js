// Allowed, explicit transitions
const TRANSITIONS = {
  NEW: ["INTAKE"],
  INTAKE: ["BAGGED", "HOLD"],
  BAGGED: ["LOADED"],
  LOADED: ["IN_TRANSIT"],
  IN_TRANSIT: ["ARRIVED_HUB", "CUSTOMS_IN"],
  CUSTOMS_IN: ["CUSTOMS_OUT", "HOLD"],
  CUSTOMS_OUT: ["IN_TRANSIT"],
  ARRIVED_HUB: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
};

// Exception states are always allowed from any status
const EXCEPTIONS = new Set(["DAMAGED", "LOST", "HOLD"]);

// If an event type is a "state" we store it directly as Shipment.status
// (This keeps canonical status == latest event.type.)
export function isException(next) {
  return EXCEPTIONS.has(next);
}

export function canTransition(current, next) {
  if (!current) return next === "NEW" || next === "INTAKE" || isException(next);
  if (isException(next)) return true;

  const allowed = TRANSITIONS[current] || [];
  return allowed.includes(next);
}

/**
 * Compute next canonical status from event type.
 * Today it's a 1:1 mapping (status becomes the event type),
 * but we keep this wrapper in case future mapping differs.
 */
export function nextStatusFromEvent(current, eventType) {
  if (!canTransition(current, eventType)) {
    const cur = current || "null";
    throw new Error(`Transition ${cur} → ${eventType} not allowed`);
  }
  return eventType;
}

// For UI defaults (actionable queues)
export const ACTIONABLE_STATUSES = [
  "INTAKE",
  "BAGGED",
  "LOADED",
  "ARRIVED_HUB",
  "OUT_FOR_DELIVERY",
];