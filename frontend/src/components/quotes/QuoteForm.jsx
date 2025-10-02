import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROUND_STEP_KG = 0.5;
const VOL_DIVISOR = 5000;

function roundUpToStep(n, step) {
  if (!step || step <= 0) return n;
  const f = 1 / step;
  return Math.ceil(n * f) / f;
}

export default function QuoteForm({ onSubmit, busy = false }) {
  const [values, setValues] = useState({
    origin: { country: "", postalCode: "", city: "" },
    destination: { country: "", postalCode: "", city: "" },
    weightKg: "",
    dimsCm: { L: "", W: "", H: "" },
    quantity: 1,
    serviceLevel: "",
  });

  function update(path, v) {
    setValues((prev) => {
      const next = structuredClone(prev);
      const segs = path.split(".");
      let o = next;
      for (let i = 0; i < segs.length - 1; i++) o = o[segs[i]];
      o[segs.at(-1)] = v;
      return next;
    });
  }

  // live preview calculations (client-only)
  const { volKg, billKg, isValid } = useMemo(() => {
    const q = Math.max(1, Number(values.quantity) || 1);
    const actual = Number(values.weightKg || 0) * q;
    const L = Number(values.dimsCm.L || 0);
    const W = Number(values.dimsCm.W || 0);
    const H = Number(values.dimsCm.H || 0);
    const vol = ((L * W * H) * q) / VOL_DIVISOR;
    const bill = roundUpToStep(Math.max(actual, vol), ROUND_STEP_KG);

    const valid =
      values.origin.country &&
      values.destination.country &&
      Number(values.weightKg) > 0 &&
      [L, W, H].every((n) => n >= 0) &&
      Number(q) >= 1;

    return { volKg: vol || 0, billKg: bill || 0, isValid: Boolean(valid) };
  }, [values]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;

    const payload = {
      origin: {
        country: values.origin.country,
        postalCode: values.origin.postalCode || undefined,
        city: values.origin.city || undefined,
      },
      destination: {
        country: values.destination.country,
        postalCode: values.destination.postalCode || undefined,
        city: values.destination.city || undefined,
      },
      weightKg: Number(values.weightKg),
      dimsCm: {
        L: Number(values.dimsCm.L || 0),
        W: Number(values.dimsCm.W || 0),
        H: Number(values.dimsCm.H || 0),
      },
      quantity: Number(values.quantity || 1),
      serviceLevel: values.serviceLevel || undefined,
    };

    onSubmit?.(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Origin / Destination */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="originCountry">Origin Country</Label>
          <select
            id="originCountry"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={values.origin.country}
            onChange={(e) => update("origin.country", e.target.value)}
            required
          >
            <option value="">Select country</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="GB">United Kingdom</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="originPostal">Origin Postal Code (optional)</Label>
          <Input
            id="originPostal"
            placeholder="e.g., 20095"
            value={values.origin.postalCode}
            onChange={(e) => update("origin.postalCode", e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="destCountry">Destination Country</Label>
          <select
            id="destCountry"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={values.destination.country}
            onChange={(e) => update("destination.country", e.target.value)}
            required
          >
            <option value="">Select country</option>
            <option value="CM">Cameroon</option>
            <option value="SN">Senegal</option>
            <option value="NG">Nigeria</option>
            <option value="KE">Kenya</option>
            <option value="US">United States</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destPostal">Destination Postal Code (optional)</Label>
          <Input
            id="destPostal"
            placeholder="e.g., 10001"
            value={values.destination.postalCode}
            onChange={(e) => update("destination.postalCode", e.target.value)}
          />
        </div>
      </div>

      {/* Weight & Dimensions */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input
            id="weightKg"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={values.weightKg}
            onChange={(e) => update("weightKg", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="len">Length (cm)</Label>
          <Input
            id="len"
            type="number"
            min="0"
            step="1"
            value={values.dimsCm.L}
            onChange={(e) => update("dimsCm.L", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wid">Width (cm)</Label>
          <Input
            id="wid"
            type="number"
            min="0"
            step="1"
            value={values.dimsCm.W}
            onChange={(e) => update("dimsCm.W", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hei">Height (cm)</Label>
          <Input
            id="hei"
            type="number"
            min="0"
            step="1"
            value={values.dimsCm.H}
            onChange={(e) => update("dimsCm.H", e.target.value)}
          />
        </div>
      </div>

      {/* Quantity & Service */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="qty">Quantity</Label>
          <Input
            id="qty"
            type="number"
            min="1"
            step="1"
            value={values.quantity}
            onChange={(e) => update("quantity", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="service">Service Level (optional)</Label>
          <select
            id="service"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={values.serviceLevel}
            onChange={(e) => update("serviceLevel", e.target.value)}
          >
            <option value="">Auto (cheapest)</option>
            <option value="economy">Economy</option>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </div>
      </div>

      {/* Live preview strip */}
      <div className="rounded-md border border-border p-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
        <div>Volumetric: <span className="font-semibold">{volKg.toFixed(2)} kg</span></div>
        <div>Billable: <span className="font-semibold">{billKg.toFixed(2)} kg</span></div>
        {!isValid && (
          <div className="text-destructive">Complete required fields to continue</div>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={!isValid || busy}>
        {busy ? "Calculating…" : "Calculate Quote"}
      </Button>
    </form>
  );
}
