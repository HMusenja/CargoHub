import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // adjust import path if different

export default function BookPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, isAuthed } = useAuth();

  // Expecting: { quote, input, contact? } from /quotes page
  const quote = location?.state?.quote || null;
  const input = location?.state?.input || null;
  const priorContact = location?.state?.contact || null;

  // Guard: if user lands directly without quote, redirect
  useEffect(() => {
    if (!quote || !input) navigate("/quotes", { replace: true });
  }, [quote, input, navigate]);

  // Form state
  const [form, setForm] = useState(() => ({
    // Shipper (prefill happens below)
    shipperName: priorContact?.shipperName || "",
    shipperEmail: priorContact?.shipperEmail || "",
    shipperPhone: priorContact?.shipperPhone || "",
    // Consignee
    consigneeName: priorContact?.consigneeName || "",
    consigneeEmail: priorContact?.consigneeEmail || "",
    consigneePhone: priorContact?.consigneePhone || "",
    // Reference
    reference: priorContact?.reference || "",
  }));

  // Only prefill once, and only empty fields
  const didPrefill = useRef(false);
  useEffect(() => {
    if (didPrefill.current) return;
    if (!user) return;
    setForm((prev) => {
      const next = { ...prev };
      if (!next.shipperName && user.fullName) next.shipperName = user.fullName;
      if (!next.shipperEmail && user.email) next.shipperEmail = user.email;
      return next;
    });
    didPrefill.current = true;
  }, [user]);

  function setVal(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function bookShipment(e) {
    e.preventDefault();
    // Placeholder submit — in the real flow you'll POST to backend
    const confirmation = {
      reference: form.reference || `CB-${Date.now()}`,
      createdAtISO: new Date().toISOString(),
    };
    navigate("/booking/confirmed", {
      replace: true,
      state: { confirmation, quote, input, contact: form },
    });
  }

  if (!quote || !input) return null;

  const dimsString = useMemo(() => {
    const { L = 0, W = 0, H = 0 } = input?.dimsCm || {};
    return `${L} × ${W} × ${H} cm`;
  }, [input]);

  const currency = quote.currency || "EUR";
  const fmt = (n) => (typeof n === "number" ? n.toFixed(2) : "—");
  const eta = quote.etaISO ? new Date(quote.etaISO).toLocaleDateString() : "—";

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-5">
        {/* Left: Booking form */}
        <Card className="md:col-span-3 shadow-lg">
          <CardHeader>
            <CardTitle>Book Shipment</CardTitle>
            <CardDescription>Confirm contact details and place your booking</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={bookShipment}>
              {/* Shipper */}
              <section className="space-y-3">
                <h3 className="font-semibold text-foreground">Shipper</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="shipperName">Full Name</Label>
                    <Input
                      id="shipperName"
                      value={form.shipperName}
                      onChange={(e) => setVal("shipperName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shipperEmail">Email</Label>
                    <Input
                      id="shipperEmail"
                      type="email"
                      value={form.shipperEmail}
                      onChange={(e) => setVal("shipperEmail", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shipperPhone">Phone</Label>
                  <Input
                    id="shipperPhone"
                    value={form.shipperPhone}
                    onChange={(e) => setVal("shipperPhone", e.target.value)}
                    placeholder="+49 123 4567890"
                  />
                </div>
                {!isLoading && !isAuthed && (
                  <p className="text-xs text-muted-foreground">
                    Tip: <span className="underline cursor-pointer" onClick={() => navigate("/login")}>log in</span> to auto-fill your details next time.
                  </p>
                )}
              </section>

              {/* Consignee */}
              <section className="space-y-3">
                <h3 className="font-semibold text-foreground">Consignee</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="consigneeName">Full Name</Label>
                    <Input
                      id="consigneeName"
                      value={form.consigneeName}
                      onChange={(e) => setVal("consigneeName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="consigneeEmail">Email</Label>
                    <Input
                      id="consigneeEmail"
                      type="email"
                      value={form.consigneeEmail}
                      onChange={(e) => setVal("consigneeEmail", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="consigneePhone">Phone</Label>
                  <Input
                    id="consigneePhone"
                    value={form.consigneePhone}
                    onChange={(e) => setVal("consigneePhone", e.target.value)}
                    placeholder="+234 801 234 5678"
                  />
                </div>
              </section>

              {/* Reference */}
              <section className="space-y-3">
                <h3 className="font-semibold text-foreground">Reference</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="reference">Order / Reference (optional)</Label>
                  <Input
                    id="reference"
                    value={form.reference}
                    onChange={(e) => setVal("reference", e.target.value)}
                    placeholder="e.g., PO-12345"
                  />
                </div>
              </section>

              <Button type="submit" size="lg" className="w-full">Confirm Booking</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Quote summary */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Quote Summary</CardTitle>
            <CardDescription>Auto-filled from your quote</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-semibold">{quote.originZone} → {quote.destinationZone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="font-semibold">{quote.serviceLevel?.toUpperCase?.() || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Weights</span>
              <span className="font-semibold">
                Actual {quote.actualWeightKg?.toFixed?.(2)} kg • Billable {quote.billableWeightKg?.toFixed?.(2)} kg
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dimensions</span>
              <span className="font-semibold">{dimsString}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-semibold">{input.quantity}</span>
            </div>

            <div className="border-t border-border my-2" />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base</span>
              <span className="font-semibold">{currency} {quote.priceBreakdown?.base?.toFixed?.(2) ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span className="font-semibold">{currency} {quote.priceBreakdown?.weight?.toFixed?.(2) ?? "—"}</span>
            </div>
            {quote.priceBreakdown?.fuel > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fuel</span>
                <span className="font-semibold">{currency} {quote.priceBreakdown.fuel.toFixed(2)}</span>
              </div>
            )}
            {quote.priceBreakdown?.remote > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remote</span>
                <span className="font-semibold">{currency} {quote.priceBreakdown.remote.toFixed(2)}</span>
              </div>
            )}
            {quote.priceBreakdown?.vat > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-semibold">{currency} {quote.priceBreakdown.vat.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-border my-2" />

            <div className="flex items-center justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary">{currency} {fmt(quote.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ETA</span>
              <span className="font-semibold">
                {eta} ({quote.transitDays} business day{quote.transitDays === 1 ? "" : "s"})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
