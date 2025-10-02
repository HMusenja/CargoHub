// src/controllers/shipmentsController.js
import createError from "http-errors";
import { createShipmentWithUniqueRef } from "../services/shipmentService.js";

export async function createShipment(req, res, next) {
  try {
    if (!req.user?.id) {
      return next(createError(401, "Authentication required"));
    }

    const payload = {
      ...req.cleanedShipment,
      createdBy: req.user.id, // enforce server-side
    };

    const shipment = await createShipmentWithUniqueRef(payload);

    return res.status(201).json({
      ref: shipment.ref,
      shipmentId: shipment._id,
      status: shipment.status,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return next(createError(409, "Duplicate reference"));
    }
    return next(createError(500, err.message || "Internal Server Error"));
  }
}
