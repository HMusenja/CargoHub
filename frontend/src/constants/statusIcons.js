// src/constants/statusIcons.js
import {
  ClipboardCheck,
  PackageCheck,
  Truck,
  Building,
  Navigation,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

/**
 * Shipment status → Lucide icon component
 */
export const STATUS_ICON = {
  BOOKED: ClipboardCheck,
  PICKED_UP: PackageCheck,
  IN_TRANSIT: Truck,
  AT_HUB: Building,
  OUT_FOR_DELIVERY: Navigation,
  DELIVERED: CheckCircle,
  EXCEPTION: AlertTriangle,
};

/**
 * Optional: Human-friendly labels for statuses
 */
export const STATUS_LABEL = {
  BOOKED: "Booked",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  AT_HUB: "At hub",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
};
