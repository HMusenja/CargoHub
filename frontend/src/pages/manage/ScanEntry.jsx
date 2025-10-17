import { useEffect, useMemo, useRef, useState } from "react";
import { useBackoffice } from "@/context/BackofficeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const SCAN_TYPES = [
  "INTAKE",
  "BAGGED",
  "LOADED",
  "IN_TRANSIT",
  "ARRIVED_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURNED",
  "DAMAGED",
  "LOST",
  "HOLD",
];

const LS_LAST_LOCATION = "lastLocation";

const BEEP_OK =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYBZWZmZmZmZmYA";
const BEEP_ERR =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABaAgICAgICAgICA";

export default function ScanEntry() {
  const { scan } = useBackoffice();
  const { toast } = useToast();

  const [refCode, setRefCode] = useState("");
  const [type, setType] = useState("INTAKE");
  const [location, setLocation] = useState(() => localStorage.getItem(LS_LAST_LOCATION) || "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refInput = useRef(null);
  const okAudio = useMemo(() => new Audio(BEEP_OK), []);
  const errAudio = useMemo(() => new Audio(BEEP_ERR), []);

  // Autofocus and keyboard shortcuts
  useEffect(() => {
    refInput.current?.focus();
    const handleKey = (e) => {
      if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        refInput.current?.focus();
        refInput.current?.select?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Persist last location
  useEffect(() => {
    if (location) localStorage.setItem(LS_LAST_LOCATION, location);
  }, [location]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!refCode.trim()) {
      setErrorMsg("Reference is required");
      errAudio?.play?.();
      refInput.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await scan({
        ref: refCode.trim(),
        type,
        location: location ? { city: location } : undefined,
        note: note || undefined,
      });

      okAudio?.play?.();
      toast({
        title: `Scanned: ${type}`,
        description: `Ref ${refCode.trim()}`,
      });

      // Reset only the ref
      setRefCode("");
      setNote("");
      refInput.current?.focus?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Scan failed";
      setErrorMsg(msg);
      errAudio?.play?.();
      requestAnimationFrame(() => {
        refInput.current?.focus?.();
        refInput.current?.select?.();
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:max-w-xl">
      <div className="grid gap-1">
        <Label htmlFor="ref">Reference</Label>
        <Input
          id="ref"
          ref={refInput}
          value={refCode}
          onChange={(e) => setRefCode(e.target.value)}
          placeholder="SHP-2025XXXX-XXXX"
          autoFocus
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Barcode scanners usually press Enter automatically (Ctrl + L focuses here)
        </p>
      </div>

      <div className="grid gap-1">
        <Label>Status</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SCAN_TYPES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1">
        <Label htmlFor="location">Location (free text)</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder='HH-DE / Hub A'
        />
        <p className="text-xs text-muted-foreground">
          Prefilled from your last scan (stored locally)
        </p>
      </div>

      <div className="grid gap-1">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Short note…"
          maxLength={500}
        />
      </div>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Scanning…" : "Scan"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setRefCode("");
            refInput.current?.focus?.();
          }}
          disabled={submitting}
        >
          Clear Ref
        </Button>
      </div>
    </form>
  );
}
