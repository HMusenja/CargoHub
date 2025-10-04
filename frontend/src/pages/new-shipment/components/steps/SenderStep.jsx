import { SectionTitle, TextField, TextareaField, SelectField, FormNavNext } from "../SharedInputs";
import { Button } from "@/components/ui/button";
import { canProceed } from "../../utils";
import { STEPS } from "../../constants";

export default function SenderStep({ formData, u, user, onUseProfile, onNext }) {
  return (
    <form onSubmit={onNext} className="space-y-6">
      <SectionTitle>Sender Details</SectionTitle>

      <div className="flex justify-end mb-2">
        <Button type="button" variant="outline" size="sm" onClick={onUseProfile} disabled={!user}>
          Use my profile
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Full Name *" value={formData.sender.name} onChange={u(["sender", "name"])} />
        <TextField label="Email *" type="email" value={formData.sender.email} onChange={u(["sender", "email"])} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Phone *" type="tel" value={formData.sender.phone} onChange={u(["sender", "phone"])} />
        <SelectField
          label="Country (ISO-2) *"
          value={formData.sender.address.country}
          onChange={u(["sender", "address", "country"])}
          options={[
            { value: "", label: "Select" },
            { value: "GB", label: "United Kingdom" },
            { value: "DE", label: "Germany" },
            { value: "FR", label: "France" },
          ]}
        />
      </div>

      <TextareaField label="Address *" value={formData.sender.address.line1} onChange={u(["sender", "address", "line1"])} rows={3} />

      <div className="grid sm:grid-cols-3 gap-4">
        <TextField label="City *" value={formData.sender.address.city} onChange={u(["sender", "address", "city"])} />
        <TextField label="State/Region" value={formData.sender.address.state} onChange={u(["sender", "address", "state"])} />
        <TextField label="Postal Code *" value={formData.sender.address.postalCode} onChange={u(["sender", "address", "postalCode"])} />
      </div>

      <FormNavNext disabled={!canProceed(STEPS.SENDER, formData)} />
    </form>
  );
}
