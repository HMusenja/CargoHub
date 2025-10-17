import express from "express";
import { listShipmentsQueue } from "../controllers/shipmentQueue.controller.js";
import checkToken from "../middleware/checkToken.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = express.Router();

// Only 'admin' and 'staff' can access back-office queue
router.get(
  "/shipments",
  checkToken,
  roleGuard(["admin", "staff"]),
  listShipmentsQueue
);

export default router;
