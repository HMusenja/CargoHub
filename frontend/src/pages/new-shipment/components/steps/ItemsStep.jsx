// src/pages/new-shipment/components/steps/ItemsStep.jsx
import {
  SectionTitle,
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  FormNavPrevNext,
} from "../SharedInputs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { canProceed } from "../../utils";
import { STEPS } from "../../constants";

export default function ItemsStep({
  formData,
  totals,
  updateItem,
  addItem,
  removeItem,
  u,
  onPrev,
  onNext,

  // from parent (pre-fetched / precomputed)
  quote,
  quoteError,
  loadingQuote,
  billableMetrics,
}) {
  return (
    <form onSubmit={onNext} className="space-y-6">
      <SectionTitle>Item Details</SectionTitle>

      <div className="space-y-4">
        {formData.contents.map((it, idx) => (
          <Card key={idx} className="border-dashed">
            <CardContent className="pt-6 space-y-4">
              <TextareaField
                label={`Item ${idx + 1} — Description *`}
                value={it.description}
                onChange={(v) => updateItem(idx, { description: v })}
                rows={3}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <NumberField
                  label="Quantity *"
                  min={1}
                  value={it.quantity}
                  onChange={(v) => updateItem(idx, { quantity: v })}
                />
                <NumberField
                  label="Weight (kg)"
                  step="0.01"
                  value={it.weightKg}
                  onChange={(v) => updateItem(idx, { weightKg: v })}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <NumberField
                  label="Length (cm)"
                  value={it.lengthCm}
                  onChange={(v) => updateItem(idx, { lengthCm: v })}
                />
                <NumberField
                  label="Width (cm)"
                  value={it.widthCm}
                  onChange={(v) => updateItem(idx, { widthCm: v })}
                />
                <NumberField
                  label="Height (cm)"
                  value={it.heightCm}
                  onChange={(v) => updateItem(idx, { heightCm: v })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <TextField
                  label="Declared Currency (3-letter)"
                  value={it.valueCurrency || ""}
                  onChange={(v) =>
                    updateItem(idx, { valueCurrency: (v || "").toUpperCase() })
                  }
                  placeholder="EUR"
                />
                <NumberField
                  label="Declared Value"
                  step="0.01"
                  value={it.valueAmount}
                  onChange={(v) => updateItem(idx, { valueAmount: v })}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeItem(idx)}
                >
                  Remove item
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="mr-4">
              Total qty: <b>{totals.totalQty}</b>
            </span>
            <span>
              Total weight (kg):{" "}
              <b>
                {Number.isFinite(totals.totalWeight) ? totals.totalWeight : 0}
              </b>
            </span>
          </div>
          <Button type="button" variant="outline" onClick={addItem}>
            + Add item
          </Button>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <TextField
          label="Pickup date (ISO) — required if no dropoff date"
          type="datetime-local"
          value={formData.pickup?.date || ""}
          onChange={u(["pickup", "date"])}
        />
        <TextField
          label="Drop-off date (ISO)"
          type="datetime-local"
          value={formData.dropoff?.date || ""}
          onChange={u(["dropoff", "date"])}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <TextField
          label="Pickup notes"
          value={formData.pickup?.notes || ""}
          onChange={u(["pickup", "notes"])}
        />
        <TextField
          label="Drop-off notes"
          value={formData.dropoff?.notes || ""}
          onChange={u(["dropoff", "notes"])}
        />
      </div>

      <div className="mt-4">
        <SelectField
          label="Service Level *"
          value={formData.serviceLevel}
          onChange={u(["serviceLevel"])}
          options={[
            { value: "", label: "Select service" },
            { value: "standard", label: "Standard" },
            { value: "express", label: "Express" },
          ]}
        />
      </div>

      {/* Billable Metrics (computed in parent) */}
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <div className="font-medium mb-2">Weight breakdown</div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded border p-2 bg-white">
            <div className="text-muted-foreground">Actual weight</div>
            <div className="text-base font-semibold">
              {Number.isFinite(billableMetrics?.actualKg)
                ? billableMetrics.actualKg
                : 0}{" "}
              kg
            </div>
          </div>
          <div className="rounded border p-2 bg-white">
            <div className="text-muted-foreground">Volumetric weight</div>
            <div className="text-base font-semibold">
              {Number.isFinite(billableMetrics?.volumetricKg)
                ? billableMetrics.volumetricKg
                : 0}{" "}
              kg
            </div>
          </div>
          <div className="rounded border p-2 bg-white">
            <div className="text-muted-foreground">Billable weight</div>
            <div className="text-base font-semibold">
              {Number.isFinite(billableMetrics?.billableKg)
                ? billableMetrics.billableKg
                : 0}{" "}
              kg
            </div>
          </div>
        </div>
        {billableMetrics?.volumetricFactor && (
          <div className="mt-2 text-xs text-muted-foreground">
            Volumetric factor: {billableMetrics.volumetricFactor}
          </div>
        )}
      </div>

      {/* Instant Quote (provided by parent) */}
      <div className="mt-6 p-4 border rounded bg-gray-50">
        {loadingQuote && <p>💡 Calculating instant quote...</p>}
        {quoteError && <p className="text-red-600">{quoteError}</p>}
        {quote && !quoteError && (
          <div className="space-y-1">
            <p>
              <b>Total:</b> {quote.total} {quote.currency}
            </p>
            <p>
              <b>Billable weight (rated):</b> {quote.billableWeightKg} kg
            </p>
            <p>
              <b>Service Level:</b> {quote.serviceLevel}
            </p>
            {quote.etaISO && (
              <p>
                <b>ETA:</b> {new Date(quote.etaISO).toLocaleString()}
              </p>
            )}
          </div>
        )}
        {!loadingQuote && !quote && !quoteError && (
          <div className="text-sm text-muted-foreground">
            Fill in shipment details to see your instant quote.
          </div>
        )}
      </div>

      <FormNavPrevNext
        prev={onPrev}
        disabledNext={!canProceed(STEPS.ITEMS, formData)}
        nextLabel="Review & Confirm"
        onNext={onNext}
      />
    </form>
  );
}
