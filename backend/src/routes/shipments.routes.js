// routes/shipments.js
import express from "express";
import { validateCreateShipment } from "../middleware/validateCreateShipment.js";
import checkToken from "../middleware/checkToken.js"
import { createShipment,getShipmentByRef, getShipmentLabelById,
  getShipmentLabelByRef, } from "../controllers/shipmentsController.js";




const router = express.Router();

// Create
router.post("/", checkToken, validateCreateShipment, createShipment);

// Lookup by ref
router.get("/by-ref/:ref", checkToken, getShipmentByRef);

// Labels (protect with auth; adjust if you want them public after payment)
router.get("/:id/label.pdf", checkToken, getShipmentLabelById);
router.get("/by-ref/:ref/label.pdf", checkToken, getShipmentLabelByRef);



export default router;
