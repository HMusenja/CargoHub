import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PaymentStep({
  created, payment, payLoading, payError, onPayNow, onDownload, onPrev, onContinue,amountCents, currency = "EUR",
}) {
  return (
    <div className="space-y-6 text-center py-4">
      <h2 className="text-2xl font-semibold text-foreground">Payment</h2>
      <p className="text-muted-foreground">
        Pay for shipment <span className="font-mono font-semibold">{created?.ref || "—"}</span>.
        After success you can download your label.
      </p>

      <Card className="max-w-md mx-auto text-left">
        <CardContent className="pt-6 space-y-4">
          {payError && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {payError}
            </div>
          )}

          {!payment?.status || payment?.status !== "succeeded" ? (
            <Button disabled={payLoading || !created?.ref} onClick={onPayNow} className="w-full">
              {payLoading ? "Processing…" : "Pay now (dummy)"}
            </Button>
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

          <div className="text-xs text-muted-foreground">
            Amount: <b>{((amountCents ?? payment?.amountCents ?? 0) / 100).toFixed(2)} {currency}</b> •
            Status: <b>{payment?.status || "awaiting payment"}</b>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onPrev}>Back</Button>
      </div>
    </div>
  );
}
