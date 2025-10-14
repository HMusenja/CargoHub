import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postScan } from "@/api/trackingApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { SHIPMENT_STATUS, STATUS_LABEL } from "@/constants/shipmentStatus";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MapPin, Send, Loader2 } from "lucide-react";

const LS_KEY = "manage:scan:last";

export default function ScanEntry() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useLocalStorage(LS_KEY, {
    ref: "",
    status: "PICKED_UP",
    location: { city: "", country: "", lat: "", lng: "" },
    note: "",
    photoUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return form.ref.trim().length > 0 && form.status;
  }, [form.ref, form.status]);

  const handleChange = useCallback((path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const segs = path.split(".");
      let cur = next;
      for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i]];
      cur[segs.at(-1)] = value;
      return next;
    });
  }, [setForm]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        ref: form.ref.toUpperCase().trim(),
        status: form.status,
        location: {
          city: form.location.city || undefined,
          country: form.location.country || undefined,
          lat: form.location.lat === "" ? undefined : Number(form.location.lat),
          lng: form.location.lng === "" ? undefined : Number(form.location.lng),
        },
        note: form.note?.trim() || undefined,
        photoUrl: form.photoUrl?.trim() || undefined,
      };

      const updated = await postScan(payload);
      toast({
        title: "Scan saved",
        description: (
          <span>
            Status <b>{STATUS_LABEL[updated.status] || updated.status}</b> recorded for{" "}
            <b>{updated.ref}</b>.{" "}
            <Link className="underline underline-offset-4" to={`/track/${updated.ref}`}>
              View tracking
            </Link>
          </span>
        ),
      });

      // Optionally navigate to detail
      // navigate(`/track/${updated.ref}`);

    } catch (e) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: e?.userMessage || "Could not save scan. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Record a Scan</CardTitle>
          <CardDescription>Agents/Drivers can update shipment status here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Ref */}
            <div className="grid gap-2">
              <Label htmlFor="ref">Reference *</Label>
              <Input
                id="ref"
                value={form.ref}
                onChange={(e) => handleChange("ref", e.target.value.toUpperCase())}
                placeholder="CH-2025-000123"
                className="uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                Tip: paste or scan from label; it will be uppercased automatically.
              </p>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pick a status" />
                </SelectTrigger>
                <SelectContent>
                  {SHIPMENT_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Location */}
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Location (optional)</Label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.location.city}
                    onChange={(e) => handleChange("location.city", e.target.value)}
                    placeholder="Hamburg"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.location.country}
                    onChange={(e) => handleChange("location.country", e.target.value.toUpperCase())}
                    placeholder="DE"
                    className="uppercase"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    value={form.location.lat}
                    onChange={(e) => handleChange("location.lat", e.target.value)}
                    inputMode="decimal"
                    placeholder="53.55"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    value={form.location.lng}
                    onChange={(e) => handleChange("location.lng", e.target.value)}
                    inputMode="decimal"
                    placeholder="10.00"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Short description (max 500 chars)"
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value.slice(0, 500))}
                rows={3}
              />
              <div className="text-xs text-muted-foreground text-right">
                {form.note.length}/500
              </div>
            </div>

            {/* Photo URL */}
            <div className="grid gap-2">
              <Label htmlFor="photo">Photo URL</Label>
              <Input
                id="photo"
                placeholder="https://…"
                value={form.photoUrl}
                onChange={(e) => handleChange("photoUrl", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Save scan
                  </>
                )}
              </Button>

              {form.ref?.trim() && (
                <Button type="button" variant="outline" onClick={() => navigate(`/track/${form.ref.trim().toUpperCase()}`)}>
                  View tracking
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
