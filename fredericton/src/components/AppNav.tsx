import { useEffect, useRef, useState } from "react";
import { Button, Link, Tooltip, TooltipTrigger } from "react-aria-components";
import { sectionById, sections } from "@/ia/sections";
import { usePath } from "@/router";

/*
 * Light mode draws the nav as one of the City's trail signs: sections are stops on a green trail
 * line, the current page is the orange "you are here" dot, and City Watch is a trail connection.
 * Desktop runs the trail down the sidebar; phones slide the same sign out from the header (SiteMenu).
 * Dark mode drops the sign for a night look: a plain list, the current page lit amber.
 */

/** Sign-only decoration. Important, so it beats the display utilities regardless of variant order. */
const SIGN_ONLY = "dark:hidden!";

type StopKind = "crossing" | "connection";

const isCurrent = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

type Stop = { href: string; title: string; summary: string; kind: StopKind };

function navStops(): Stop[] {
  const cityWatch = sectionById["city-watch"];
  return [
    ...sections.filter((s) => s.id !== "city-watch").map((s) => ({ href: s.href, title: s.title, summary: s.summary, kind: "crossing" as const })),
    { href: cityWatch.href, title: cityWatch.title, summary: cityWatch.summary, kind: "connection" },
    { href: "/sources", title: "Sources and status", summary: "Where every number comes from, and whether it's working.", kind: "crossing" },
  ];
}

/** Desktop sidebar. */
export function AppNav() {
  return <TrailSign label="Sections" className="hidden md:block" />;
}

/** The sign itself, shared by the desktop sidebar and the phone drawer (larger type there). */
function TrailSign({
  label,
  className = "",
  large = false,
  onNavigate,
}: {
  label: string;
  className?: string;
  large?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePath();
  const stops = navStops();

  return (
    <nav aria-label={label} className={`${className} bg-sign-blue pt-4 text-on-sign dark:bg-transparent dark:pt-0! dark:text-ink`}>
      <TrailArrow />
      <ul className="flex flex-col pb-2 dark:gap-1 dark:p-2">
        {stops.map((stop, i) => (
          <Stop
            key={stop.href}
            href={stop.href}
            title={stop.title}
            kind={stop.kind}
            current={isCurrent(pathname, stop.href)}
            last={i === stops.length - 1}
            index={i}
            large={large}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
      <Legend />
    </nav>
  );
}

function Stop({
  href,
  title,
  kind,
  current,
  last,
  index,
  large,
  onNavigate,
}: Omit<Stop, "summary"> & {
  current: boolean;
  last: boolean;
  index: number;
  large: boolean;
  onNavigate?: () => void;
}) {
  // Large (phones): bigger type and taller rows; the trail geometry stays the same. At night it's
  // a club-listing look instead: big bold names, the current one glowing amber.
  const size = large
    ? "py-3.5 text-lg dark:py-3! dark:text-2xl dark:font-semibold dark:tracking-tight dark:aria-[current=page]:[text-shadow:0_0_18px_rgb(255_181_71/0.55)]"
    : "py-2.5 text-sm dark:py-2!";
  return (
    <li className="trail-stop relative shrink-0" style={{ "--i": index } as React.CSSProperties}>
      {/* Trail segment through this stop. */}
      <span
        aria-hidden
        className={`${SIGN_ONLY} absolute top-0 left-[22px] w-[3px] bg-trail ${last ? "bottom-1/2" : "bottom-0"}`}
      />
      {/* Street crossing: a pale rule through the dot, as on the sign. */}
      <span aria-hidden className={`${SIGN_ONLY} absolute top-1/2 left-2 h-px w-8 -translate-y-1/2 bg-crossing/70`} />
      {kind === "connection" && (
        <span aria-hidden className={`${SIGN_ONLY} absolute top-1/2 left-[23px] h-[3px] w-6 -translate-y-1/2 bg-trail`} />
      )}
      <Link
        href={href}
        onPress={onNavigate}
        aria-current={current ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-md px-3 ${size} text-on-sign/85 outline-none hover:text-on-sign focus-visible:ring-2 focus-visible:ring-on-sign aria-[current=page]:font-semibold aria-[current=page]:text-on-sign dark:text-muted dark:hover:bg-accent/10 dark:hover:text-ink dark:focus-visible:ring-accent dark:aria-[current=page]:bg-accent/15 dark:aria-[current=page]:text-here`}
      >
        {current && (
          <span
            aria-hidden
            className="absolute inset-y-1.5 left-0 hidden w-[3px] rounded-full bg-here shadow-[0_0_10px_var(--here)] dark:block"
          />
        )}
        <span aria-hidden className={`${SIGN_ONLY} grid size-6 shrink-0 place-items-center`}>
          <Dot kind={kind} current={current} />
        </span>
        <span className="whitespace-nowrap underline-offset-4 group-hover:underline pl-3 dark:pl-0! dark:no-underline!">
          {kind === "connection" && <LiveCameraIcon />}
          {title}
        </span>
      </Link>
    </li>
  );
}

function Dot({ kind, current }: { kind: StopKind; current: boolean }) {
  if (current) return <span className="size-4 rounded-full bg-sign-here ring-2 ring-on-sign" />;
  if (kind === "connection") return <span className="size-3.5 rounded-full bg-trail ring-2 ring-sign-green" />;
  return <span className="size-3 rounded-full bg-on-sign" />;
}

/** The arrow at the top of the sign's trail line: the trail continues beyond the list. */
function TrailArrow() {
  return (
    <svg aria-hidden viewBox="0 0 24 14" className={`${SIGN_ONLY} ml-3 block h-3.5 w-6 text-trail`}>
      <path d="M4 12l8-9 8 9M12 3v11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Legend() {
  const item = "flex flex-col items-center gap-1 text-center text-[10px] leading-tight text-on-sign/85";
  return (
    <div aria-hidden className={`${SIGN_ONLY} mx-2 grid grid-cols-3 gap-1 border-t-2 border-on-sign/80 px-1 py-2.5`}>
      <span className={item}>
        <span className="flex h-3 items-center">
          <span className="h-px w-3 bg-crossing" />
          <span className="size-2.5 rounded-full bg-on-sign" />
          <span className="h-px w-3 bg-crossing" />
        </span>
        Section
      </span>
      <span className={item}>
        <span className="flex h-3 items-center">
          <span className="size-3 rounded-full bg-sign-here ring-2 ring-on-sign" />
        </span>
        You are here
      </span>
      <span className={item}>
        <span className="flex h-3 items-center">
          <span className="h-[3px] w-3 bg-trail" />
          <span className="size-2.5 rounded-full bg-trail ring-2 ring-sign-green" />
          <span className="h-[3px] w-3 bg-trail" />
        </span>
        Live
      </span>
    </div>
  );
}

/** Video camera with a red "on air" dot. */
function LiveCameraIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 16" className="mr-1.5 inline-block h-3.5 w-4.5 align-[-2px]">
      <rect x="1" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 7l5-3v8l-5-3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="4.5" cy="6.5" r="1.6" className="fill-sign-here" />
    </svg>
  );
}

/**
 * Phones: the site navigation slides out from the right under the header, behind a ☰ button.
 * A disclosure, not a dialog: the button reports aria-expanded, the drawer follows it in the
 * Tab order, and it closes on Escape (focus back on the button), on a tap on the scrim, when
 * focus leaves it, or once a page is chosen. The slide is CSS only (transform, see .site-drawer
 * in globals.css), so it runs on the compositor.
 *
 * The drawer is positioned against the header (absolute, top-full), not the viewport: the dark
 * header's backdrop-filter would make it the containing block for anything fixed anyway.
 */
export function SiteMenu() {
  const pathname = usePath();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={root}
      className="contents"
      onBlur={(e) => {
        if (open && !root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <TooltipTrigger delay={500}>
        <Button
          ref={button}
          aria-expanded={open}
          aria-controls="site-menu"
          onPress={() => setOpen((o) => !o)}
          className="mr-2 grid size-11 shrink-0 place-items-center rounded-md text-on-sign outline-none hover:bg-on-sign/10 focus-visible:ring-2 focus-visible:ring-on-sign pressed:bg-on-sign/20 aria-expanded:bg-on-sign/15 md:hidden dark:text-ink dark:hover:bg-accent/10 dark:focus-visible:ring-accent dark:aria-expanded:bg-accent/15"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="size-6">
            <path
              d={open ? "M5 5l10 10M15 5L5 15" : "M3 5h14M3 10h14M3 15h14"}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">Navigation</span>
        </Button>
        <Tooltip placement="bottom end" offset={6} className="rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-bg shadow-lg">
          Site Navigation
        </Tooltip>
      </TooltipTrigger>

      {/* Scrim: a tap beside the drawer closes it. Decoration only, so hidden from assistive tech. */}
      <div aria-hidden data-open={open || undefined} onClick={() => setOpen(false)} className="site-scrim absolute top-full right-0 left-0 h-[calc(100dvh-100%)] bg-black/40 md:hidden" />

      {/* Full width on phones, capped on wider ones (SE landscape) so the dimmed page still shows. */}
      <div
        id="site-menu"
        data-open={open || undefined}
        className="site-drawer absolute top-full right-0 flex h-[calc(100dvh-100%)] w-full flex-col overflow-y-auto overscroll-contain bg-sign-blue shadow-2xl sm:w-md md:hidden dark:border-l dark:border-accent/25 dark:bg-bg dark:bg-[radial-gradient(120%_55%_at_100%_0%,rgb(123_63_228/0.38),transparent_65%),radial-gradient(90%_45%_at_0%_100%,rgb(255_181_71/0.14),transparent_70%)]"
      >
        <TrailSign label="Site" large onNavigate={() => setOpen(false)} />
        <p className="mt-auto border-t-2 border-on-sign/90 bg-sign-green px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-sm font-semibold text-on-sign dark:border-t dark:border-accent/25 dark:bg-transparent dark:py-4 dark:text-[10px] dark:tracking-[0.3em] dark:text-accent dark:uppercase">
          Civic info, sources shown
        </p>
      </div>
    </div>
  );
}
