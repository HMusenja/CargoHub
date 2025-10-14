// routes/trackRoutes.js
import express from "express";
import { getTrackingByRef } from "../controllers/trackController.js";

const router = express.Router();

// Public read: no auth
router.get("/:ref", getTrackingByRef);

export default router;
