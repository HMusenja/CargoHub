import { SectionTitle, TextField, TextareaField, SelectField, FormNavPrevNext } from "../SharedInputs";
import { Button } from "@/components/ui/button";
import { canProceed } from "../../utils";
import { STEPS } from "../../constants";

export default function ReceiverStep({ formData, u, onCopySender, onPrev, onNext }) {
  return (
    <form onSubmit={onNext} className="space-y-6">
      <SectionTitle>Receiver Details</SectionTitle>

      <div className="flex justify-end mb-2">
        <Button type="button" variant="outline" size="sm" onClick={onCopySender}>
          Copy from sender
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Full Name *" value={formData.receiver.name} onChange={u(["receiver", "name"])} />
        <TextField label="Email *" type="email" value={formData.receiver.email} onChange={u(["receiver", "email"])} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Phone *" type="tel" value={formData.receiver.phone} onChange={u(["receiver", "phone"])} />
        <SelectField
          label="Country (ISO-2) *"
          value={formData.receiver.address.country}
          onChange={u(["receiver", "address", "country"])}
          options={[
            { value: "", label: "Select" },
            { value: "NG", label: "Nigeria" },
            { value: "KE", label: "Kenya" },
            { value: "GH", label: "Ghana" },
          ]}
        />
      </div>

      <TextareaField label="Address *" value={formData.receiver.address.line1} onChange={u(["receiver", "address", "line1"])} rows={3} />

      <div className="grid sm:grid-cols-3 gap-4">
        <TextField label="City *" value={formData.receiver.address.city} onChange={u(["receiver", "address", "city"])} />
        <TextField label="State/Region" value={formData.receiver.address.state} onChange={u(["receiver", "address", "state"])} />
        <TextField label="Postal Code *" value={formData.receiver.address.postalCode} onChange={u(["receiver", "address", "postalCode"])} />
      </div>

      <FormNavPrevNext prev={onPrev} disabledNext={!canProceed(STEPS.RECEIVER, formData)} nextLabel="Continue to Item Details" />
    </form>
  );
}
