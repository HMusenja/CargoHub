import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createIntentByRef as apiCreateIntent, devMarkSucceeded as apiDevMarkSucceeded } from "@/api/paymentApi";


// sessionStorage key so refreshes don't double-create intents
const LAST_ATTEMPT_KEY = "payment:lastAttempt:v1";

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);
  // { paymentId, clientSecret, status, reused? , shipmentRef, amountCents }

  const cancelRef = useRef({ cancelled: false });

  const resetPayment = useCallback(() => {
    setPayment(null);
    setError("");
    setLoading(false);
    sessionStorage.removeItem(LAST_ATTEMPT_KEY);
  }, []);

  const createIntent = useCallback(async ({ shipmentRef, shipmentId, amountCents, currency = "EUR" }) => {
    setError("");
    setLoading(true);
    try {
      // idempotency on our side: avoid duplicate create if we already have a pending one
      const cached = sessionStorage.getItem(LAST_ATTEMPT_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.shipmentRef === shipmentRef || parsed?.shipmentId === shipmentId) {
            setPayment(parsed);
            return parsed;
          }
        } catch {}
      }

      const body = shipmentRef
        ? { shipmentRef, amountCents, currency }
        : { shipmentId, amountCents, currency };

     const data = await apiCreateIntent(body);
      const next = { ...data, shipmentRef, shipmentId, amountCents };
      setPayment(next);
      sessionStorage.setItem(LAST_ATTEMPT_KEY, JSON.stringify(next));
      return next;
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed to create payment intent";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // DEV helper: marks succeeded on the server (dummy flow)
  const markSucceededDev = useCallback(async (paymentId) => {
    setError("");
    setLoading(true);
    try {
    await apiDevMarkSucceeded(paymentId);
      setPayment((p) => (p ? { ...p, status: "succeeded" } : p));
      // persist success state for refresh
      const raw = sessionStorage.getItem(LAST_ATTEMPT_KEY);
      if (raw) {
        try {
          const cached = JSON.parse(raw);
          cached.status = "succeeded";
          sessionStorage.setItem(LAST_ATTEMPT_KEY, JSON.stringify(cached));
        } catch { /* ignore */ }
      }
      return true;
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed to mark payment succeeded";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);


  // One-shot convenience: create → dev mark → return final state
  const payNowDummy = useCallback(async ({ shipmentRef, shipmentId, amountCents, currency = "EUR" }) => {
    const intent = await createIntent({ shipmentRef, shipmentId, amountCents, currency });
    await markSucceededDev(intent.paymentId);
    return { ...intent, status: "succeeded" };
  }, [createIntent, markSucceededDev]);

  // Label download helpers
  const downloadLabelByRef = useCallback((ref) => {
    if (!ref) return;
    const url = `/api/shipments/by-ref/${encodeURIComponent(ref)}/label.pdf`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const downloadLabelById = useCallback((id) => {
    if (!id) return;
    const url = `/api/shipments/${encodeURIComponent(id)}/label.pdf`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const value = useMemo(
    () => ({
      loading,
      error,
      payment,
      setPayment,
      resetPayment,
      createIntent,
      payNowDummy,
      markSucceededDev,
      downloadLabelByRef,
      downloadLabelById,
    }),
    [
      loading,
      error,
      payment,
      resetPayment,
      createIntent,
      payNowDummy,
      markSucceededDev,
      downloadLabelByRef,
      downloadLabelById,
    ]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePayment must be used within PaymentProvider");
  return ctx;
}
