import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTracking } from "@/context/TrackingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, ClipboardCheck } from "lucide-react";
import { STATUS_ICON, STATUS_LABEL } from "@/constants/statusIcons";

function formatAbs(dt) {
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function formatRel(dt) {
  const now = Date.now();
  const t = new Date(dt).getTime();
  const diff = Math.floor((now - t) / 1000); // seconds
  if (Number.isNaN(diff)) return "";
  if (diff < 60) return "just now";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const HeaderSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader>
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid sm:grid-cols-3 gap-4 animate-pulse">
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
      </div>
    </CardContent>
  </Card>
);

const TimelineSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader>
      <div className="animate-pulse h-6 w-40 bg-muted rounded" />
      <div className="mt-2 animate-pulse h-4 w-64 bg-muted rounded" />
    </CardHeader>
    <CardContent>
      <div className="space-y-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="flex gap-4" key={i}>
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-64 bg-muted rounded" />
              <div className="h-3 w-40 bg-muted rounded" />
              <div className="h-3 w-56 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function Track() {
  const { ref: refParam } = useParams();
  const navigate = useNavigate();
  const { data, status, error, searchByRef } = useTracking();

  const [trackingNumber, setTrackingNumber] = useState(
    refParam ? String(refParam).toUpperCase() : ""
  );

  // Auto-fetch on deep link mount/change
  useEffect(() => {
    if (refParam) {
      searchByRef(refParam).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam]);

  const onSubmit = (e) => {
    e.preventDefault();
    const ref = String(trackingNumber || "")
      .trim()
      .toUpperCase();
    if (!ref) return;
    navigate(`/track/${ref}`);
  };

  const progress = data?.progress || { currentIndex: 0, milestones: [] };

  const milestoneUi = useMemo(() => {
    const list = progress.milestones || [];
    return list.map((key, idx) => {
      const Icon = STATUS_ICON[key] ?? ClipboardCheck;
      const active = idx <= progress.currentIndex;
      return (
        <div key={key} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span
            className={`text-sm ${
              active ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            {STATUS_LABEL[key] || key}
          </span>
          {idx < list.length - 1 && (
            <div
              className={`flex-1 h-px ${active ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
      );
    });
  }, [progress]);

  const header = data && (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-mono">{data.ref}</CardTitle>
            <CardDescription className="mt-1">
              {data.estimatedDelivery
                ? `Estimated delivery: ${formatAbs(data.estimatedDelivery)}`
                : data.deliveredAt
                ? `Delivered: ${formatAbs(data.deliveredAt)}`
                : "Tracking details"}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {STATUS_LABEL[data.status] || data.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="font-medium text-foreground">
                {data.origin?.city}
                {data.origin?.country ? `, ${data.origin.country}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">To</p>
              <p className="font-medium text-foreground">
                {data.destination?.city}
                {data.destination?.country
                  ? `, ${data.destination.country}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium text-foreground">
                {String(data.serviceLevel || "").toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        {progress.milestones?.length > 0 && (
          <div className="mt-6 grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {milestoneUi}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const timeline = data?.timeline || [];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Track Your Shipment
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Enter your tracking number to see real-time updates
            </p>
          </div>

          {/* Ref input */}
          <Card className="shadow-lg mb-8">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="tracking-number">
                    Tracking Reference Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tracking-number"
                      placeholder="e.g., CH-2025-789456"
                      value={trackingNumber}
                      onChange={(e) =>
                        setTrackingNumber(e.target.value.toUpperCase())
                      }
                      className="flex-1 uppercase"
                      inputMode="text"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <Button type="submit" size="lg" className="px-8">
                      <Search className="h-4 w-4 mr-2" />
                      Track
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can find your tracking number in the confirmation email or
                  on your shipping label.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* States */}
          {status === "idle" && !refParam && (
            <p className="text-center text-muted-foreground">
              Enter your reference to track.
            </p>
          )}

          {status === "loading" && (
            <div className="space-y-6">
              <HeaderSkeleton />
              <TimelineSkeleton />
            </div>
          )}

          {status === "error" && (
            <Card className="shadow-lg border-destructive/40">
              <CardHeader>
                <CardTitle>Tracking unavailable</CardTitle>
                <CardDescription>
                  {error?.userMessage ||
                    (error?.status === 404
                      ? "We couldn’t find a shipment with that reference."
                      : "Something went wrong—try again.")}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {status === "success" && data && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {header}

              {/* Timeline */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Tracking Timeline</CardTitle>
                  <CardDescription>
                    Real-time updates on your shipment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No scans yet.
                    </p>
                  ) : (
                    <div className="space-y-8">
                      {timeline.map((ev, idx) => {
                        const Icon = STATUS_ICON[ev.status] ?? ClipboardCheck;
                        const isLast = idx === timeline.length - 1;
                        return (
                          <div
                            className="flex gap-4"
                            key={`${ev.status}-${idx}-${ev.createdAt}`}
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isLast
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                <Icon className="h-6 w-6" />
                              </div>
                              {!isLast && (
                                <div className="w-0.5 h-full bg-border mt-2" />
                              )}
                            </div>
                            <div className={`flex-1 ${!isLast ? "pb-8" : ""}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">
                                  {STATUS_LABEL[ev.status] || ev.status}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {formatRel(ev.createdAt)} •{" "}
                                  {formatAbs(ev.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {ev?.location?.city || "—"}
                                  {ev?.location?.country
                                    ? `, ${ev.location.country}`
                                    : ""}
                                </span>
                              </div>
                              {ev.note && (
                                <p className="text-sm text-foreground mt-2">
                                  {ev.note}
                                </p>
                              )}
                              {ev.actor?.role && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Actor:{" "}
                                  {String(ev.actor.role)
                                    .charAt(0)
                                    .toUpperCase() +
                                    String(ev.actor.role).slice(1)}
                                </p>
                              )}
                              {ev.photoUrl && (
                                <div className="mt-3">
                                  <img
                                    src={ev.photoUrl}
                                    alt={`${ev.status} evidence`}
                                    className="rounded-md border max-h-48"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    Need Help?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you have any questions about your shipment, our support
                    team is here to help.
                  </p>
                  <Button variant="outline">Contact Support</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
