// src/routes/rates.js
import { Router } from "express";
import validateQuoteRequest from "../middleware/quoteValidation.js";
import { quoteRatesController } from "../controllers/ratesController.js";

const router = Router();

router.post("/quote", validateQuoteRequest, quoteRatesController);

export default router;
