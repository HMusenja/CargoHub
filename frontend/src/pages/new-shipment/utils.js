import { DRAFT_KEY, STEPS } from "./constants";

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : getEmptyDraft();
  } catch {
    return getEmptyDraft();
  }
}

export function persistDraft(draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function getEmptyDraft() {
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
      address: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" },
    },
    contents: [emptyItem()],
    pickup: { date: "", notes: "" },
    dropoff: { date: "", notes: "" },
    serviceLevel: "standard",
  };
}

export function emptyItem() {
  return {
    description: "",
    quantity: 1,
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    valueCurrency: "EUR",
    valueAmount: "",
  };
}

export function setAtPath(obj, path, value) {
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

export function canProceed(step, d) {
  if (step === STEPS.SENDER) {
    const s = d.sender;
    const ok = s.name && s.email && s.phone && s.address.line1 && s.address.city && s.address.postalCode && s.address.country;
    return ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s.email || "").replace(/\s+/g, ""));
  }
  if (step === STEPS.RECEIVER) {
    const r = d.receiver;
    const ok = r.name && r.email && r.phone && r.address.line1 && r.address.city && r.address.postalCode && r.address.country;
    return ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r.email || "").replace(/\s+/g, ""));
  }
  if (step === STEPS.ITEMS) {
    const items = d.contents || [];
    if (!items.length) return false;
    if (items.some((it) => !it.description || !it.quantity || it.quantity < 1)) return false;
    if (d.serviceLevel && !["standard", "express"].includes(d.serviceLevel)) return false;
    return true;
  }
  if (step === STEPS.REVIEW) {
    const hasPickup = !!d.pickup?.date;
    const hasDrop = !!d.dropoff?.date;
    return hasPickup || hasDrop;
  }
  return true;
}

export function validateStep(step, d, setError) {
  if (step === STEPS.SENDER) {
    const s = d.sender;
    if (!s.name || !s.email || !s.phone || !s.address.line1 || !s.address.city || !s.address.postalCode || !s.address.country) {
      setError("Please complete all required Sender fields.");
      return false;
    }
  }
  if (step === STEPS.RECEIVER) {
    const r = d.receiver;
    if (!r.name || !r.email || !r.phone || !r.address.line1 || !r.address.city || !r.address.postalCode || !r.address.country) {
      setError("Please complete all required Receiver fields.");
      return false;
    }
  }
  if (step === STEPS.ITEMS) {
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
  if (step === STEPS.REVIEW) {
    const hasPickup = !!d.pickup?.date;
    const hasDrop = !!d.dropoff?.date;
    if (!hasPickup && !hasDrop) {
      setError("Provide a Pickup or Drop-off date.");
      return false;
    }
  }
  return true;
}

export function mapToPayload(d) {
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
    pickup: { date: d.pickup?.date ? new Date(d.pickup.date).toISOString() : undefined, notes: trim(d.pickup?.notes || "") },
    dropoff: { date: d.dropoff?.date ? new Date(d.dropoff.date).toISOString() : undefined, notes: trim(d.dropoff?.notes || "") },
    serviceLevel: d.serviceLevel || "standard",
  };
}
