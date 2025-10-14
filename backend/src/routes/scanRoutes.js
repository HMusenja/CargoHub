// routes/scanRoutes.js
import express from "express";
import  checkToken  from "../middleware/checkToken.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { postScan,patchScan, deleteScan } from "../controllers/scanController.js";

const router = express.Router();

// Mutations restricted to agent|driver|admin
router.post(
  "/",
  checkToken,
  roleGuard(["agent", "driver", "admin"]),
  postScan
);
router.patch("/:scanId", checkToken, roleGuard(["admin"]), patchScan);
router.delete("/:scanId", checkToken, roleGuard(["admin"]), deleteScan);

export default router;
