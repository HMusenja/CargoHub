import { useEffect, useMemo, useState } from "react";
import { useBackoffice } from "@/context/BackofficeContext";
import { BOARD_LANES } from "./boardColumns";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusMultiSelect from "./StatusMultiSelect";

import EventChip from "@/components/EventChip";
import CopyRefButton from "@/components/CopyRefButton";

function relativeTime(iso) {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Board() {
  const {
    lanes,
    fetchLane,
    resetBoard,
    search,
    setSearch,
    statuses,
    setStatuses,
  } = useBackoffice();

  // local input with debounce
  const [searchInput, setSearchInput] = useState(search || "");
  const debouncedSearch = useDebounce(searchInput, 400);

  // visible columns = intersection of BOARD_LANES & chosen statuses
  const columns = useMemo(() => {
    const want = new Set(statuses?.length ? statuses : BOARD_LANES);
    return BOARD_LANES.filter((s) => want.has(s));
  }, [statuses]);

  // Reload lanes when search OR statuses change
  useEffect(() => {
    if (debouncedSearch !== search) setSearch(debouncedSearch);
    resetBoard();
    columns.forEach((s) => fetchLane(s, { page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, columns.join("|")]);

  function refreshAll() {
    resetBoard();
    columns.forEach((s) => fetchLane(s, { page: 1 }));
  }

  return (
    <div className="space-y-3">
      {/* Sticky toolbar */}
      <div className="sticky top-[64px] z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/70 border-b border-border -mx-4 px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by ref / name / phone"
              className="w-[260px]"
            />
            <StatusMultiSelect
              all={BOARD_LANES}
              value={statuses?.length ? statuses : BOARD_LANES}
              onChange={setStatuses}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={refreshAll}>Refresh</Button>
          </div>
        </div>
      </div>

      {/* Lanes */}
      <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {columns.map((laneKey) => {
          const lane = lanes[laneKey] || {
            items: [],
            page: 0,
            totalPages: 0,
            total: 0,
            loading: false,
          };
          return (
            <section key={laneKey} className="rounded-lg border bg-background">
              <header className="flex items-center justify-between border-b p-2">
                <div className="text-sm font-semibold">{laneKey}</div>
                <div className="text-xs text-muted-foreground">{lane.items.length}</div>
              </header>

              <div className="p-2 space-y-2 min-h-[120px]">
                {lane.items.length === 0 && !lane.loading ? (
                  <div className="text-xs text-muted-foreground p-3 border rounded-md">
                    No shipments
                  </div>
                ) : (
                  lane.items.map((ship) => <Card key={ship._id} ship={ship} />)
                )}

                {lane.loading && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Loading…
                  </div>
                )}

                {!lane.loading && lane.page < lane.totalPages && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => fetchLane(laneKey)}
                  >
                    Load more
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Drag & drop to change status is coming in Phase 2. Use the Scan tab to update a shipment.
      </div>
    </div>
  );
}

function Card({ ship }) {
  const city = ship.receiver?.city || ship.receiver?.address?.city || "-";
  const items = ship.itemCount ?? (Array.isArray(ship.contents) ? ship.contents.length : "-");
  const last = ship.lastEvent || null;

 // Prefer the last scan; fall back to current status + updatedAt
 const displayType = (last?.type || ship.status || "").toUpperCase();
 const displayTimeISO = last?.createdAt || ship.updatedAt;


    return (
    <div className="rounded-md border p-2">
      <div className="flex items-start justify-between">
        <div className="font-mono text-sm font-semibold">{ship.ref}</div>
        <CopyRefButton refCode={ship.ref} />
      </div>

      <div className="mt-1 text-xs text-muted-foreground">
        {ship.receiver?.name || "-"}
        {ship.receiver?.city ? ` • ${ship.receiver.city}` : ""}
      </div>

       <div className="mt-2 flex items-center justify-between text-xs">
      <div className="opacity-80">Items: {items}</div>
      <div className="flex items-center gap-2 opacity-80">
        {displayType && <EventChip type={displayType} />}
        {displayTimeISO && <span>{relativeTime(displayTimeISO)}</span>}
      </div>
    </div>
    </div>
  );
}