import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download } from "lucide-react";
import { LabelPreview } from "../SummaryBlocks";

export default function ConfirmStep({ created, formData, onViewShipments, onCreateAnother }) {

   const sender   = formData?.sender ?? null;
  const receiver = formData?.receiver ?? null;
  const items    = Array.isArray(formData?.contents) ? formData.contents : [];

  const hasParties =
    sender?.address?.line1 &&
    receiver?.address?.line1 &&
    sender?.address?.city &&
    receiver?.address?.city;

  return (
    <div className="space-y-6 text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground">Shipment booked</h2>
      <p className="text-muted-foreground">
        Reference:&nbsp;
        <span className="font-mono font-bold text-foreground">{created?.ref || "—"}</span>
        {"  "}• Status: <span className="font-semibold">{created?.status || "BOOKED"}</span>
      </p>

      <Card className="text-left">
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            You can generate a placeholder label now and print it. A full label flow will come later.
          </p>
          <LabelPreview refCode={created?.ref} sender={formData.sender} receiver={formData.receiver} items={formData.contents} />
          <Button className="w-full" variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Create placeholder label (PDF)
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button variant="outline" size="lg" className="flex-1" onClick={onViewShipments}>
          View all shipments
        </Button>
        <Button size="lg" className="flex-1" onClick={onCreateAnother}>
          Create another
        </Button>
      </div>
    </div>
  );
}
