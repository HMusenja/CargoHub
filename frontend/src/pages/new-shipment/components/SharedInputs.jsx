import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function TextField({ label, value, onChange, type = "text", placeholder = "", ...rest }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} {...rest} />
    </div>
  );
}

export function NumberField({ label, value, onChange, min, step, placeholder = "" }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </div>
  );
}

export function TextareaField({ label, value, onChange, rows = 3, placeholder = "" }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} />
    </div>
  );
}

export function SelectField({ label, value, onChange, options = [] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value + o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormNavNext({ disabled, label = "Continue" }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled}>
      {label}
    </Button>
  );
}

export function FormNavPrevNext({ prev, disabledNext, nextLabel = "Continue" }) {
  return (
    <div className="flex gap-4 mt-6">
      <Button type="button" variant="outline" size="lg" onClick={prev} className="flex-1">
        Back
      </Button>
      <Button type="submit" size="lg" className="flex-1" disabled={disabledNext}>
        {nextLabel}
      </Button>
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h2 className="text-2xl font-semibold mb-4 text-foreground">{children}</h2>;
}
