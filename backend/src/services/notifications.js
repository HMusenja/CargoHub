// services/notifications.js
import Notification from "../models/Notification.js";
import { SHIPMENT_STATUS } from "../models/Shipment.js";

const CUSTOMER_MILESTONES = new Set([
  SHIPMENT_STATUS.PICKED_UP,
  SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  SHIPMENT_STATUS.DELIVERED,
]);

export async function notifyShipmentMilestone(shipment, status) {
  if (!CUSTOMER_MILESTONES.has(status)) return;

  const ref = shipment.ref;
  const receiverEmail = shipment?.receiver?.email;
  const creatorUserId = shipment?.createdBy;

  const { title, message } = copyFor(status, ref);

  const ops = [];
  if (creatorUserId) {
    ops.push(
      Notification.create({
        userId: creatorUserId,
        type: "shipment",
        title,
        message,
        data: { ref, status },
      })
    );
  }
  if (receiverEmail) {
    ops.push(
      Notification.create({
        email: receiverEmail,
        type: "shipment",
        title,
        message,
        data: { ref, status },
      })
    );
  }
  await Promise.allSettled(ops);

  // (Optional) trigger email/SMS here
  // await sendEmail(receiverEmail, title, message);
}

function copyFor(status, ref) {
  switch (status) {
    case SHIPMENT_STATUS.PICKED_UP:
      return {
        title: `Shipment ${ref} picked up`,
        message: `Good news! Shipment ${ref} has been picked up.`,
      };
    case SHIPMENT_STATUS.OUT_FOR_DELIVERY:
      return {
        title: `Shipment ${ref} is out for delivery`,
        message: `Shipment ${ref} is out for delivery. Please be available to receive it.`,
      };
    case SHIPMENT_STATUS.DELIVERED:
      return {
        title: `Shipment ${ref} delivered`,
        message: `Shipment ${ref} has been delivered. We hope everything arrived safely!`,
      };
    default:
      return {
        title: `Shipment ${ref} update`,
        message: `Shipment ${ref} status changed to ${status}.`,
      };
  }
}
