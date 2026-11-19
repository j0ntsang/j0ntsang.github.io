import { city } from "@/city/fredericton";

const time = new Intl.DateTimeFormat("en-CA", { timeZone: city.timeZone, hour: "numeric", minute: "2-digit" });
const dayTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: city.timeZone,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const longDate = new Intl.DateTimeFormat("en-CA", { timeZone: city.timeZone, weekday: "long", month: "long", day: "numeric" });
const localDay = new Intl.DateTimeFormat("en-CA", { timeZone: city.timeZone, year: "numeric", month: "2-digit", day: "2-digit" });

/** Today's date in the city as YYYY-MM-DD. */
export const todayInCity = (now = new Date()) => localDay.format(now);

export const formatTime =(iso: string) => time.format(new Date(iso));
export const formatLongDate = (d: Date) => longDate.format(d);

/** Time only when it's today in Fredericton, otherwise day and time. */
export function formatWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  return localDay.format(d) === localDay.format(now) ? time.format(d) : dayTime.format(d);
}

export function formatAge(iso: string, now = Date.now()): string {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export const signed = (n: number, digits = 2) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toFixed(digits)}`;
