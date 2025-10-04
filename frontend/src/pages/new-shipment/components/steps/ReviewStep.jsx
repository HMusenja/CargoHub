import { SectionTitle, FormNavPrevNext } from "../SharedInputs";
import { ReviewCard, SummaryAddress, ItemsSummary } from "../SummaryBlocks";
import { Label } from "@/components/ui/label";
import { STEPS } from "../../constants";
import { canProceed } from "../../utils";

export default function ReviewStep({
  formData, confirmChecked, setConfirmChecked, errorBlock, onEditSender, onEditReceiver, onEditItems, onPrev, onSubmit,
}) {
  return (
    <div className="space-y-6">
      <SectionTitle>Review & Confirm</SectionTitle>

      <ReviewCard title="From (Sender)" onEdit={onEditSender}>
        <SummaryAddress party={formData.sender} />
      </ReviewCard>

      <ReviewCard title="To (Receiver)" onEdit={onEditReceiver}>
        <SummaryAddress party={formData.receiver} />
      </ReviewCard>

      <ReviewCard title="Items" onEdit={onEditItems}>
        <ItemsSummary contents={formData.contents} />
      </ReviewCard>

      <ReviewCard title="Schedule & Service" onEdit={onEditItems}>
        <div className="text-sm">
          <div>Service: <b>{formData.serviceLevel || "standard"}</b></div>
          <div>Pickup: <b>{formData.pickup?.date || "—"}</b> {formData.pickup?.notes ? `— ${formData.pickup.notes}` : ""}</div>
          <div>Drop-off: <b>{formData.dropoff?.date || "—"}</b> {formData.dropoff?.notes ? `— ${formData.dropoff.notes}` : ""}</div>
        </div>
      </ReviewCard>

      <div className="flex items-center gap-2">
        <input
          id="confirm"
          type="checkbox"
          className="h-4 w-4 border-input rounded"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
        />
        <Label htmlFor="confirm">I confirm the details are correct.</Label>
      </div>

      {errorBlock}

      <div className="flex gap-4">
        <button type="button" className="flex-1 btn btn-outline" onClick={onPrev}>Back</button>
        <button
          className="flex-1 btn btn-primary"
          onClick={onSubmit}
          disabled={!confirmChecked || !canProceed(STEPS.REVIEW, formData)}
        >
          Confirm & Book
        </button>
      </div>
    </div>
  );
}
