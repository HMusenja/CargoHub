import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QuoteForm from "@/components/quotes/QuoteForm.jsx";
import QuoteResult from "@/components/quotes/QuoteResult.jsx";
import { getQuote } from "@/api/ratesApi.js";

export default function QuotePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quoteInput, setQuoteInput] = useState(null);
  const [quote, setQuote] = useState(null); // backend response

  async function handleSubmit(values) {
    setError("");
    setBusy(true);
    setQuoteInput(values);
    setQuote(null);

    try {
      const data = await getQuote(values);
      setQuote(data);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to get quote";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Get an Instant Quote
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Calculate shipping costs in seconds
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
            <CardDescription>Fill in the information below to get your quote</CardDescription>
          </CardHeader>

          <CardContent>
            <QuoteForm onSubmit={handleSubmit} busy={busy} />

            {error && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {quote && (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                <QuoteResult input={quoteInput} quote={quote} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
