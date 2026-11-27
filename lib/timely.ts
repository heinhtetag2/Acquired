/* Stories tied to something happening now: a film in cinemas, a game update, a season on air.
   A deck card can carry `out: { date, label, soon? }`. Around that date Discover deals it first and tags it:
   up to 60 days before, "In cinemas Dec 18" (`soon` + the date); up to 45 days after, its `label` ("In cinemas now"). */
export type Out = { date: string; label: string; soon?: string };

const BEFORE = 60, AFTER = 45;
const DAY = 86_400_000;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Days from today to the date: positive = still to come, 0 = today, negative = already out. */
export const daysTo = (date: string, now = new Date()) => Math.round((midnight(new Date(`${date}T00:00:00`)) - midnight(now)) / DAY);

/** The card's tag right now, or null when the date is too far either way. */
export function timelyTag(out: Out | undefined, now = new Date()): string | null {
  if (!out) return null;
  const d = daysTo(out.date, now);
  if (d > BEFORE || d < -AFTER) return null;
  if (d === 0) return "Out today";
  if (d === 1) return `${out.soon ?? "Out"} tomorrow`;
  if (d > 0) return `${out.soon ?? "Out"} ${new Date(`${out.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return out.label;
}
