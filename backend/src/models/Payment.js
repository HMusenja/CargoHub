// models/Counter.js
import { Schema, model } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },

    amount: { type: Number, required: true }, // cents
    currency: { type: String, default: "EUR" },

    status: {
      type: String,
      enum: [
        "requires_payment",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
      default: "requires_payment",
      index: true,
    },

    // Stripe-compatible fields (works for dummy too)
    stripePaymentIntentId: { type: String, index: true },
    stripeClientSecret: { type: String },
    receiptUrl: { type: String },

    // audit / metadata
    notes: { type: String },
  },
  { timestamps: true }
);

// One open payment per shipment (guard against duplicates)
PaymentSchema.index({ shipmentId: 1, status: 1 });

const Payment = model("Payment", PaymentSchema);
export default Payment;
