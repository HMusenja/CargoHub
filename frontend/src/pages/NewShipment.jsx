// src/pages/NewShipment.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/label.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download } from "lucide-react";
import { createShipment } from "@/api/shipmentsApi";
import { useAuth } from "@/context/AuthContext";
import { useShipment } from "@/context/ShipmentContext";

import { useToast } from "@/hooks/use-toast";

const DRAFT_KEY = "shipment:new:draft:v1";

const NewShipment = () => {
  const [step, setStep] = useState(1); // 1..5 (5 = Confirmation)
  const { user } = useAuth?.() || { user: null };
  const { setLastCreatedShipment } = useShipment();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [serverErrors, setServerErrors] = useState([]);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast?.() || { toast: () => {} };

  const [formData, setFormData] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : getEmptyDraft();
    } catch {
      return getEmptyDraft();
    }
  });

  const [created, setCreated] = useState(null); // { ref, shipmentId, status }

  // Quick-fill from account profile
  function fillSenderFromProfile() {
    if (!user) return;
    setFormData((d) => ({
      ...d,
      sender: {
        ...d.sender,
        name: user.name || d.sender.name,
        company: user.company || d.sender.company || "",
        email: user.email || d.sender.email,
        phone: user.phone || d.sender.phone || "",
        address: {
          line1: user.address?.line1 || d.sender.address.line1,
          line2: user.address?.line2 || d.sender.address.line2 || "",
          city: user.address?.city || d.sender.address.city,
          state: user.address?.state || d.sender.address.state || "",
          postalCode: user.address?.postalCode || d.sender.address.postalCode,
          country: (
            user.address?.country ||
            d.sender.address.country ||
            "DE"
          ).toUpperCase(),
        },
      },
    }));
  }
  // Copy sender → receiver (for testing)
  function copySenderToReceiver() {
    setFormData((d) => ({
      ...d,
      receiver: JSON.parse(JSON.stringify(d.sender)),
    }));
  }

  // Items helpers
  function addItem() {
    setFormData((d) => ({
      ...d,
      contents: [
        ...(d.contents || []),
        {
          description: "",
          quantity: 1,
          weightKg: "",
          lengthCm: "",
          widthCm: "",
          heightCm: "",
          valueCurrency: "EUR",
          valueAmount: "",
        },
      ],
    }));
  }
  function removeItem(idx) {
    setFormData((d) => {
      const next = structuredClone(d);
      next.contents.splice(idx, 1);
      if (next.contents.length === 0) {
        next.contents.push({
          description: "",
          quantity: 1,
          weightKg: "",
          lengthCm: "",
          widthCm: "",
          heightCm: "",
          valueCurrency: "EUR",
          valueAmount: "",
        });
      }
      return next;
    });
  }
  function updateItem(idx, patch) {
    setFormData((d) => {
      const next = structuredClone(d);
      next.contents[idx] = { ...(next.contents[idx] || {}), ...patch };
      return next;
    });
  }

  // Totals
  const totals = useMemo(() => {
    const items = formData.contents || [];
    const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const totalWeight = items.reduce(
      (s, it) => s + Number(it.weightKg || 0),
      0
    );
    return { totalQty, totalWeight };
  }, [formData.contents]);

  // persist draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  // progress (4 data steps)
  const progress = useMemo(() => ((Math.min(step, 4) - 1) / 4) * 100, [step]);

const nextStep = (e) => {
  e?.preventDefault?.();
  const res = validateStep(step, formData, setError);
  if (res?.ok === false) {
    if (res.focusId) setTimeout(() => document.getElementById(res.focusId)?.focus(), 0);
    return;
  }
  setError("");
  setStep((s) => Math.min(s + 1, 5));
};


  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  async function submitShipment() {
    if (!confirmChecked) {
      setError("Please confirm the details are correct before booking.");
      return;
    }
    if (!validateStep(4, formData, setError)) return;
    setSubmitting(true);
    setServerErrors([]);
    setError("");
    try {
      const payload = mapToPayload(formData);
      const res = await createShipment(payload); // { ref, shipmentId, status }
      setLastCreatedShipment?.(res);
      setCreated(res);
      // clear the draft after success
      localStorage.removeItem(DRAFT_KEY);
      setFormData(getEmptyDraft());
      toast({
        title: "Shipment booked",
        description: `Ref: ${res.ref}`,
      });
      setStep(5);
    } catch (e) {
      setError(e.message || "Failed to create shipment");
      setServerErrors(Array.isArray(e.errors) ? e.errors : []);

      // If backend sent a path, hint the user by jumping to that step
      const first = errs[0];
      if (first?.path) {
        const p = String(first.path);
        if (p.startsWith("sender")) jumpToStep(1);
        else if (p.startsWith("receiver")) jumpToStep(2);
        else if (p.startsWith("contents")) jumpToStep(3);
        else if (
          p.startsWith("pickup") ||
          p.startsWith("dropoff") ||
          p.startsWith("serviceLevel")
        )
          jumpToStep(3);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // helpers to update nested fields tersely
  const u = (path) => (val) => setFormData((d) => setAtPath(d, path, val));

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Create New Shipment
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Complete the steps below to book your shipment
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 w-full h-1 bg-muted -z-10">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      s <= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s < step ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground hidden sm:block">
                    {s === 1 && "Sender"}
                    {s === 2 && "Receiver"}
                    {s === 3 && "Items"}
                    {s === 4 && "Review"}
                    {s === 5 && "Confirm"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {/* Step 1: Sender */}
              {step === 1 && (
                <form onSubmit={nextStep} className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">
                    Sender Details
                  </h2>
                  <div className="flex justify-end mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillSenderFromProfile}
                      disabled={!user}
                    >
                      Use my profile
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextField
                      label="Full Name *"
                      value={formData.sender.name}
                      onChange={u(["sender", "name"])}
                    />
                    <TextField
                      label="Email *"
                      type="email"
                      value={formData.sender.email}
                      onChange={u(["sender", "email"])}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextField
                      label="Phone *"
                      type="tel"
                      value={formData.sender.phone}
                      onChange={u(["sender", "phone"])}
                    />
                    <SelectField
                      label="Country (ISO-2) *"
                      value={formData.sender.address.country}
                      onChange={u(["sender", "address", "country"])}
                      options={[
                        { value: "", label: "Select" },
                        { value: "GB", label: "United Kingdom" },
                        { value: "DE", label: "Germany" },
                        { value: "FR", label: "France" },
                      ]}
                    />
                  </div>

                  <TextareaField
                    label="Address *"
                    value={formData.sender.address.line1}
                    onChange={u(["sender", "address", "line1"])}
                    rows={3}
                  />

                  <div className="grid sm:grid-cols-3 gap-4">
                    <TextField
                      label="City *"
                      value={formData.sender.address.city}
                      onChange={u(["sender", "address", "city"])}
                    />
                    <TextField
                      label="State/Region"
                      value={formData.sender.address.state}
                      onChange={u(["sender", "address", "state"])}
                    />
                    <TextField
                      label="Postal Code *"
                      value={formData.sender.address.postalCode}
                      onChange={u(["sender", "address", "postalCode"])}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!canProceed(1, formData)}
                  >
                    Continue to Receiver Details
                  </Button>
                </form>
              )}

              {/* Step 2: Receiver */}
              {step === 2 && (
                <form onSubmit={nextStep} className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">
                    Receiver Details
                  </h2>
                  <div className="flex justify-end mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copySenderToReceiver}
                    >
                      Copy from sender
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextField
                      label="Full Name *"
                      value={formData.receiver.name}
                      onChange={u(["receiver", "name"])}
                    />
                    <TextField
                      label="Email *"
                      type="email"
                      value={formData.receiver.email}
                      onChange={u(["receiver", "email"])}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextField
                      label="Phone *"
                      type="tel"
                      value={formData.receiver.phone}
                      onChange={u(["receiver", "phone"])}
                    />
                    <SelectField
                      label="Country (ISO-2) *"
                      value={formData.receiver.address.country}
                      onChange={u(["receiver", "address", "country"])}
                      options={[
                        { value: "", label: "Select" },
                        { value: "NG", label: "Nigeria" },
                        { value: "KE", label: "Kenya" },
                        { value: "GH", label: "Ghana" },
                      ]}
                    />
                  </div>

                  <TextareaField
                    label="Address *"
                    value={formData.receiver.address.line1}
                    onChange={u(["receiver", "address", "line1"])}
                    rows={3}
                  />

                  <div className="grid sm:grid-cols-3 gap-4">
                    <TextField
                      label="City *"
                      value={formData.receiver.address.city}
                      onChange={u(["receiver", "address", "city"])}
                    />
                    <TextField
                      label="State/Region"
                      value={formData.receiver.address.state}
                      onChange={u(["receiver", "address", "state"])}
                    />
                    <TextField
                      label="Postal Code *"
                      value={formData.receiver.address.postalCode}
                      onChange={u(["receiver", "address", "postalCode"])}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1"
                      disabled={!canProceed(2, formData)}
                    >
                      Continue to Item Details
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: Items */}
              {step === 3 && (
                <form onSubmit={nextStep} className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">
                    Item Details
                  </h2>

                  <div className="space-y-4">
                    {formData.contents.map((it, idx) => (
                      <Card key={idx} className="border-dashed">
                        <CardContent className="pt-6 space-y-4">
                          <TextareaField
                            label={`Item ${idx + 1} — Description *`}
                            value={it.description}
                            onChange={(v) =>
                              updateItem(idx, { description: v })
                            }
                            rows={3}
                          />
                          <div className="grid sm:grid-cols-2 gap-4">
                            <NumberField
                              label="Quantity *"
                              min={1}
                              value={it.quantity}
                              onChange={(v) => updateItem(idx, { quantity: v })}
                            />
                            <NumberField
                              label="Weight (kg)"
                              step="0.01"
                              value={it.weightKg}
                              onChange={(v) => updateItem(idx, { weightKg: v })}
                            />
                          </div>
                          <div className="grid sm:grid-cols-3 gap-4">
                            <NumberField
                              label="Length (cm)"
                              value={it.lengthCm}
                              onChange={(v) => updateItem(idx, { lengthCm: v })}
                            />
                            <NumberField
                              label="Width (cm)"
                              value={it.widthCm}
                              onChange={(v) => updateItem(idx, { widthCm: v })}
                            />
                            <NumberField
                              label="Height (cm)"
                              value={it.heightCm}
                              onChange={(v) => updateItem(idx, { heightCm: v })}
                            />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <TextField
                              label="Declared Currency (3-letter)"
                              value={it.valueCurrency || ""}
                              onChange={(v) =>
                                updateItem(idx, {
                                  valueCurrency: (v || "").toUpperCase(),
                                })
                              }
                              placeholder="EUR"
                            />
                            <NumberField
                              label="Declared Value"
                              step="0.01"
                              value={it.valueAmount}
                              onChange={(v) =>
                                updateItem(idx, { valueAmount: v })
                              }
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => removeItem(idx)}
                            >
                              Remove item
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="mr-4">
                          Total qty: <b>{totals.totalQty}</b>
                        </span>
                        <span>
                          {" "}
                          Total weight (kg):{" "}
                          <b>
                            {Number.isFinite(totals.totalWeight)
                              ? totals.totalWeight
                              : 0}
                          </b>
                        </span>
                      </div>
                      <Button type="button" variant="outline" onClick={addItem}>
                        + Add item
                      </Button>
                    </div>
                  </div>

                  {/* Keep your schedule + service fields below */}
                  <div className="mt-6 grid sm:grid-cols-2 gap-4">
                    <TextField
                      label="Pickup date (ISO) — required if no dropoff date"
                      type="datetime-local"
                      value={formData.pickup.date}
                      onChange={u(["pickup", "date"])}
                    />
                    <TextField
                      label="Drop-off date (ISO)"
                      type="datetime-local"
                      value={formData.dropoff.date}
                      onChange={u(["dropoff", "date"])}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <TextField
                      label="Pickup notes"
                      value={formData.pickup.notes}
                      onChange={u(["pickup", "notes"])}
                    />
                    <TextField
                      label="Drop-off notes"
                      value={formData.dropoff.notes}
                      onChange={u(["dropoff", "notes"])}
                    />
                  </div>

                  <div className="mt-4">
                    <SelectField
                      label="Service Level *"
                      value={formData.serviceLevel}
                      onChange={u(["serviceLevel"])}
                      options={[
                        { value: "", label: "Select service" },
                        { value: "standard", label: "Standard" },
                        { value: "express", label: "Express" },
                      ]}
                    />
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1"
                      disabled={!canProceed(3, formData)}
                    >
                      Review & Confirm
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 4: Review & Confirm (submits to backend) */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">
                    Review & Confirm
                  </h2>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle>From (Sender)</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => jumpToStep(1)}
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <SummaryAddress party={formData.sender} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle>To (Receiver)</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => jumpToStep(2)}
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <SummaryAddress party={formData.receiver} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle>Items</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => jumpToStep(3)}
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="text-sm list-disc list-inside">
                        {(formData.contents || []).map((it, i) => (
                          <li key={i} className="font-mono">
                            {it.quantity} × {it.description}{" "}
                            {it.weightKg ? `— ${it.weightKg} kg` : ""}{" "}
                            {it.lengthCm || it.widthCm || it.heightCm
                              ? `(${it.lengthCm || "-"}×${it.widthCm || "-"}×${
                                  it.heightCm || "-"
                                } cm)`
                              : ""}
                            {it.valueAmount
                              ? ` — ${it.valueAmount} ${it.valueCurrency || ""}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                      <div className="text-xs text-muted-foreground">
                        Totals: qty{" "}
                        <b>
                          {(formData.contents || []).reduce(
                            (s, it) => s + Number(it.quantity || 0),
                            0
                          )}
                        </b>
                        {"  "}•{"  "}
                        weight{" "}
                        <b>
                          {(formData.contents || []).reduce(
                            (s, it) => s + Number(it.weightKg || 0),
                            0
                          )}
                        </b>{" "}
                        kg
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle>Schedule & Service</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => jumpToStep(3)}
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div>
                        Service: <b>{formData.serviceLevel || "standard"}</b>
                      </div>
                      <div>
                        Pickup: <b>{formData.pickup?.date || "—"}</b>{" "}
                        {formData.pickup?.notes
                          ? `— ${formData.pickup.notes}`
                          : ""}
                      </div>
                      <div>
                        Drop-off: <b>{formData.dropoff?.date || "—"}</b>{" "}
                        {formData.dropoff?.notes
                          ? `— ${formData.dropoff.notes}`
                          : ""}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center gap-2">
                    <input
                      id="confirm"
                      type="checkbox"
                      className="h-4 w-4 border-input rounded"
                      checked={confirmChecked}
                      onChange={(e) => setConfirmChecked(e.target.checked)}
                    />
                    <Label htmlFor="confirm">
                      I confirm the details are correct.
                    </Label>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
                      <div className="font-medium mb-1">{error}</div>
                      {serverErrors.length > 0 && (
                        <ul className="mt-1 list-disc list-inside text-xs">
                          {serverErrors.map((er, i) => (
                            <li key={i}>
                              {er.path ? (
                                <span className="font-mono">{er.path}</span>
                              ) : null}
                              {er.path ? ": " : ""}
                              {er.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={submitShipment}
                      disabled={
                        submitting ||
                        !confirmChecked ||
                        !canProceed(4, formData)
                      }
                    >
                      {submitting ? "Booking…" : "Confirm & Book"}
                    </Button>
                  </div>
                </div>
              )}
              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className="space-y-6 text-center py-8">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-primary" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-foreground">
                    Shipment booked
                  </h2>
                  <p className="text-muted-foreground">
                    Reference:&nbsp;
                    <span className="font-mono font-bold text-foreground">
                      {created?.ref || "—"}
                    </span>
                    {"  "}• Status:{" "}
                    <span className="font-semibold">
                      {created?.status || "BOOKED"}
                    </span>
                  </p>

                  <Card className="text-left">
                    <CardContent className="pt-6 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        You can generate a placeholder label now and print it. A
                        full label flow will come later.
                      </p>
                      <LabelPreview
                        refCode={created?.ref}
                        sender={formData.sender}
                        receiver={formData.receiver}
                        items={formData.contents}
                      />
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => window.print()}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Create placeholder label (PDF)
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => navigate("/shipments")}
                    >
                      View all shipments
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={() => {
                        setStep(1);
                        setCreated(null);
                      }}
                    >
                      Create another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewShipment;

/* ------------------------- Small UI helpers ------------------------- */
function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  ...rest
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
}
function NumberField({ label, value, onChange, min, step, placeholder = "" }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
      />
    </div>
  );
}
function TextareaField({ label, value, onChange, rows = 3, placeholder = "" }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}
function SelectField({ label, value, onChange, options = [] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value + o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
function Mono({ obj }) {
  return (
    <pre className="text-xs whitespace-pre-wrap">
      {JSON.stringify(obj, null, 2)}
    </pre>
  );
}

/* ------------------------- Validation + Mapping ------------------------- */
function canProceed(step, d) {
  if (step === 1) {
    const s = d.sender;
    const ok = !!(
      s.name &&
      s.email &&
      s.phone &&
      s.address.line1 &&
      s.address.city &&
      s.address.postalCode &&
      s.address.country
    );
    return (
      ok &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s.email || "").replace(/\s+/g, ""))
    );
  }
  if (step === 2) {
    const r = d.receiver;
    const ok = !!(
      r.name &&
      r.email &&
      r.phone &&
      r.address.line1 &&
      r.address.city &&
      r.address.postalCode &&
      r.address.country
    );
    return (
      ok &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r.email || "").replace(/\s+/g, ""))
    );
  }
  if (step === 3) {
    const items = d.contents || [];
    if (!items.length) return false;
    if (items.some((it) => !it.description || !it.quantity || it.quantity < 1))
      return false;
    // serviceLevel optional but if present must be standard|express
    if (d.serviceLevel && !["standard", "express"].includes(d.serviceLevel))
      return false;
    return true;
  }
  if (step === 4) {
    const hasPickup = !!d.pickup?.date;
    const hasDrop = !!d.dropoff?.date;
    return hasPickup || hasDrop;
  }
  return true;
}

function validateStep(step, d, setError) {
  if (step === 1) {
    const s = d.sender;
    if (
      !s.name ||
      !s.email ||
      !s.phone ||
      !s.address.line1 ||
      !s.address.city ||
      !s.address.postalCode ||
      !s.address.country
    ) {
      setError("Please complete all required Sender fields.");
      return false;
    }
  }
  if (step === 2) {
    const r = d.receiver;
    if (
      !r.name ||
      !r.email ||
      !r.phone ||
      !r.address.line1 ||
      !r.address.city ||
      !r.address.postalCode ||
      !r.address.country
    ) {
      setError("Please complete all required Receiver fields.");
      return false;
    }
  }
  if (step === 3) {
    const items = d.contents || [];
    if (!Array.isArray(items) || items.length === 0) {
      setError("Add at least one item.");
      return false;
    }
    for (const [i, it] of items.entries()) {
      if (!it.description || !it.quantity || it.quantity < 1) {
        setError(`Item ${i + 1}: description and quantity ≥ 1 are required.`);
        return false;
      }
    }
  }
  if (step === 4) {
    const hasPickup = !!d.pickup?.date;
    const hasDrop = !!d.dropoff?.date;
    if (!hasPickup && !hasDrop) {
      setError("Provide a Pickup or Drop-off date.");
      return false;
    }
  }
  return true;
}

function mapToPayload(d) {
  const trim = (s) => (typeof s === "string" ? s.trim() : s);
  const up = (s) => (typeof s === "string" ? s.trim().toUpperCase() : s);

  const sender = {
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

  const it = d.contents[0] || {};
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

  return {
    sender,
    receiver,
    contents,
    pickup: {
      date: d.pickup?.date ? new Date(d.pickup.date).toISOString() : undefined,
      notes: trim(d.pickup?.notes || ""),
    },
    dropoff: {
      date: d.dropoff?.date
        ? new Date(d.dropoff.date).toISOString()
        : undefined,
      notes: trim(d.dropoff?.notes || ""),
    },
    serviceLevel: d.serviceLevel || "standard",
  };
}

/* ------------------------- Small utils ------------------------- */
function getEmptyDraft() {
  return {
    sender: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "DE",
      },
    },
    receiver: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    },
    contents: [
      {
        description: "",
        quantity: 1,
        weightKg: "",
        lengthCm: "",
        widthCm: "",
        heightCm: "",
        valueCurrency: "EUR",
        valueAmount: "",
      },
    ],
    pickup: { date: "", notes: "" },
    dropoff: { date: "", notes: "" },
    serviceLevel: "standard",
  };
}

function setAtPath(obj, path, value) {
  const next = structuredClone(obj);
  const keys = Array.isArray(path) ? path : String(path).split(".");
  let cur = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return next;
}

function updateItem(index, patch, setFormData) {
  setFormData((d) => {
    const next = structuredClone(d);
    const arr = next.contents || [];
    arr[index] = { ...(arr[index] || {}), ...patch };
    next.contents = arr;
    return next;
  });
}
function SummaryAddress({ party }) {
  if (!party) return null;
  const a = party.address || {};
  return (
    <div className="text-sm text-muted-foreground leading-6">
      <div className="text-foreground font-medium">
        {party.name}
        {party.company ? ` — ${party.company}` : ""}
      </div>
      <div>
        {a.line1}
        {a.line2 ? `, ${a.line2}` : ""}
      </div>
      <div>
        {a.postalCode} {a.city}
        {a.state ? `, ${a.state}` : ""}
      </div>
      <div>{a.country}</div>
      <div className="mt-1">
        Email: <span className="font-mono">{party.email}</span>
      </div>
      <div>
        Phone: <span className="font-mono">{party.phone}</span>
      </div>
    </div>
  );
}
function LabelPreview({ refCode, sender, receiver, items }) {
  const itemCount = Array.isArray(items)
    ? items.reduce((s, it) => s + Number(it.quantity || 0), 0)
    : 0;
  const today = new Date().toLocaleDateString();

  const senderCity = sender?.address?.city || "";
  const receiverCity = receiver?.address?.city || "";

  // On-screen preview (card) + hidden print block (captured by CSS)
  return (
    <>
      {/* On-screen preview */}
      <div className="rounded-lg border p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Preview (A6)
        </div>
        <div className="mt-2 grid gap-1 text-sm">
          <div className="font-bold text-lg">
            REF: <span className="font-mono">{refCode || "—"}</span>
          </div>
          <div>
            From: <b>{sender?.name || "—"}</b> — {senderCity}
          </div>
          <div>
            To: <b>{receiver?.name || "—"}</b> — {receiverCity}
          </div>
          <div>
            Items: <b>{itemCount}</b>
          </div>
          <div>
            Date: <b>{today}</b>
          </div>
        </div>
      </div>

      {/* Printable label only */}
      <div id="label-printable" className="hidden">
        <div
          style={{
            width: 420,
            padding: 16,
            border: "1px solid #000",
            borderRadius: 8,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{ fontSize: 12, textTransform: "uppercase", color: "#555" }}
          >
            CargoHub
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
            REF:{" "}
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              {refCode || "—"}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <div>
              <b>From:</b> {sender?.name || "—"} — {senderCity}
            </div>
            <div>
              <b>To:</b> {receiver?.name || "—"} — {receiverCity}
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Items:</b> {itemCount} &nbsp;&nbsp; <b>Date:</b> {today}
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
            * Placeholder label (not a shipping label)
          </div>
        </div>
      </div>
    </>
  );
}
