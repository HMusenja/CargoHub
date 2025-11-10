// src/pages/dashboard/driver/DriverPickups.jsx
import React, { useEffect } from "react";
import { useDriver } from "@/context/DriverContext";

export default function DriverPickups() {
  const { assignments, loading, error, fetchAssignments } = useDriver();

  useEffect(() => {
    // request pickups for today
    fetchAssignments({ type: "pickup" }).catch(() => {});
  }, [fetchAssignments]);

  if (loading) return <div className="p-4">Loading pickups…</div>;
  if (error) return <div className="p-4 text-red-600">Failed to load pickups</div>;

  const pickups = assignments?.pickups || [];
  if (!pickups.length) {
    return <div className="p-4">No pickups scheduled for today.</div>;
  }

  return (
    <div className="space-y-4">
      {pickups.map((p) => (
        <div key={p.shipmentId} className="border rounded p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{p.ref}</div>
              <div className="text-sm">{p.sender?.name} — {p.sender?.phone}</div>
              <div className="text-sm">{p.sender?.address?.line1 ?? p.sender?.address ?? p.sender?.city}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {p.pickupWindow?.from ? new Date(p.pickupWindow.from).toLocaleString() : (p.pickup?.date ? new Date(p.pickup.date).toLocaleString() : "")}
            </div>
          </div>
          {p.notes && <div className="mt-2 text-sm text-muted-foreground">{p.notes}</div>}
        </div>
      ))}
    </div>
  );
}

