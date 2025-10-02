import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuoteResult({ input, quote }) {
  const navigate = useNavigate();
  if (!quote) return null;

  const breakdown = quote.priceBreakdown || {};
  const currency = quote.currency || "EUR";
  const fmt = (n) => typeof n === "number" ? n.toFixed(2) : "—";
  const eta = quote.etaISO ? new Date(quote.etaISO).toLocaleDateString() : "—";

  function bookNow() {
    // carry the important data into booking flow
    navigate("/book", {
      state: {
        quote,
        input,
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-border pt-6">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Your Quote</h3>

        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base</span>
              <span className="text-foreground font-semibold">
                {currency} {fmt(breakdown.base)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span className="text-foreground font-semibold">
                {currency} {fmt(breakdown.weight)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fuel</span>
              <span className="text-foreground font-semibold">
                {currency} {fmt(breakdown.fuel)}
              </span>
            </div>
            {breakdown.remote > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remote Area</span>
                <span className="text-foreground font-semibold">
                  {currency} {fmt(breakdown.remote)}
                </span>
              </div>
            )}
            {typeof breakdown.vat === "number" && breakdown.vat > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span className="text-foreground font-semibold">
                  {currency} {fmt(breakdown.vat)}
                </span>
              </div>
            )}

            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">
                {currency} {fmt(quote.total)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Estimated Delivery</span>
              </div>
              <p className="text-muted-foreground ml-8">
                {quote.transitDays} business day(s) • ETA {eta}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Details</span>
              </div>
              <p className="text-muted-foreground ml-8">
                {quote.serviceLevel?.toUpperCase()} • {quote.originZone} → {quote.destinationZone} • Billable {quote.billableWeightKg?.toFixed?.(2)} kg
              </p>
            </CardContent>
          </Card>
        </div>

        <Button size="lg" className="w-full mt-4" onClick={bookNow}>
          Book This Shipment
        </Button>
      </div>
    </div>
  );
}
