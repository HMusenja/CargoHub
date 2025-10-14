import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { trackShipment } from "@/api/trackingApi";

const TrackingContext = createContext(null);

export function TrackingProvider({ children }) {
  const [data, setData] = useState(null);     // last tracking payload
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);   // ApiError or null
  const [ref, setRef] = useState("");         // normalized ref for current view

  const searchByRef = useCallback(async (inputRef) => {
    const normalized = String(inputRef || "").trim().toUpperCase();
    if (!normalized) return;
    setStatus("loading");
    setError(null);
    setRef(normalized);
    try {
      const result = await trackShipment(normalized);
      setData(result);
      setStatus("success");
      return result;
    } catch (e) {
      setData(null);
      setStatus("error");
      setError(e);
      throw e;
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setStatus("idle");
    setError(null);
    setRef("");
  }, []);

  const value = useMemo(
    () => ({ data, status, error, ref, searchByRef, reset }),
    [data, status, error, ref, searchByRef, reset]
  );

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTracking() {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error("useTracking must be used within <TrackingProvider>");
  return ctx;
}
