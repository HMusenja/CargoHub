import { Router } from "express";
import {
  createIntent,
  devMarkSucceeded,
  webhook,
  getStatus,
} from "../controllers/paymentsController.js";

const router = Router();

// Main create-intent
router.post("/create-intent", createIntent);

// DEV helper
router.post("/dev/mark-succeeded", devMarkSucceeded);

// Status helper
router.get("/status", getStatus);

// Export router; webhook is mounted at server-level (raw body)
export { webhook as paymentsWebhookHandler };
export default router;

