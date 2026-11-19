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

const hourMinute = new Intl.DateTimeFormat("en-CA", { timeZone: city.timeZone, hour: "numeric", minute: "numeric", hourCycle: "h23" });

/** Minutes past midnight right now in the city. */
export function minuteInCity(now = new Date()): number {
  const parts = Object.fromEntries(hourMinute.formatToParts(now).map((p) => [p.type, p.value]));
  return Number(parts.hour) * 60 + Number(parts.minute);
}

const clock = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });

/** A time of day given as minutes past midnight (any day: 1500 is 1:00 a.m.). */
export const formatMinute = (minute: number) => clock.format(new Date(Date.UTC(2000, 0, 1, 0, minute % 1440)));

/** A calendar date (YYYY-MM-DD or ISO) as "Fri, Dec 19", in the city. */
export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: iso.length === 10 ? "UTC" : city.timeZone, weekday: "short", month: "short", day: "numeric" }).format(
    new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso),
  );

const dateThisYear = new Intl.DateTimeFormat("en-CA", { timeZone: city.timeZone, month: "short", day: "numeric" });
const dateOtherYear = new Intl.DateTimeFormat("en-CA", { timeZone: city.timeZone, month: "short", day: "numeric", year: "numeric" });

/** "Nov 3", or "Mar 26, 2025" when it isn't this year: an old date shouldn't read as recent. */
export function formatDate(iso: string, now = new Date()): string {
  const d = new Date(iso);
  return (d.getFullYear() === now.getFullYear() ? dateThisYear : dateOtherYear).format(d);
}
