// server/routes/driverRoutes.js
import express from "express";
import { getDriverAssignments } from "../controllers/driverController.js";
import checkToken from "../middleware/checkToken.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = express.Router();

/**
 * GET /driver/assignments
 * Auth: token + role driver (admins also allowed here)
 */
router.get("/assignments", checkToken, roleGuard(["driver", "admin"]), getDriverAssignments);

export default router;

