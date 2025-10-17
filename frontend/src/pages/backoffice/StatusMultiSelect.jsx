import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

export default function StatusMultiSelect({ all, value, onChange }) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => {
    if (!value?.length) return "All statuses";
    if (value.length === all.length) return "All statuses";
    if (value.length === 1) return value[0];
    return `${value.length} selected`;
  }, [value, all.length]);

  function toggle(s) {
    const set = new Set(value);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    const next = Array.from(set);
    onChange(next.length ? next : all); // never empty: default to all
  }

  function selectAll() {
    onChange(all);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          {label} <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Statuses</div>
        <div className="grid gap-2">
          {all.map((s) => {
            const checked = value.includes(s);
            return (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox checked={checked} onCheckedChange={() => toggle(s)} />
                <span>{s}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="secondary" onClick={selectAll}>Select all</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
