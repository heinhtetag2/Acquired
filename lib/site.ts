// Client-safe module: site settings + formatters only (no episode data).
import site from "@/content/site.json";
export { site };

export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const formatLongDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
export const formatStamp = (sec: number) => {
  const s = Math.max(0, Math.floor(sec)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};
export const formatTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? h + ":" : ""}${mm}:${String(r).padStart(2, "0")}`;
};


export const seasonLabel = (code?: string) => {
  if (!code) return "";
  const m = /^(F|SP|SU|S)(\d+)$/.exec(code); if (!m) return code;
  if (m[1] === "S") return `Season ${m[2]}`;
  return `${({ F: "Fall", SP: "Spring", SU: "Summer" } as Record<string, string>)[m[1]]} 20${m[2]}`;
};
