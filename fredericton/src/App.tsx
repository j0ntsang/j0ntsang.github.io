import { useEffect, useRef, type ComponentType } from "react";
import { Link } from "react-aria-components";
import { AppNav } from "@/components/AppNav";
import { city } from "@/city/fredericton";
import { sectionById } from "@/ia/sections";
import { CityWatchPage } from "@/pages/CityWatchPage";
import { HealthSafetyPage } from "@/pages/HealthSafetyPage";
import { HomeUtilitiesPage } from "@/pages/HomeUtilitiesPage";
import { NewsPage } from "@/pages/NewsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SectionStub } from "@/components/SectionStub";
import { SourcesPage } from "@/pages/SourcesPage";
import { TodayPage } from "@/pages/TodayPage";
import { Router, usePath } from "./router";

type Route = { title?: string; Page: ComponentType };

const stub = (id: "getting-around" | "things-to-do" | "contacts"): Route => ({
  title: sectionById[id].title,
  Page: () => <SectionStub id={id} />,
});

const routes: Record<string, Route> = {
  "/": { Page: TodayPage },
  "/getting-around": stub("getting-around"),
  "/home": { title: sectionById.home.title, Page: HomeUtilitiesPage },
  "/health-safety": { title: sectionById["health-safety"].title, Page: HealthSafetyPage },
  "/things-to-do": stub("things-to-do"),
  "/city-watch": { title: sectionById["city-watch"].title, Page: CityWatchPage },
  "/news": { title: sectionById.news.title, Page: NewsPage },
  "/contacts": stub("contacts"),
  "/sources": { title: "Sources and status", Page: SourcesPage },
};

const APP_TITLE = `${city.name} today`;

export function App() {
  const path = usePath();
  const route = routes[path] ?? { title: "Not found", Page: NotFoundPage };
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = route.title ? `${route.title} · ${APP_TITLE}` : APP_TITLE;
    // After a client-side navigation, start screen readers and keyboard users at the new page.
    if (firstRender.current) firstRender.current = false;
    else main.current?.focus();
  }, [path, route.title]);

  return (
    <Router>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[13rem_1fr] md:gap-8 md:px-6">
        {/* Light: a City trail sign (green title band, blue panel, green foot band). Dark: a lit glass panel. */}
        <header className="sticky top-0 z-10 md:top-6 md:mt-6 md:h-fit md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-lg md:shadow-md dark:bg-bg/85 dark:backdrop-blur dark:md:border dark:md:border-accent/25 dark:md:bg-surface/70 dark:md:shadow-[0_0_48px_-12px_rgb(123_63_228/0.6)]">
          <Link
            href="/"
            className="flex items-baseline gap-2 border-b-2 border-on-sign/90 bg-sign-green px-4 py-2 text-on-sign outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-on-sign md:block md:px-4 md:pt-3 md:pb-2 dark:border-accent/25 dark:bg-transparent dark:text-here dark:focus-visible:ring-accent"
          >
            <span className="text-xs md:block dark:text-[10px] dark:font-semibold dark:tracking-[0.25em] dark:text-accent dark:uppercase">
              <span className="dark:hidden">Today</span>
              <span className="hidden dark:inline">Tonight</span> in
            </span>
            <span className="text-lg font-bold tracking-wide uppercase md:block md:text-2xl md:leading-tight dark:[text-shadow:0_0_14px_rgb(255_181_71/0.55)]">{city.name}</span>
            <span className="hidden text-right text-xs md:block dark:text-muted">{city.province}</span>
          </Link>
          <AppNav />
          <p className="hidden border-t-2 border-on-sign/90 bg-sign-green px-4 py-2 text-center text-xs font-semibold text-on-sign md:block dark:border-t dark:border-accent/25 dark:bg-transparent dark:font-normal dark:text-muted">
            Civic info, sources shown
          </p>
        </header>
        {/* min-w-0: grid items default to min-width:auto and would grow to fit wide scrollers. */}
        <main ref={main} id="main" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none md:px-0">
          <route.Page />
        </main>
      </div>
    </Router>
  );
}
