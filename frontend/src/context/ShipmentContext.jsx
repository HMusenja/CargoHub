// src/context/ShipmentContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ShipmentContext = createContext(null);
const DRAFT_KEY = "shipment:new:draft:v1";

export function ShipmentProvider({ children }) {
  const [lastCreatedShipment, setLastCreatedShipment] = useState(null);
  const [draft, setDraft] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : getEmptyDraft();
    } catch {
      return getEmptyDraft();
    }
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const clearDraft = useCallback(() => {
    setDraft(getEmptyDraft());
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const value = useMemo(
    () => ({
      lastCreatedShipment,
      setLastCreatedShipment,
      draft,
      setDraft,
      clearDraft,
    }),
    [lastCreatedShipment, draft, clearDraft]
  );

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}

export function useShipment() {
  const ctx = useContext(ShipmentContext);
  if (!ctx) throw new Error("useShipment must be used within ShipmentProvider");
  return ctx;
}

function getEmptyDraft() {
  return {
    sender: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "DE" },
    },
    receiver: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "DE" },
    },
    contents: [
      { description: "", quantity: 1, weightKg: "", lengthCm: "", widthCm: "", heightCm: "", valueCurrency: "EUR", valueAmount: "" },
    ],
    pickup: { date: "", notes: "" },
    dropoff: { date: "", notes: "" },
    serviceLevel: "standard",
    price: null, // or { currency:"EUR", amount: 0 }
  };
}
