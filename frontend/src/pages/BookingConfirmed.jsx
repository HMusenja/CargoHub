import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function BookingConfirmed() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};
  const confirmation = state?.confirmation || null;
  const quote = state?.quote || null;
  const input = state?.input || null;

  useEffect(() => {
    // If someone visits directly without context, send them to /quotes
    if (!confirmation || !quote || !input) {
      navigate("/quotes", { replace: true });
    }
  }, [confirmation, quote, input, navigate]);

  if (!confirmation || !quote || !input) return null;

  const currency = quote.currency || "EUR";
  const fmt = (n) => (typeof n === "number" ? n.toFixed(2) : "—");
  const eta = quote.etaISO ? new Date(quote.etaISO).toLocaleDateString() : "—";

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed</CardTitle>
            <CardDescription>Your shipment has been scheduled successfully.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Confirmation summary */}
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-semibold">{confirmation.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold">
                  {new Date(confirmation.createdAtISO).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">{quote.serviceLevel?.toUpperCase?.() || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Route</span>
                <span className="font-semibold">{quote.originZone} → {quote.destinationZone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ETA</span>
                <span className="font-semibold">{eta} ({quote.transitDays} business day{quote.transitDays === 1 ? "" : "s"})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-primary">{currency} {fmt(quote.total)}</span>
              </div>
            </div>

            {/* Shipper / Consignee quick view */}
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-md border p-3">
                <p className="font-semibold mb-1">Shipper</p>
                <p className="text-muted-foreground">{state.contact?.shipperName || "—"}</p>
                <p className="text-muted-foreground">{state.contact?.shipperEmail || "—"}</p>
                <p className="text-muted-foreground">{state.contact?.shipperPhone || "—"}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="font-semibold mb-1">Consignee</p>
                <p className="text-muted-foreground">{state.contact?.consigneeName || "—"}</p>
                <p className="text-muted-foreground">{state.contact?.consigneeEmail || "—"}</p>
                <p className="text-muted-foreground">{state.contact?.consigneePhone || "—"}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="w-full" onClick={() => navigate("/quotes")}>
                New Quote
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => navigate("/quote", { replace: true })}
              >
                Back to Quotes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
