import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "@/styles/label.css";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { createShipment } from "@/api/shipmentsApi";
import { getQuote } from "@/api/ratesApi";

import { useAuth } from "@/context/AuthContext";
import { useShipment } from "@/context/ShipmentContext";
import { usePayment } from "@/context/PaymentContext";

import { STEPS, STEP_LABELS, TOTAL_PROGRESS_STEPS } from "./constants";
import {
  loadDraft,
  persistDraft,
  clearDraft,
  getEmptyDraft,
  setAtPath,
  mapToPayload,
  validateStep,
} from "./utils";

import { buildInstantQuotePayload, isInstantQuoteReady } from "./quoteBridge";

import SenderStep from "./components/steps/SenderStep";
import ReceiverStep from "./components/steps/ReceiverStep";
import ItemsStep from "./components/steps/ItemsStep";
import ReviewStep from "./components/steps/ReviewStep";
import PaymentStep from "./components/steps/PaymentStep";
import ConfirmStep from "./components/steps/ConfirmStep";

export default function NewShipment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast?.() || { toast: () => {} };
  const { user } = useAuth?.() || { user: null };
  const { setLastCreatedShipment } = useShipment();
  const {
    loading: payLoading,
    error: payError,
    payment,
    payNowDummy,
    downloadLabelByRef,
    resetPayment,
  } = usePayment();

  const [step, setStep] = useState(STEPS.SENDER);
  const [formData, setFormData] = useState(loadDraft);
  const [created, setCreated] = useState(null);

  const [highlightedFields, setHighlightedFields] = useState([]);
  const [prefilled, setPrefilled] = useState(false);

  // Quotes
  const [quote, setQuote] = useState(null);
  const [bookedQuote, setBookedQuote] = useState(null);
  const [snapshotAtBooking, setSnapshotAtBooking] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  // Form + submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [serverErrors, setServerErrors] = useState([]);
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Progress bar
  const progress = useMemo(() => {
    const clamped = Math.min(step, TOTAL_PROGRESS_STEPS);
    return ((clamped - 1) / TOTAL_PROGRESS_STEPS) * 100;
  }, [step]);

  const jumpToStep = useCallback(
    (n) => setStep(Math.max(STEPS.SENDER, Math.min(STEPS.CONFIRM, Number(n)))),
    []
  );

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

  useEffect(() => persistDraft(formData), [formData]);
  useEffect(() => {
    if (step === STEPS.PAYMENT && created?.ref) resetPayment();
  }, [step, created?.ref, resetPayment]);

  // 🟢 Prefill from quote page and highlight
  useEffect(() => {
    if (!prefilled && location.state?.quote && location.state?.input) {
      const { quote, input } = location.state;
      const prefilledKeys = [];

      setFormData((d) => {
        const next = {
          ...d,
          sender: {
            ...d.sender,
            country: input.originCountry || d.sender.country,
            postalCode: input.originPostalCode || d.sender.postalCode,
            city: input.originCity || d.sender.city,
          },
          receiver: {
            ...d.receiver,
            country: input.destinationCountry || d.receiver.country,
            postalCode:
              input.destinationPostalCode || d.receiver.postalCode,
            city: input.destinationCity || d.receiver.city,
          },
          contents: [
            ...(d.contents?.length
              ? d.contents
              : [
                  {
                    description: "Package",
                    quantity: 1,
                    weightKg: quote.billableWeightKg || "",
                    lengthCm: input.lengthCm || "",
                    widthCm: input.widthCm || "",
                    heightCm: input.heightCm || "",
                    valueCurrency: quote.currency || "EUR",
                    valueAmount: quote.total || "",
                  },
                ]),
          ],
          serviceLevel: quote.serviceLevel || d.serviceLevel,
        };

        if (input.originCountry) prefilledKeys.push("sender.country");
        if (input.originPostalCode) prefilledKeys.push("sender.postalCode");
        if (input.originCity) prefilledKeys.push("sender.city");
        if (input.destinationCountry)
          prefilledKeys.push("receiver.country");
        if (input.destinationPostalCode)
          prefilledKeys.push("receiver.postalCode");
        if (input.destinationCity)
          prefilledKeys.push("receiver.city");
        if (quote.billableWeightKg) prefilledKeys.push("contents.0.weightKg");
        if (quote.serviceLevel) prefilledKeys.push("serviceLevel");

        return next;
      });

      setHighlightedFields(prefilledKeys);
      setPrefilled(true);
    }
  }, [location.state, prefilled]);

  // Auto fade highlight after 4s
  useEffect(() => {
    if (highlightedFields.length > 0) {
      const timer = setTimeout(() => setHighlightedFields([]), 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

  /**
   * Instant Quote (debounced)
   */
  useEffect(() => {
    if (step >= STEPS.PAYMENT) return;

    let ignore = false;
    let timer;

    const req = buildInstantQuotePayload(formData);
    if (!isInstantQuoteReady(req)) {
      const hasSomeAddress = Boolean(
        req?.origin?.country || req?.destination?.country
      );
      setQuoteError(
        hasSomeAddress
          ? "Please fill origin & destination (incl. postal codes), service level, and item sizes/weights."
          : null
      );
      setQuote(null);
      return;
    }

    setLoadingQuote(true);
    setQuoteError(null);

    timer = setTimeout(async () => {
      try {
        const q = await getQuote(req);
        if (!ignore) {
          setQuote(q);
          setQuoteError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("[quote] failed:", err);
          setQuote(null);
          setQuoteError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to fetch quote"
          );
        }
      } finally {
        if (!ignore) setLoadingQuote(false);
      }
    }, 600);

    return () => {
      ignore = true;
      if (timer) clearTimeout(timer);
    };
  }, [formData, step]);

  const amountCents = useMemo(() => {
    if (created?.price?.amount != null)
      return Math.round(Number(created.price.amount) * 100);
    if (bookedQuote?.total != null)
      return Math.round(Number(bookedQuote.total) * 100);
    if (quote?.total != null)
      return Math.round(Number(quote.total) * 100);
    return undefined;
  }, [created?.price?.amount, bookedQuote?.total, quote?.total]);

  const currency =
    created?.price?.currency ||
    bookedQuote?.currency ||
    quote?.currency ||
    "EUR";

  const totals = useMemo(() => {
    const items = formData.contents || [];
    const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const totalWeight = items.reduce(
      (s, it) => s + Number(it.weightKg || 0),
      0
    );
    return { totalQty, totalWeight };
  }, [formData.contents]);

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
      setSnapshotAtBooking(formData);
      setBookedQuote(quote || null);

      const payload = mapToPayload(formData);
      const res = await createShipment(payload);

      setLastCreatedShipment?.(res);
      setCreated(res);

      if (res?.quote) setBookedQuote(res.quote);

      clearDraft();
      setFormData(getEmptyDraft());

      toast({ title: "Shipment booked", description: `Ref: ${res.ref}` });
      setStep(STEPS.PAYMENT);
    } catch (e) {
      const errs = Array.isArray(e.errors) ? e.errors : [];
      setError(e.message || "Failed to create shipment");
      setServerErrors(errs);
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
                <SenderStep
                  formData={formData}
                  u={u}
                  user={user}
                  onNext={nextStep}
                  highlightedFields={highlightedFields}
                />
              )}
              {step === STEPS.RECEIVER && (
                <ReceiverStep
                  formData={formData}
                  u={u}
                  onPrev={prevStep}
                  onNext={nextStep}
                  highlightedFields={highlightedFields}
                />
              )}
              {step === STEPS.ITEMS && (
                <ItemsStep
                  formData={formData}
                  totals={totals}
                  updateItem={(i, p) =>
                    setFormData((d) => {
                      const next = structuredClone(d);
                      next.contents[i] = { ...(next.contents[i] || {}), ...p };
                      return next;
                    })
                  }
                  addItem={() =>
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
                    }))
                  }
                  removeItem={(i) =>
                    setFormData((d) => {
                      const next = structuredClone(d);
                      next.contents.splice(i, 1);
                      if (next.contents.length === 0)
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
                      return next;
                    })
                  }
                  u={u}
                  onPrev={prevStep}
                  onNext={nextStep}
                  quote={quote}
                  quoteError={quoteError}
                  loadingQuote={loadingQuote}
                  highlightedFields={highlightedFields}
                />
              )}
              {step === STEPS.REVIEW && (
                <ReviewStep
                  formData={formData}
                  confirmChecked={confirmChecked}
                  setConfirmChecked={setConfirmChecked}
                  errorBlock={errorBlock}
                  onPrev={prevStep}
                  onSubmit={submitShipment}
                  submitting={submitting}
                />
              )}
              {step === STEPS.PAYMENT && (
                <PaymentStep
                  created={created}
                  payment={payment}
                  payLoading={payLoading}
                  payError={payError}
                  quote={bookedQuote || created?.quote || quote}
                  formData={snapshotAtBooking}
                  onPayNow={() =>
                    payNowDummy({
                      shipmentRef: created?.ref,
                      amountCents:
                        amountCents ??
                        (quote?.total
                          ? Math.round(Number(quote.total) * 100)
                          : 1500),
                      currency,
                    })
                  }
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
                  formData={snapshotAtBooking}
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
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Create New Shipment
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Complete the steps below to book your shipment
        </p>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 w-full h-1 bg-muted -z-10">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {[1, 2, 3, 4, 5, 6].map((s) => (
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
                {STEP_LABELS[s]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
