import React, { useEffect, useState } from "react";
import { useDriver } from "@/context/DriverContext";
import PodModal from "@/components/pod/PodModal"; // if you already created one; otherwise inline modal

export default function DriverDeliveries() {
  const { assignments, loading, error, fetchAssignments, submitPOD } = useDriver();
  const [active, setActive] = useState(null); // active shipment for POD modal
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments({ type: "delivery" }).catch(() => {});
  }, [fetchAssignments]);

  const deliveries = assignments?.deliveries || [];

  async function handleSubmitPOD(shipmentId, payload) {
    try {
      setSubmitting(true);
      await submitPOD(shipmentId, payload);
      setActive(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit POD");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-4">Loading deliveries…</div>;
  if (error) return <div className="p-4 text-red-600">Failed to load deliveries</div>;
  if (!deliveries.length) return <div className="p-4">No deliveries assigned for today.</div>;

  return (
    <div className="space-y-4">
      {deliveries.map((d) => (
        <div key={d.shipmentId} className="border rounded p-4 flex justify-between items-start">
          <div>
            <div className="font-medium">{d.ref}</div>
            <div className="text-sm">{d.receiver?.name} — {d.receiver?.phone}</div>
            <div className="text-sm">{d.receiver?.address || d.receiver?.city}</div>
            {d.notes && <div className="mt-1 text-sm text-muted">{d.notes}</div>}
            <div className="mt-2 text-xs text-muted">Window: {new Date(d.deliveryWindow?.from).toLocaleTimeString()} - {new Date(d.deliveryWindow?.to).toLocaleTimeString()}</div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="btn"
              onClick={() => setActive(d)}
            >
              Deliver (POD)
            </button>
            <a
              className="text-sm text-muted"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.receiver?.address || d.receiver?.city || "")}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in maps
            </a>
          </div>
        </div>
      ))}

      {active && (
        // PodModal should call onSubmit(shipmentId, payload)
        <PodModal
          shipment={active}
          onClose={() => setActive(null)}
          onSubmit={(payload) => handleSubmitPOD(active.shipmentId, payload)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
