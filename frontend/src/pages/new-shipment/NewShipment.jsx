import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/label.css";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createShipment } from "@/api/shipmentsApi";
import { useAuth } from "@/context/AuthContext";
import { useShipment } from "@/context/ShipmentContext";
import { usePayment } from "@/context/PaymentContext";

import { DRAFT_KEY, STEPS, STEP_LABELS, TOTAL_PROGRESS_STEPS } from "./constants";
import { loadDraft, persistDraft, clearDraft, getEmptyDraft, setAtPath, mapToPayload, validateStep } from "./utils";

import SenderStep from "./components/steps/SenderStep";
import ReceiverStep from "./components/steps/ReceiverStep";
import ItemsStep from "./components/steps/ItemsStep";
import ReviewStep from "./components/steps/ReviewStep";
import PaymentStep from "./components/steps/PaymentStep";
import ConfirmStep from "./components/steps/ConfirmStep";
import { getQuote } from "@/api/ratesApi";

export default function NewShipment() {
  const navigate = useNavigate();
  const { toast } = useToast?.() || { toast: () => {} };
  const { user } = useAuth?.() || { user: null };
  const { setLastCreatedShipment } = useShipment();

  const [step, setStep] = useState(STEPS.SENDER);
  const [formData, setFormData] = useState(loadDraft);
  const [created, setCreated] = useState(null);
  const [quote, setQuote] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [serverErrors, setServerErrors] = useState([]);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const { loading: payLoading, error: payError, payment, payNowDummy, downloadLabelByRef, resetPayment } = usePayment();

  const progress = useMemo(() => {
    const clamped = Math.min(step, TOTAL_PROGRESS_STEPS);
    return ((clamped - 1) / TOTAL_PROGRESS_STEPS) * 100;
  }, [step]);

  const jumpToStep = useCallback((n) => setStep(Math.max(STEPS.SENDER, Math.min(STEPS.CONFIRM, Number(n)))), []);

  const nextStep = useCallback(
    (e) => {
      e?.preventDefault?.();
      const ok = validateStep(step, formData, setError);
      if (ok === false) return;
      setError("");
      setStep((s) => Math.min(s + 1, STEPS.CONFIRM));
    },
    [step, formData]
  );

  const prevStep = useCallback(() => {
    setError("");
    setStep((s) => Math.max(s - 1, STEPS.SENDER));
  }, []);

  useEffect(() => {
    persistDraft(formData);
  }, [formData]);

  useEffect(() => {
    if (step === STEPS.PAYMENT && created?.ref) resetPayment();
  }, [step, created?.ref, resetPayment]);

  // Fetch a fresh quote when we reach review/payment (and form data changes)
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (step < STEPS.REVIEW) return;
      try {
        const payload = mapToPayload(formData);
        const q = await getQuote({
          sender: payload.sender,
          receiver: payload.receiver,
          contents: payload.contents,
          serviceLevel: payload.serviceLevel,
          pickup: payload.pickup,
          dropoff: payload.dropoff,
        });
        if (!ignore) setQuote(q); // expect { total, currency, ... }
      } catch {
        if (!ignore) setQuote(null);
      }
    }
    run();
    return () => { ignore = true; };
  }, [step, formData]);

  // Prefer shipment.price from backend; else use quote.total
  const amountCents = useMemo(() => {
    if (created?.price?.amount != null) {
      return Math.round(Number(created.price.amount) * 100);
    }
    if (quote?.total != null) {
      return Math.round(Number(quote.total) * 100);
    }
    return undefined;
  }, [created?.price?.amount, quote?.total]);
  const currency = quote?.currency || "EUR";


  const totals = useMemo(() => {
    const items = formData.contents || [];
    const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const totalWeight = items.reduce((s, it) => s + Number(it.weightKg || 0), 0);
    return { totalQty, totalWeight };
  }, [formData.contents]);

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
          country: (user.address?.country || d.sender.address.country || "DE").toUpperCase(),
        },
      },
    }));
  }
  function copySenderToReceiver() {
    setFormData((d) => ({ ...d, receiver: JSON.parse(JSON.stringify(d.sender)) }));
  }
  function addItem() {
    setFormData((d) => ({ ...d, contents: [...(d.contents || []), { description: "", quantity: 1, weightKg: "", lengthCm: "", widthCm: "", heightCm: "", valueCurrency: "EUR", valueAmount: "" }] }));
  }
  function removeItem(idx) {
    setFormData((d) => {
      const next = structuredClone(d);
      next.contents.splice(idx, 1);
      if (next.contents.length === 0) next.contents.push({ description: "", quantity: 1, weightKg: "", lengthCm: "", widthCm: "", heightCm: "", valueCurrency: "EUR", valueAmount: "" });
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
  const u = (path) => (val) => setFormData((d) => setAtPath(d, path, val));

  async function submitShipment() {
    if (!confirmChecked) {
      setError("Please confirm the details are correct before booking.");
      return;
    }
    if (!validateStep(STEPS.REVIEW, formData, setError)) return;

    setSubmitting(true);
    setServerErrors([]);
    setError("");

    try {
      const payload = mapToPayload(formData);
      const res = await createShipment(payload); // { ref, shipmentId, status }
      setLastCreatedShipment?.(res);
      setCreated(res);

      clearDraft();
      setFormData(getEmptyDraft());

      toast({ title: "Shipment booked", description: `Ref: ${res.ref}` });
      setStep(STEPS.PAYMENT);
    } catch (e) {
      const errs = Array.isArray(e.errors) ? e.errors : [];
      setError(e.message || "Failed to create shipment");
      setServerErrors(errs);

      const first = errs[0];
      if (first?.path) {
        const p = String(first.path);
        if (p.startsWith("sender")) jumpToStep(STEPS.SENDER);
        else if (p.startsWith("receiver")) jumpToStep(STEPS.RECEIVER);
        else if (p.startsWith("contents")) jumpToStep(STEPS.ITEMS);
        else if (p.startsWith("pickup") || p.startsWith("dropoff") || p.startsWith("serviceLevel")) jumpToStep(STEPS.ITEMS);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const errorBlock = error ? (
    <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
      <div className="font-medium mb-1">{error}</div>
      {serverErrors.length > 0 && (
        <ul className="mt-1 list-disc list-inside text-xs">
          {serverErrors.map((er, i) => (
            <li key={i}>
              {er.path ? <span className="font-mono">{er.path}</span> : null}
              {er.path ? ": " : ""}
              {er.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Header progress={progress} step={step} />

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {step === STEPS.SENDER && (
                <SenderStep formData={formData} u={u} user={user} onUseProfile={fillSenderFromProfile} onNext={nextStep} />
              )}

              {step === STEPS.RECEIVER && (
                <ReceiverStep formData={formData} u={u} onCopySender={copySenderToReceiver} onPrev={prevStep} onNext={nextStep} />
              )}

              {step === STEPS.ITEMS && (
                <ItemsStep
                  formData={formData}
                  totals={totals}
                  updateItem={updateItem}
                  addItem={addItem}
                  removeItem={removeItem}
                  u={u}
                  onPrev={prevStep}
                  onNext={nextStep}
                />
              )}

              {step === STEPS.REVIEW && (
                <ReviewStep
                  formData={formData}
                  confirmChecked={confirmChecked}
                  setConfirmChecked={setConfirmChecked}
                  errorBlock={errorBlock}
                  onEditSender={() => jumpToStep(STEPS.SENDER)}
                  onEditReceiver={() => jumpToStep(STEPS.RECEIVER)}
                  onEditItems={() => jumpToStep(STEPS.ITEMS)}
                  onPrev={prevStep}
                  onSubmit={submitShipment}
                />
              )}

              {step === STEPS.PAYMENT && (
                <PaymentStep
                  created={created}
                  payment={payment}
                  payLoading={payLoading}
                  payError={payError}
                  onPayNow={() => payNowDummy({ shipmentRef: created?.ref,amountCents: amountCents ?? 1500, currency, })}
                  onDownload={() => downloadLabelByRef(created?.ref)}
                  onPrev={prevStep}
                  onContinue={() => setStep(STEPS.CONFIRM)}
                  amountCents={amountCents}
                  currency={currency}
                />
              )}

              {step === STEPS.CONFIRM && (
                <ConfirmStep
                  created={created}
                  formData={formData}
                  onViewShipments={() => navigate("/shipments")}
                  onCreateAnother={() => {
                    setStep(STEPS.SENDER);
                    setCreated(null);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Header({ progress, step }) {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Create New Shipment</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Complete the steps below to book your shipment</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 w-full h-1 bg-muted -z-10">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              <span className="text-xs mt-2 text-muted-foreground hidden sm:block">{STEP_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
