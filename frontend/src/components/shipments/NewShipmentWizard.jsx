// src/features/shipments/NewShipmentWizard.jsx
import { useMemo, useState } from "react";
import { useShipment } from "@/context/ShipmentContext.jsx";
import { createShipment } from "@/api/shipmentsApi.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STEPS = ["Sender", "Receiver", "Items", "Review"];

export default function NewShipmentWizard() {
  const { draft, setDraft, clearDraft, setLastCreatedShipment } = useShipment();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  function next() {
    if (!validateStep(step, draft, setError)) return;
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep(step, draft, setError)) return;
    setSubmitting(true);
    setError("");
    try {
      // Normalize for backend: coerce numbers / empty strings
      const payload = mapDraftToPayload(draft);
      const res = await createShipment(payload);
      setLastCreatedShipment(res); // { ref, shipmentId, status }
      clearDraft();
      // Navigate to a confirmation screen or inline show success:
      alert(`Shipment booked!\nRef: ${res.ref}\nStatus: ${res.status}`);
    } catch (e) {
      setError(e.message || "Failed to create shipment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="text-sm mb-2">
              Step {step + 1} of {STEPS.length}: <span className="font-medium">{STEPS[step]}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <Separator />

          {/* Step content */}
          {step === 0 && <StepSender value={draft.sender} onChange={(v) => setDraft((d) => ({ ...d, sender: v }))} />}
          {step === 1 && <StepReceiver value={draft.receiver} onChange={(v) => setDraft((d) => ({ ...d, receiver: v }))} />}
          {step === 2 && <StepItems value={draft.contents} onChange={(v) => setDraft((d) => ({ ...d, contents: v }))} />}
          {step === 3 && <StepReview draft={draft} onDraftChange={setDraft} />}

          {error && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2">
              {error}
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Booking…" : "Confirm & Book"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------- Steps ----------------- */

function StepSender({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <TextField label="Name *" value={value.name} onChange={(v) => onChange({ ...value, name: v })} />
      <TextField label="Company" value={value.company} onChange={(v) => onChange({ ...value, company: v })} />
      <TextField label="Email *" type="email" value={value.email} onChange={(v) => onChange({ ...value, email: v })} />
      <TextField label="Phone *" value={value.phone} onChange={(v) => onChange({ ...value, phone: v })} />
      <TextField label="Address line 1 *" value={value.address.line1} onChange={(v) => onChange({ ...value, address: { ...value.address, line1: v } })} />
      <TextField label="Address line 2" value={value.address.line2} onChange={(v) => onChange({ ...value, address: { ...value.address, line2: v } })} />
      <TextField label="City *" value={value.address.city} onChange={(v) => onChange({ ...value, address: { ...value.address, city: v } })} />
      <TextField label="State" value={value.address.state} onChange={(v) => onChange({ ...value, address: { ...value.address, state: v } })} />
      <TextField label="Postal code *" value={value.address.postalCode} onChange={(v) => onChange({ ...value, address: { ...value.address, postalCode: v } })} />
      <TextField label="Country (ISO-2) *" value={value.address.country} onChange={(v) => onChange({ ...value, address: { ...value.address, country: v.toUpperCase() } })} />
      <Separator className="md:col-span-2" />
      <TextField label="Pickup date (ISO)" placeholder="YYYY-MM-DDTHH:mm" value={value.pickupDate} onChange={() => {}} disabled className="hidden" />
    </div>
  );
}

function StepReceiver({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <TextField label="Name *" value={value.name} onChange={(v) => onChange({ ...value, name: v })} />
      <TextField label="Company" value={value.company} onChange={(v) => onChange({ ...value, company: v })} />
      <TextField label="Email *" type="email" value={value.email} onChange={(v) => onChange({ ...value, email: v })} />
      <TextField label="Phone *" value={value.phone} onChange={(v) => onChange({ ...value, phone: v })} />
      <TextField label="Address line 1 *" value={value.address.line1} onChange={(v) => onChange({ ...value, address: { ...value.address, line1: v } })} />
      <TextField label="Address line 2" value={value.address.line2} onChange={(v) => onChange({ ...value, address: { ...value.address, line2: v } })} />
      <TextField label="City *" value={value.address.city} onChange={(v) => onChange({ ...value, address: { ...value.address, city: v } })} />
      <TextField label="State" value={value.address.state} onChange={(v) => onChange({ ...value, address: { ...value.address, state: v } })} />
      <TextField label="Postal code *" value={value.address.postalCode} onChange={(v) => onChange({ ...value, address: { ...value.address, postalCode: v } })} />
      <TextField label="Country (ISO-2) *" value={value.address.country} onChange={(v) => onChange({ ...value, address: { ...value.address, country: v.toUpperCase() } })} />
      <Separator className="md:col-span-2" />
    </div>
  );
}

function StepItems({ value, onChange }) {
  function update(idx, patch) {
    const next = value.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  }
  function add() {
    onChange([...value, { description: "", quantity: 1, weightKg: "", lengthCm: "", widthCm: "", heightCm: "", valueCurrency: "EUR", valueAmount: "" }]);
  }
  function remove(idx) {
    const next = value.filter((_, i) => i !== idx);
    onChange(next.length ? next : [{ description: "", quantity: 1 }]);
  }

  return (
    <div className="space-y-4">
      {value.map((it, idx) => (
        <Card key={idx} className="border-dashed">
          <CardContent className="pt-6 grid md:grid-cols-3 gap-3">
            <TextField label="Description *" value={it.description} onChange={(v) => update(idx, { description: v })} />
            <NumberField label="Quantity *" min={1} value={it.quantity} onChange={(v) => update(idx, { quantity: v })} />
            <NumberField label="Weight (kg)" step="0.01" value={it.weightKg} onChange={(v) => update(idx, { weightKg: v })} />
            <NumberField label="Length (cm)" value={it.lengthCm} onChange={(v) => update(idx, { lengthCm: v })} />
            <NumberField label="Width (cm)" value={it.widthCm} onChange={(v) => update(idx, { widthCm: v })} />
            <NumberField label="Height (cm)" value={it.heightCm} onChange={(v) => update(idx, { heightCm: v })} />
            <TextField label="Currency (3-letter)" value={it.valueCurrency || ""} onChange={(v) => update(idx, { valueCurrency: v.toUpperCase() })} />
            <NumberField label="Declared value" step="0.01" value={it.valueAmount || ""} onChange={(v) => update(idx, { valueAmount: v })} />
            <div className="flex items-end">
              <Button variant="destructive" type="button" onClick={() => remove(idx)}>
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={add}>
          + Add Item
        </Button>
      </div>
    </div>
  );
}

function StepReview({ draft, onDraftChange }) {
  // lightweight controls for pickup/dropoff on review step
  return (
    <div className="space-y-4">
      <Section title="Sender">
        <Mono json={draft.sender} />
      </Section>
      <Section title="Receiver">
        <Mono json={draft.receiver} />
      </Section>
      <Section title="Items">
        <Mono json={draft.contents} />
      </Section>

      <div className="grid md:grid-cols-2 gap-4">
        <TextField
          label="Pickup date (ISO) — required if no dropoff date"
          placeholder="YYYY-MM-DDTHH:mm"
          value={draft.pickup?.date || ""}
          onChange={(v) => onDraftChange((d) => ({ ...d, pickup: { ...(d.pickup || {}), date: v } }))}
        />
        <TextField
          label="Drop-off date (ISO)"
          placeholder="YYYY-MM-DDTHH:mm"
          value={draft.dropoff?.date || ""}
          onChange={(v) => onDraftChange((d) => ({ ...d, dropoff: { ...(d.dropoff || {}), date: v } }))}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField label="Pickup notes" value={draft.pickup?.notes || ""} onChange={(v) => onDraftChange((d) => ({ ...d, pickup: { ...(d.pickup || {}), notes: v } }))} />
        <TextField label="Drop-off notes" value={draft.dropoff?.notes || ""} onChange={(v) => onDraftChange((d) => ({ ...d, dropoff: { ...(d.dropoff || {}), notes: v } }))} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TextField
          label="Service level"
          value={draft.serviceLevel || "standard"}
          onChange={(v) => onDraftChange((d) => ({ ...d, serviceLevel: v }))}
          placeholder="standard | express"
        />
        <div />
      </div>
    </div>
  );
}

/* -------------- Reusable tiny inputs -------------- */

function TextField({ label, value, onChange, type = "text", placeholder = "", disabled = false, className = "" }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
function NumberField({ label, value, onChange, min, step, placeholder = "" }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div>
      <div className="font-medium mb-2">{title}</div>
      <div className="rounded-md border p-3 bg-muted/30">{children}</div>
    </div>
  );
}
function Mono({ json }) {
  return (
    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(json, null, 2)}</pre>
  );
}

/* -------------- Validation + Mapping -------------- */

function validateStep(step, draft, setError) {
  if (step === 0) {
    const s = draft.sender;
    if (!s.name || !s.email || !s.phone || !s.address.line1 || !s.address.city || !s.address.postalCode || !s.address.country) {
      setError("Please complete all required Sender fields.");
      return false;
    }
  }
  if (step === 1) {
    const r = draft.receiver;
    if (!r.name || !r.email || !r.phone || !r.address.line1 || !r.address.city || !r.address.postalCode || !r.address.country) {
      setError("Please complete all required Receiver fields.");
      return false;
    }
  }
  if (step === 2) {
    if (!Array.isArray(draft.contents) || draft.contents.length === 0) {
      setError("Add at least one item.");
      return false;
    }
    for (const it of draft.contents) {
      if (!it.description || !it.quantity || it.quantity < 1) {
        setError("Each item needs a description and quantity ≥ 1.");
        return false;
      }
    }
  }
  if (step === 3) {
    // pickup OR dropoff date must exist; back-end also enforces
    const hasPickup = !!draft?.pickup?.date;
    const hasDrop = !!draft?.dropoff?.date;
    if (!hasPickup && !hasDrop) {
      setError("Provide a Pickup or Drop-off date.");
      return false;
    }
  }
  return true;
}

function mapDraftToPayload(d) {
  // Trim strings, uppercase country/currency, coerce numbers where needed
  const trim = (s) => (typeof s === "string" ? s.trim() : s);
  const up = (s) => (typeof s === "string" ? s.trim().toUpperCase() : s);

  const sender = {
    ...d.sender,
    name: trim(d.sender.name),
    company: trim(d.sender.company),
    email: trim(d.sender.email),
    phone: trim(d.sender.phone),
    address: {
      line1: trim(d.sender.address.line1),
      line2: trim(d.sender.address.line2),
      city: trim(d.sender.address.city),
      state: trim(d.sender.address.state),
      postalCode: trim(d.sender.address.postalCode),
      country: up(d.sender.address.country || "DE"),
    },
  };

  const receiver = {
    ...d.receiver,
    name: trim(d.receiver.name),
    company: trim(d.receiver.company),
    email: trim(d.receiver.email),
    phone: trim(d.receiver.phone),
    address: {
      line1: trim(d.receiver.address.line1),
      line2: trim(d.receiver.address.line2),
      city: trim(d.receiver.address.city),
      state: trim(d.receiver.address.state),
      postalCode: trim(d.receiver.address.postalCode),
      country: up(d.receiver.address.country || "DE"),
    },
  };

  const contents = (d.contents || []).map((it) => ({
    description: trim(it.description),
    quantity: Number(it.quantity || 1),
    weightKg: it.weightKg === "" ? undefined : Number(it.weightKg),
    lengthCm: it.lengthCm === "" ? undefined : Number(it.lengthCm),
    widthCm: it.widthCm === "" ? undefined : Number(it.widthCm),
    heightCm: it.heightCm === "" ? undefined : Number(it.heightCm),
    valueCurrency: it.valueCurrency ? up(it.valueCurrency) : undefined,
    valueAmount: it.valueAmount === "" ? undefined : Number(it.valueAmount),
  }));

  const pickup = {
    date: d.pickup?.date ? new Date(d.pickup.date).toISOString() : undefined,
    notes: trim(d.pickup?.notes || ""),
  };
  const dropoff = {
    date: d.dropoff?.date ? new Date(d.dropoff.date).toISOString() : undefined,
    notes: trim(d.dropoff?.notes || ""),
  };

  const payload = {
    sender,
    receiver,
    contents,
    pickup,
    dropoff,
    serviceLevel: d.serviceLevel || "standard",
  };

  // Only include price if you’re using it now
  if (d.price && d.price.currency && d.price.amount !== "") {
    payload.price = { currency: up(d.price.currency), amount: Number(d.price.amount) };
  }

  return payload;
}
