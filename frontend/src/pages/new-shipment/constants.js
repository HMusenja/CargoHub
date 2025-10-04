export const DRAFT_KEY = "shipment:new:draft:v1";

export const STEPS = {
  SENDER: 1,
  RECEIVER: 2,
  ITEMS: 3,
  REVIEW: 4,
  PAYMENT: 5,
  CONFIRM: 6,
};

export const STEP_LABELS = {
  [STEPS.SENDER]: "Sender",
  [STEPS.RECEIVER]: "Receiver",
  [STEPS.ITEMS]: "Items",
  [STEPS.REVIEW]: "Review",
  [STEPS.PAYMENT]: "Payment",
  [STEPS.CONFIRM]: "Confirm",
};

export const TOTAL_PROGRESS_STEPS = 5; // everything before confirmation
