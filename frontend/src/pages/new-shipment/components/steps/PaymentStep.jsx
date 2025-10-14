// src/pages/new-shipment/components/steps/PaymentStep.jsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getQuote } from "@/api/ratesApi";
import { buildInstantQuotePayload, isInstantQuoteReady } from "../../quoteBridge";

export default function PaymentStep({
  created,            // { ref, shipmentId, status, price?, quote? } (from server)
  payment,            // PaymentContext state
  payLoading,
  payError,
  onPayNow,           // () => create intent + mark success (dummy) in parent
  onDownload,
  onPrev,
  onContinue,
  amountCents,        // precomputed preferred amount from parent (server price > bookedQuote > live quote)
  currency = "EUR",
  quote: quoteProp,   // frozen quote passed from parent (bookedQuote || created?.quote || live quote)
  formData,           // snapshotAtBooking (for fallback fetch if no quoteProp)
}) {
  const [quote, setQuote] = useState(quoteProp || null);
  const [qError, setQError] = useState("");
  const [qLoading, setQLoading] = useState(false);

  // Keep local quote in sync with prop changes
  useEffect(() => {
    setQuote(quoteProp || null);
  }, [quoteProp]);

  // Fallback: if no quote yet, derive from snapshot and fetch once
  useEffect(() => {
    if (quote) return;          // already have a frozen quote
    if (!formData) return;      // nothing to derive from
    const payload = buildInstantQuotePayload(formData);
    if (!isInstantQuoteReady(payload)) {
      setQError("Please complete shipment details (countries, service level, weight/dims).");
      return;
    }
    let ignore = false;
    setQError("");
    setQLoading(true);
    getQuote(payload)
      .then((q) => {
        if (!ignore) setQuote(q);
      })
      .catch((e) => {
        if (!ignore) {
          setQError(e?.response?.data?.message || e.message || "Failed to fetch quote");
        }
      })
      .finally(() => {
        if (!ignore) setQLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [quote, formData]);

  // Work out the best amount to charge and where it came from (for clarity in UI)
  const { effectiveAmountCents, effectiveCurrency, amountSource } = useMemo(() => {
    // 1) Server-booked price is authoritative
    if (amountCents != null && Number.isFinite(amountCents)) {
      return { effectiveAmountCents: amountCents, effectiveCurrency: currency || "EUR", amountSource: "Booked price" };
    }
    // 2) Frozen quote (from booking moment)
    if (quote?.total != null) {
      return {
        effectiveAmountCents: Math.round(Number(quote.total) * 100),
        effectiveCurrency: currency || quote.currency || "EUR",
        amountSource: "Instant quote",
      };
    }
    // 3) Existing payment object (rare, but keep as last fallback)
    if (payment?.amountCents != null) {
      return { effectiveAmountCents: payment.amountCents, effectiveCurrency: currency || "EUR", amountSource: "Existing payment" };
    }
    return { effectiveAmountCents: undefined, effectiveCurrency: currency || "EUR", amountSource: "Unknown" };
  }, [amountCents, currency, quote?.total, quote?.currency, payment?.amountCents]);

  const canPay =
    !!created?.ref &&
    Number.isFinite(effectiveAmountCents) &&
    effectiveAmountCents > 0 &&
    !payLoading;

  return (
    <div className="space-y-6 text-center py-4">
      <h2 className="text-2xl font-semibold text-foreground">Payment</h2>
      <p className="text-muted-foreground">
        Pay for shipment{" "}
        <span className="font-mono font-semibold">{created?.ref || "—"}</span>. After success you can download your label.
      </p>

      <Card className="max-w-md mx-auto text-left">
        <CardContent className="pt-6 space-y-4">
          {/* Quote box */}
          {qLoading && <div>Calculating quote…</div>}

          {qError && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {qError}
            </div>
          )}

          {quote && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <p className="font-medium">
                <b>Quote:</b> {quote.total} {quote.currency || "EUR"}
              </p>
              <p className="text-sm text-muted-foreground">
                Billable weight: {quote.billableWeightKg} kg • Service: {quote.serviceLevel}
              </p>
              {quote.etaISO && (
                <p className="text-sm text-muted-foreground">ETA: {new Date(quote.etaISO).toLocaleString()}</p>
              )}
            </div>
          )}

          {!quote && !qLoading && !qError && (
            <div className="text-sm text-amber-700 border border-amber-200 bg-amber-50 rounded-md p-3">
              No quote available yet. You can still try to pay if an amount is present, or go back to review shipment details.
            </div>
          )}

          {/* Payment error from context */}
          {payError && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {payError}
            </div>
          )}

          {/* Action area */}
          {!payment?.status || payment?.status !== "succeeded" ? (
            <>
              <Button disabled={!canPay} onClick={onPayNow} className="w-full">
                {payLoading ? "Processing…" : "Pay now (dummy)"}
              </Button>
              {!created?.ref && (
                <div className="text-xs text-muted-foreground">
                  Booking reference is missing — complete booking first.
                </div>
              )}
              {(!Number.isFinite(effectiveAmountCents) || effectiveAmountCents <= 0) && (
                <div className="text-xs text-muted-foreground">
                  Amount is not available yet — ensure a valid quote or server price before paying.
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <Button variant="default" className="w-full" onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Label (PDF)
              </Button>
              <Button variant="outline" className="w-full" onClick={onContinue}>
                Continue
              </Button>
            </div>
          )}

          {/* Amount + source summary */}
          <div className="text-xs text-muted-foreground">
            Amount:{" "}
            <b>
              {Number.isFinite(effectiveAmountCents)
                ? (effectiveAmountCents / 100).toFixed(2)
                : "—"}{" "}
              {effectiveCurrency}
            </b>{" "}
            • Source: <b>{amountSource}</b> • Status: <b>{payment?.status || "awaiting payment"}</b>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
      </div>
    </div>
  );
}
