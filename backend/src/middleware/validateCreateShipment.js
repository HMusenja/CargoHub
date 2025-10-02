// src/middleware/validateCreateShipment.js
import { CreateShipmentDTO, toShipmentModelShape } from "../validators/shipment.dto.js";

export function validateCreateShipment(req, res, next) {
  const parsed = CreateShipmentDTO.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => ({
      path: Array.isArray(i.path) ? i.path.join(".") : String(i.path || ""),
      message: i.message,
    }));
    return res.status(400).json({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid shipment payload",
      errors,
    });
  }

  req.cleanedShipment = toShipmentModelShape(parsed.data, req.user?.id);
  next();
}

