// models/Notification.js
import { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // creator (optional)
    email: { type: String },                               // receiver (fallback)
    type: { type: String, required: true },                // e.g., 'shipment'
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },                    // { ref, status, ... }
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Helpful indexes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ email: 1, createdAt: -1 });

export default model("Notification", NotificationSchema);
