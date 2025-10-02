// routes/shipments.js
import express from "express";
import { validateCreateShipment } from "../middleware/validateCreateShipment.js";
import checkToken from "../middleware/checkToken.js"
import { createShipment } from "../controllers/shipmentsController.js";

const router = express.Router();

router.post("/", checkToken, validateCreateShipment, createShipment);

export default router;
