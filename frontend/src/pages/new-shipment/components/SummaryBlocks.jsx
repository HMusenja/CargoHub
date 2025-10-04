import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReviewCard({ title, onEdit, children }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        {onEdit && (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SummaryAddress({ party }) {
  if (!party) return null;
  const a = party.address || {};
  return (
    <div className="text-sm text-muted-foreground leading-6">
      <div className="text-foreground font-medium">
        {party.name}
        {party.company ? ` — ${party.company}` : ""}
      </div>
      <div>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
      <div>{a.postalCode} {a.city}{a.state ? `, ${a.state}` : ""}</div>
      <div>{a.country}</div>
      <div className="mt-1">Email: <span className="font-mono">{party.email}</span></div>
      <div>Phone: <span className="font-mono">{party.phone}</span></div>
    </div>
  );
}

export function ItemsSummary({ contents }) {
  return (
    <>
      <ul className="text-sm list-disc list-inside">
        {(contents || []).map((it, i) => (
          <li key={i} className="font-mono">
            {it.quantity} × {it.description} {it.weightKg ? `— ${it.weightKg} kg` : ""}{" "}
            {it.lengthCm || it.widthCm || it.heightCm
              ? `(${it.lengthCm || "-"}×${it.widthCm || "-"}×${it.heightCm || "-"} cm)`
              : ""}
            {it.valueAmount ? ` — ${it.valueAmount} ${it.valueCurrency || ""}` : ""}
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted-foreground">
        Totals: qty <b>{(contents || []).reduce((s, it) => s + Number(it.quantity || 0), 0)}</b>{"  "}•{"  "}
        weight <b>{(contents || []).reduce((s, it) => s + Number(it.weightKg || 0), 0)}</b> kg
      </div>
    </>
  );
}

export function LabelPreview({ refCode, sender, receiver, items }) {
  const itemCount = Array.isArray(items) ? items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0;
  const today = new Date().toLocaleDateString();
  const senderCity = sender?.address?.city || "";
  const receiverCity = receiver?.address?.city || "";

  return (
    <>
      <div className="rounded-lg border p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Preview (A6)</div>
        <div className="mt-2 grid gap-1 text-sm">
          <div className="font-bold text-lg">REF: <span className="font-mono">{refCode || "—"}</span></div>
          <div>From: <b>{sender?.name || "—"}</b> — {senderCity}</div>
          <div>To: <b>{receiver?.name || "—"}</b> — {receiverCity}</div>
          <div>Items: <b>{itemCount}</b></div>
          <div>Date: <b>{today}</b></div>
        </div>
      </div>

      <div id="label-printable" className="hidden">
        <div style={{ width: 420, padding: 16, border: "1px solid #000", borderRadius: 8, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "#555" }}>CargoHub</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
            REF: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{refCode || "—"}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <div><b>From:</b> {sender?.name || "—"} — {senderCity}</div>
            <div><b>To:</b> {receiver?.name || "—"} — {receiverCity}</div>
            <div style={{ marginTop: 6 }}><b>Items:</b> {itemCount} &nbsp;&nbsp; <b>Date:</b> {today}</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>* Placeholder label (not a shipping label)</div>
        </div>
      </div>
    </>
  );
}
