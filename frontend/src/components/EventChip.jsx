import clsx from "clsx";

/** Reuse the exact palette from StatusBadge */
const COLOR_MAP = {
  BOOKED: "slate",
  PICKED_UP: "blue",
  INTAKE: "blue",
  BAGGED: "indigo",
  LOADED: "violet",
  IN_TRANSIT: "amber",
  ARRIVED_HUB: "cyan",
  AT_HUB: "cyan",
  OUT_FOR_DELIVERY: "teal",
  DELIVERED: "green",
  RETURNED: "orange",
  EXCEPTION: "rose",
  DAMAGED: "red",
  LOST: "red",
  HOLD: "yellow",
  CANCELED: "zinc",
};

const TONES_SOFT = {
  slate:  "bg-slate-100 text-slate-700",
  zinc:   "bg-zinc-100 text-zinc-700",
  blue:   "bg-blue-100 text-blue-800",
  indigo: "bg-indigo-100 text-indigo-800",
  violet: "bg-violet-100 text-violet-800",
  amber:  "bg-amber-100 text-amber-900",
  cyan:   "bg-cyan-100 text-cyan-800",
  teal:   "bg-teal-100 text-teal-800",
  green:  "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  yellow: "bg-yellow-100 text-yellow-900",
  red:    "bg-red-100 text-red-800",
  rose:   "bg-rose-100 text-rose-800",
};

export default function EventChip({ type, className }) {
  const key = String(type || "").toUpperCase();
  const tone = TONES_SOFT[COLOR_MAP[key]] || TONES_SOFT.slate;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        tone,
        className
      )}
      title={key}
    >
      {key || "—"}
    </span>
  );
}
