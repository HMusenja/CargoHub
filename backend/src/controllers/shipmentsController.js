import createError from "http-errors";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { createShipmentWithUniqueRef } from "../services/shipmentService.js";

import { generateLabelPDF } from "../services/labelService.js";
import Shipment from "../models/Shipment.js"; // 🔹 add this

export async function createShipment(req, res, next) {
  try {
    if (!req.user?.id) return next(createError(401, "Authentication required"));

    const payload = { ...req.cleanedShipment, createdBy: req.user.id };
    const shipment = await createShipmentWithUniqueRef(payload);

    return res.status(201).json({
      ref: shipment.ref,
      shipmentId: shipment._id,
      status: shipment.status,
      price: shipment.price,
      quote: shipment.quote, // make it available to the client
    });
  } catch (err) {
    // If a service set a status (e.g., 422 for no rates), honor it
    if (err?.status) return next(createError(err.status, err.message));
    if (err?.code === 11000) return next(createError(409, "Duplicate reference"));
    return next(createError(500, err.message || "Internal Server Error"));
  }
}

/**
 * GET /api/shipments/by-ref/:ref
 * Returns the shipment document by its human-readable reference.
 * Auth-protected; optionally enforce ownership if needed.
 */
export async function getShipmentByRef(req, res, next) {
  try {
    const { ref } = req.params;
    if (!ref?.trim()) {
      return next(createError(400, "ref is required"));
    }

   const shipment = await Shipment
      .findOne({ ref: ref.trim() })
      .select("ref status price quote createdBy")
      .lean();
    if (!shipment) {
      return next(createError(404, "Shipment not found"));
    }

    // Optional: enforce ownership
    if (shipment.createdBy?.toString() !== req.user?.id) {
      return next(createError(403, "Forbidden"));
    }

    return res.status(200).json({ shipment });
  } catch (err) {
    return next(createError(500, err.message || "Internal Server Error"));
  }
}

/**
 * GET /api/shipments/:id/label.pdf
 * Only after payment succeeded. Generates on demand if missing.
 */
export async function getShipmentLabelById(req, res, next) {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);
    if (!shipment) return next(createError(404, "Shipment not found"));

    // Optional ownership check
    // if (shipment.createdBy?.toString() !== req.user?.id) {
    //   return next(createError(403, "Forbidden"));
    // }

    if (shipment.paymentStatus !== "succeeded") {
      return next(createError(402, "Payment required before downloading label"));
    }

    // Generate on demand if needed
    let labelPath = shipment.labelPath;
    if (!labelPath || !fs.existsSync(labelPath)) {
      const { filePath } = await generateLabelPDF(shipment);
      shipment.labelPath = filePath;
      shipment.labelGeneratedAt = new Date();
      await shipment.save();
      labelPath = filePath;
    }

    const filename = `${shipment.ref}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.sendFile(path.resolve(labelPath));
  } catch (err) {
    return next(createError(500, err.message || "Failed to fetch label"));
  }
}

/**
 * GET /api/shipments/by-ref/:ref/label.pdf
 * Convenience: same as above but resolves by ref.
 */
export async function getShipmentLabelByRef(req, res, next) {
  try {
    const { ref } = req.params;
    const shipment = await Shipment.findOne({ ref: ref?.trim() });
    if (!shipment) return next(createError(404, "Shipment not found"));

    if (shipment.paymentStatus !== "succeeded") {
      return next(createError(402, "Payment required before downloading label"));
    }

    let labelPath = shipment.labelPath;
    if (!labelPath || !fs.existsSync(labelPath)) {
      const { filePath } = await generateLabelPDF(shipment);
      shipment.labelPath = filePath;
      shipment.labelGeneratedAt = new Date();
      await shipment.save();
      labelPath = filePath;
    }

    const filename = `${shipment.ref}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.sendFile(path.resolve(labelPath));
  } catch (err) {
    return next(createError(500, err.message || "Failed to fetch label"));
  }
}
