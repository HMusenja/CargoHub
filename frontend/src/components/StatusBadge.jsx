import clsx from "clsx";

/** Canonical + legacy → color key */
const COLOR_MAP = {
  // core forward flow
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

  // exceptions
  EXCEPTION: "rose",
  DAMAGED: "red",
  LOST: "red",
  HOLD: "yellow",

  // misc
  CANCELED: "zinc",
};

const BASE =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium";

const TONES = {
  slate:   "border-slate-300 bg-slate-50 text-slate-700",
  zinc:    "border-zinc-300 bg-zinc-50 text-zinc-700",
  blue:    "border-blue-300 bg-blue-50 text-blue-700",
  indigo:  "border-indigo-300 bg-indigo-50 text-indigo-700",
  violet:  "border-violet-300 bg-violet-50 text-violet-700",
  amber:   "border-amber-300 bg-amber-50 text-amber-800",
  cyan:    "border-cyan-300 bg-cyan-50 text-cyan-700",
  teal:    "border-teal-300 bg-teal-50 text-teal-700",
  green:   "border-green-300 bg-green-50 text-green-700",
  orange:  "border-orange-300 bg-orange-50 text-orange-700",
  yellow:  "border-yellow-300 bg-yellow-50 text-yellow-800",
  red:     "border-red-300 bg-red-50 text-red-700",
  rose:    "border-rose-300 bg-rose-50 text-rose-700",
};

export default function StatusBadge({ status, className }) {
  const key = String(status || "").toUpperCase();
  const tone = TONES[COLOR_MAP[key]] || TONES.slate;
  return (
    <span className={clsx(BASE, tone, className)}>
      {key || "—"}
    </span>
  );
}
