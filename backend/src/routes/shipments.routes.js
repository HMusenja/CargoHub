// routes/shipments.js
import express from "express";
import { validateCreateShipment } from "../middleware/validateCreateShipment.js";
import checkToken from "../middleware/checkToken.js"
import { roleGuard } from "../middleware/roleGuard.js";
import { createShipment,getShipmentByRef, getShipmentLabelById,
  getShipmentLabelByRef,addProofOfDelivery 
} from "../controllers/shipmentsController.js";
  
import { getShipmentScans } from "../controllers/scanController.js";




const router = express.Router();

// Create
router.post("/", checkToken, validateCreateShipment, createShipment);

// Lookup by ref
router.get("/by-ref/:ref", checkToken, getShipmentByRef);

// Labels (protect with auth; adjust if you want them public after payment)
router.get("/:id/label.pdf", checkToken, getShipmentLabelById);
router.get("/by-ref/:ref/label.pdf", checkToken, getShipmentLabelByRef);

router.get(
  "/:ref/scans",
  checkToken,
  roleGuard(["staff", "admin"]),
  getShipmentScans
);
// Proof of Delivery (POD)
router.post("/:id/pod", checkToken, roleGuard(["driver", "admin"]), addProofOfDelivery);



export default router;
