// models/Shipment.js
import { Schema, model } from "mongoose";

const AddressSchema = new Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const PartySchema = new Schema({
  name: { type: String, required: true },
  company: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: AddressSchema, required: true },
});

const ContentItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  weightKg: { type: Number },
  lengthCm: { type: Number },
  widthCm: { type: Number },
  heightCm: { type: Number },
  valueCurrency: { type: String },
  valueAmount: { type: Number },
});

const ShipmentSchema = new Schema(
  {
    ref: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELED"],
      default: "BOOKED",
    },
    sender: { type: PartySchema, required: true },
    receiver: { type: PartySchema, required: true },
    contents: {
      type: [ContentItemSchema],
      required: true,
      validate: (v) => v.length > 0,
    },
    pickup: {
      date: { type: Date, required: true },
      notes: { type: String },
    },
    dropoff: {
      date: { type: Date },
      notes: { type: String },
    },
    serviceLevel: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote" },
    price: {
      currency: { type: String },
      amount: { type: Number },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "succeeded", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    paidAt: { type: Date },

    // label lifecycle
    labelGeneratedAt: { type: Date },
    labelPath: { type: String }, // e.g., saved file path if you persist to disk
  },
  { timestamps: true }
);
ShipmentSchema.methods.isPaid = function () {
  return this.paymentStatus === "succeeded";
};

const Shipment = model("Shipment", ShipmentSchema);

export default Shipment;
