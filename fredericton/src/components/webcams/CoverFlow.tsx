import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";
import type { Webcam } from "@/sources/adapters/youtube-webcams";
import { LiveFrame } from "./LiveFrame";
import { Still } from "./Still";
import { LiveBadge } from "./WebcamGrid";

/** Wait for scrolling to settle before starting a stream, so flicking past cameras costs nothing. */
const LIVE_DELAY_MS = 450;

type Props = { cams: Webcam[]; bucket: number; onOpen: (cam: Webcam) => void; paused: boolean };

/**
 * The 3D effect is a CSS scroll-driven animation (see .coverflow in globals.css): the browser
 * animates transforms on the compositor as you scroll, with no JS per frame. JS only tracks which
 * card is centred, once scrolling ends, to decide where the single live player goes.
 */
export function CoverFlow({ cams, bucket, onOpen, paused }: Props) {
  const scroller = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  /** Where a programmatic scroll is heading, so repeated Next presses keep advancing mid-scroll. */
  const scrollTargetIndex = useRef<number | null>(null);
  const [liveIndex, setLiveIndex] = useState<number | null>(null);

  const centredIndex = useCallback(() => {
    const el = scroller.current;
    if (!el) return 0;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    [...el.children].forEach((child, i) => {
      const c = child as HTMLElement;
      const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (dist < bestDist) [best, bestDist] = [i, dist];
    });
    return best;
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const el = scroller.current;
    const index = Math.max(0, Math.min(i, cams.length - 1));
    const child = el?.children[index] as HTMLElement | undefined;
    if (!el || !child) return;
    scrollTargetIndex.current = index;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: child.offsetLeft + child.offsetWidth / 2 - el.clientWidth / 2, behavior: smooth ? "smooth" : "auto" });
  }, [cams.length]);

  // Track scroll start (drop the stream) and end (pick the centred card).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let scrolling = false;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      scrolling = false;
      scrollTargetIndex.current = null;
      setActiveIndex(centredIndex());
    };
    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        setLiveIndex(null);
      }
      // Browsers without `scrollend` get a debounce.
      if (!("onscrollend" in window)) {
        clearTimeout(fallback);
        fallback = setTimeout(settle, 120);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", settle);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", settle);
      clearTimeout(fallback);
    };
  }, [centredIndex]);

  useEffect(() => {
    if (paused || !cams[activeIndex]?.live) return setLiveIndex(null);
    const t = setTimeout(() => setLiveIndex(activeIndex), LIVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [activeIndex, paused, cams]);

  const step = (delta: number) => scrollToIndex((scrollTargetIndex.current ?? activeIndex) + delta);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else return;
    e.preventDefault();
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Webcams"
        onKeyDown={onKeyDown}
        className="relative -mx-4 md:mx-0"
      >
        <ul ref={scroller} className="coverflow" aria-live="off">
          {cams.map((cam, i) => (
            <li key={cam.id} aria-roledescription="slide" aria-label={`${i + 1} of ${cams.length}: ${cam.name}`}>
              <Button
                isDisabled={!cam.live && i === activeIndex}
                onPress={() => (i === activeIndex ? onOpen(cam) : scrollToIndex(i))}
                aria-label={i === activeIndex ? `${cam.name}, ${cam.place}. Open full screen` : `Show ${cam.name}`}
                className="relative block w-full overflow-hidden rounded-xl bg-black text-left shadow-2xl outline-none focus-visible:ring-4 focus-visible:ring-accent"
              >
                <Still cam={cam} bucket={bucket} sizes="min(70vw, 560px)" priority={i === 0} />
                {liveIndex === i && (
                  // The button underneath gets the clicks.
                  <LiveFrame cam={cam} tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full border-0" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          aria-label="Previous camera"
          isDisabled={activeIndex === 0}
          onPress={() => step(-1)}
          className="rounded-full border border-line p-2 text-ink outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-30"
        >
          <Chevron dir="left" />
        </Button>
        <div className="text-center" aria-live="polite">
          <p className="flex items-center justify-center gap-2 font-semibold text-ink">
            {cams[activeIndex]?.name} {cams[activeIndex]?.live && <LiveBadge />}
          </p>
          <p className="text-sm text-muted">{cams[activeIndex]?.place} · tap to go full screen</p>
        </div>
        <Button
          aria-label="Next camera"
          isDisabled={activeIndex === cams.length - 1}
          onPress={() => step(1)}
          className="rounded-full border border-line p-2 text-ink outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-30"
        >
          <Chevron dir="right" />
        </Button>
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={dir === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
    </svg>
  );
}
