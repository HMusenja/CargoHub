import mongoose from "mongoose";
import createError from "http-errors";
import Payment from "../models/Payment.js";
import Shipment from "../models/Shipment.js";
import { createPaymentIntent, parseWebhookEvent } from "../services/dummyStripeProvider.js";

/**
 * POST /api/payments/create-intent
 * Accepts either { shipmentId } (ObjectId) or { shipmentRef }.
 * TEMP: amountCents can be provided; otherwise derived from shipment.price.amount * 100
 */
export async function createIntent(req, res, next) {
  try {
    const { shipmentId, shipmentRef, amountCents, currency = "EUR" } = req.body || {};

    // Resolve shipment by id or ref
    let shipment = null;
    if (shipmentId) {
      if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
        return next(createError(400, "Invalid shipmentId (ObjectId required)"));
      }
      shipment = await Shipment.findById(shipmentId);
    } else if (shipmentRef) {
      shipment = await Shipment.findOne({ ref: shipmentRef.trim() });
    } else {
      return next(createError(400, "Provide shipmentId or shipmentRef"));
    }

    if (!shipment) return next(createError(404, "Shipment not found"));
    if (shipment.paymentStatus === "succeeded") {
      return next(createError(400, "Shipment already paid"));
    }

    // Amount (prefer explicit amountCents, else derive from price)
    const derivedCents = Math.round(Number(shipment?.price?.amount || 0) * 100);
    const amount = Number.isFinite(Number(amountCents)) && Number(amountCents) > 0
      ? Number(amountCents)
      : derivedCents;

    if (!amount || amount <= 0) {
      return next(createError(400, "amountCents must be > 0 (or set shipment.price.amount)"));
    }

    // Reuse open payment if any
    const open = await Payment.findOne({
      shipmentId: shipment._id,
      status: { $in: ["requires_payment", "processing"] },
    });

    if (open) {
      return res.status(200).json({
        paymentId: open.stripePaymentIntentId || open._id.toString(),
        clientSecret: open.stripeClientSecret || "test_reused_secret",
        status: open.status === "requires_payment" ? "requires_payment_method" : open.status,
        reused: true,
      });
    }

    // Create dummy intent
    const intent = await createPaymentIntent({
      amount,
      currency,
      metadata: { shipmentId: shipment._id.toString(), shipmentRef: shipment.ref },
    });

    // Persist Payment doc
    await Payment.create({
      userId: shipment.createdBy,
      shipmentId: shipment._id,
      amount,
      currency,
      status: "requires_payment",
      stripePaymentIntentId: intent.id,
      stripeClientSecret: intent.client_secret,
    });

    // Move shipment to processing
    shipment.paymentStatus = "processing";
    await shipment.save();

    return res.status(200).json({
      paymentId: intent.id,
      clientSecret: intent.client_secret,
      status: "requires_payment_method",
    });
  } catch (err) {
    console.error("[payments/create-intent] error:", err);
    return next(createError(400, err.message || "Failed to create payment intent"));
  }
}

/**
 * POST /api/payments/dev/mark-succeeded
 * DEV ONLY helper to flip payment/shipment without Stripe.
 * Body: { paymentId, receiptUrl? }
 */
export async function devMarkSucceeded(req, res, next) {
  try {
    const { paymentId, receiptUrl } = req.body || {};
    if (!paymentId) return next(createError(400, "paymentId is required"));

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentId });
    if (!payment) return next(createError(404, "Payment not found"));

    payment.status = "succeeded";
    if (receiptUrl) payment.receiptUrl = receiptUrl;
    await payment.save();

    const shipment = await Shipment.findById(payment.shipmentId);
    if (shipment) {
      shipment.paymentStatus = "succeeded";
      shipment.paidAt = new Date();
      await shipment.save();
    }

    return res.status(200).json({ ok: true, paymentId, shipmentId: payment.shipmentId });
  } catch (err) {
    console.error("[payments/dev/mark-succeeded] error:", err);
    return next(createError(400, err.message || "Failed to mark payment succeeded"));
  }
}

/**
 * POST /api/payments/webhook
 * Raw-body endpoint (server mounts with express.raw). Dummy verify for now.
 */
export async function webhook(req, res) {
  try {
    const event = parseWebhookEvent(req.body);
    console.log("[dummy-webhook] event.type =", event?.type);

    // When you switch to real Stripe:
    // - On payment_intent.succeeded: find Payment by event.data.object.id, set succeeded,
    //   then set Shipment.paymentStatus = 'succeeded' + paidAt.

    return res.status(200).send("ok");
  } catch (err) {
    console.error("[payments/webhook] error:", err.message);
    return res.status(err.status || 400).send(err.message || "Webhook error");
  }
}

/**
 * GET /api/payments/status?ref=CH-... or ?shipmentId=...
 * Convenience endpoint to check both Payment + Shipment states.
 */
export async function getStatus(req, res, next) {
  try {
    const { ref, shipmentId } = req.query || {};
    let shipment = null;

    if (shipmentId) {
      if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
        return next(createError(400, "Invalid shipmentId"));
      }
      shipment = await Shipment.findById(shipmentId);
    } else if (ref) {
      shipment = await Shipment.findOne({ ref: ref.trim() });
    } else {
      return next(createError(400, "Provide ref or shipmentId"));
    }

    if (!shipment) return next(createError(404, "Shipment not found"));

    const latestPayment = await Payment.findOne({ shipmentId: shipment._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      shipment: {
        id: shipment._id,
        ref: shipment.ref,
        paymentStatus: shipment.paymentStatus,
        paidAt: shipment.paidAt,
        price: shipment.price,
      },
      payment: latestPayment
        ? {
            id: latestPayment._id,
            stripePaymentIntentId: latestPayment.stripePaymentIntentId,
            status: latestPayment.status,
            amount: latestPayment.amount,
            currency: latestPayment.currency,
            receiptUrl: latestPayment.receiptUrl,
            createdAt: latestPayment.createdAt,
          }
        : null,
    });
  } catch (err) {
    return next(createError(500, err.message || "Failed to fetch payment status"));
  }
}
