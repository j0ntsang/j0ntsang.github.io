export type SectionId =
  | "today"
  | "getting-around"
  | "home"
  | "health-safety"
  | "things-to-do"
  | "city-watch"
  | "news"
  | "contacts";

export type Section = { id: SectionId; href: string; title: string; summary: string };

export const sections: Section[] = [
  { id: "today", href: "/", title: "Today", summary: "Conditions, anything unusual, and your saved details." },
  { id: "getting-around", href: "/getting-around", title: "Transportation", summary: "Transit, roads and closures, flights at YFC." },
  { id: "home", href: "/home", title: "City Pulse", summary: "Garbage Day, water, power, fuel and home prices." },
  { id: "health-safety", href: "/health-safety", title: "City Alert", summary: "Warnings, air quality, flood watch, ER waits." },
  { id: "things-to-do", href: "/things-to-do", title: "City Life", summary: "Events, skating, swimming." },
  { id: "city-watch", href: "/city-watch", title: "City Watch", summary: "Live cameras downtown and on the river." },
  { id: "news", href: "/news", title: "News", summary: "One stream from local and provincial sources." },
  { id: "contacts", href: "/contacts", title: "Contacts", summary: "Who to call for city services." },
];

export const sectionById = Object.fromEntries(sections.map((s) => [s.id, s])) as Record<SectionId, Section>;

/** Every page the router serves, as paths under the app's base. The build writes an index.html for each. */
export const pagePaths = [...sections.map((s) => s.href), "/sources"];
