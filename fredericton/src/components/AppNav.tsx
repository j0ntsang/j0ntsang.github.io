import { Link } from "react-aria-components";
import { sectionById, sections } from "@/ia/sections";
import { usePath } from "@/router";

/*
 * Light mode draws the nav as one of the City's trail signs: sections are stops on a green trail
 * line, the current page is the orange "you are here" dot, and City Watch is a trail connection.
 * Mobile runs the trail horizontally under the header; desktop runs it down the sidebar.
 * Dark mode drops the sign for a night look: a plain list, the current page lit amber.
 */

/** Sign-only decoration. Important, so it beats md:block regardless of variant order. */
const SIGN_ONLY = "dark:hidden!";

type StopKind = "crossing" | "connection";

const isCurrent = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function AppNav() {
  const pathname = usePath();
  const cityWatch = sectionById["city-watch"];
  const stops: { href: string; title: string; kind: StopKind }[] = [
    ...sections.filter((s) => s.id !== "city-watch").map((s) => ({ href: s.href, title: s.title, kind: "crossing" as const })),
    { href: cityWatch.href, title: cityWatch.title, kind: "connection" },
    { href: "/sources", title: "Sources and status", kind: "crossing" },
  ];

  return (
    <nav aria-label="Sections" className="bg-sign-blue text-on-sign md:pt-4 dark:bg-transparent dark:pt-0! dark:text-ink">
      <TrailArrow />
      <ul className="flex overflow-x-auto [scrollbar-width:none] px-2 pt-2 md:flex-col md:overflow-visible md:px-0 md:pt-0 md:pb-2 dark:gap-1 dark:pb-2 dark:md:p-2">
        {stops.map((stop, i) => (
          <Stop
            key={stop.href}
            {...stop}
            current={isCurrent(pathname, stop.href)}
            first={i === 0}
            last={i === stops.length - 1}
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
  first,
  last,
}: {
  href: string;
  title: string;
  kind: StopKind;
  current: boolean;
  first: boolean;
  last: boolean;
}) {
  return (
    <li className="relative shrink-0">
      {/* Trail segment through this stop. Mobile: horizontal through the dot row. Desktop: vertical. */}
      <span
        aria-hidden
        className={`${SIGN_ONLY} absolute top-[10px] h-[3px] bg-trail ${first ? "left-1/2" : "left-0"} ${last ? "right-1/2" : "right-0"} md:right-auto md:left-[22px] md:h-auto md:w-[3px] md:top-0 ${last ? "md:bottom-1/2" : "md:bottom-0"}`}
      />
      {/* Street crossing: a pale rule through the dot, as on the sign. Desktop only. */}
      <span aria-hidden className={`${SIGN_ONLY} absolute top-1/2 left-2 hidden h-px w-8 -translate-y-1/2 bg-crossing/70 md:block`} />
      {kind === "connection" && (
        <span aria-hidden className={`${SIGN_ONLY} absolute top-1/2 left-[23px] hidden h-[3px] w-6 -translate-y-1/2 bg-trail md:block`} />
      )}
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className="group relative flex flex-col items-center gap-1 rounded-md px-3 pb-2 text-sm text-on-sign/85 outline-none hover:text-on-sign focus-visible:ring-2 focus-visible:ring-on-sign aria-[current=page]:font-semibold aria-[current=page]:text-on-sign md:flex-row md:gap-3 md:py-2.5 md:pr-3 md:pl-3 dark:flex-row! dark:px-3! dark:py-2! dark:text-muted dark:hover:bg-accent/10 dark:hover:text-ink dark:focus-visible:ring-accent dark:aria-[current=page]:bg-accent/15 dark:aria-[current=page]:text-here"
      >
        {current && (
          <span
            aria-hidden
            className="absolute inset-y-1.5 left-0 hidden w-[3px] rounded-full bg-here shadow-[0_0_10px_var(--here)] dark:md:block"
          />
        )}
        <span aria-hidden className={`${SIGN_ONLY} grid size-6 shrink-0 place-items-center`}>
          <Dot kind={kind} current={current} />
        </span>
        <span className="whitespace-nowrap underline-offset-4 group-hover:underline md:pl-3 dark:pl-0! dark:no-underline!">
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
    <svg aria-hidden viewBox="0 0 24 14" className={`${SIGN_ONLY} ml-3 hidden h-3.5 w-6 text-trail md:block`}>
      <path d="M4 12l8-9 8 9M12 3v11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Legend() {
  const item = "flex flex-col items-center gap-1 text-center text-[10px] leading-tight text-on-sign/85";
  return (
    <div aria-hidden className={`${SIGN_ONLY} mx-2 hidden grid-cols-3 gap-1 border-t-2 border-on-sign/80 px-1 py-2.5 md:grid`}>
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
