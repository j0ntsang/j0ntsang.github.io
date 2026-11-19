import { useRef, useState } from "react";
import { Button, Dialog, Heading, Link, Modal, ModalOverlay } from "react-aria-components";
import { embedMode, STILL_REFRESH_MS, watchUrl } from "@/data/webcams";
import type { Webcam } from "@/sources/adapters/youtube-webcams";
import { LiveFrame } from "./LiveFrame";
import { Still } from "./Still";

const YT_ORIGIN = "https://www.youtube-nocookie.com";
/** Axis lock kicks in after this much movement, so taps aren't treated as swipes. */
const LOCK_PX = 10;
/** Dismiss after dragging this share of the screen, or flicking faster than FLICK. */
const DISMISS_SHARE = 0.22;
const FLICK_PX_PER_MS = 0.6;
const EXIT_MS = 200;

type Drag = { startX: number; startY: number; startedAt: number; axis: "up" | "right" | "none" | null };

export function FullscreenCam({ cam, onClose }: { cam: Webcam | null; onClose: () => void }) {
  return (
    <ModalOverlay
      isOpen={cam !== null}
      onOpenChange={(open) => !open && onClose()}
      isDismissable
      className="fixed inset-0 z-50 bg-black entering:animate-[fade-in_150ms_ease-out]"
    >
      <Modal className="h-dvh w-screen outline-none">
        <Dialog aria-label={cam?.name ?? "Webcam"} className="h-full w-full outline-none">
          {cam && <Player cam={cam} onClose={onClose} />}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function Player({ cam, onClose }: { cam: Webcam; onClose: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const drag = useRef<Drag | null>(null);
  const [muted, setMuted] = useState(true);
  const canPlay = embedMode() !== "unavailable";

  // Drag writes transforms straight to the element: no React render per pointer move.
  const setOffset = (x: number, y: number, animate: boolean) => {
    const el = stage.current;
    if (!el) return;
    const progress = Math.min(1, Math.max(Math.abs(x) / innerWidth, Math.abs(y) / innerHeight) / 0.6);
    el.style.transition = animate ? `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out` : "none";
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    el.style.opacity = String(1 - progress * 0.6);
  };

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, startedAt: performance.now(), axis: null };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.axis === null && Math.hypot(dx, dy) > LOCK_PX) {
      // Only up and right dismiss; down and left do nothing.
      d.axis = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "up" : "none") : dx > 0 ? "right" : "none";
    }
    if (d.axis === "up") setOffset(0, Math.min(0, dy), false);
    if (d.axis === "right") setOffset(Math.max(0, dx), 0, false);
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis === null || d.axis === "none") return;
    const dist = d.axis === "up" ? Math.max(0, d.startY - e.clientY) : Math.max(0, e.clientX - d.startX);
    const size = d.axis === "up" ? innerHeight : innerWidth;
    const speed = dist / Math.max(1, performance.now() - d.startedAt);
    if (dist > size * DISMISS_SHARE || speed > FLICK_PX_PER_MS) {
      setOffset(d.axis === "right" ? size : 0, d.axis === "up" ? -size : 0, true);
      setTimeout(onClose, EXIT_MS);
    } else {
      setOffset(0, 0, true);
    }
  }

  function toggleSound() {
    const next = !muted;
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: next ? "mute" : "unMute", args: [] }), YT_ORIGIN);
    setMuted(next);
  }

  return (
    <div ref={stage} className="flex h-full w-full flex-col bg-black text-white will-change-transform">
      {/* A solid bar, not an overlay: YouTube draws its own title over the top of the video. */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <Heading slot="title" className="truncate text-lg font-semibold">
            {cam.name}
          </Heading>
          <p className="truncate text-sm opacity-70">{cam.place} · live</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {canPlay && (
            <Button
              onPress={toggleSound}
              aria-label={muted ? "Turn sound on" : "Mute"}
              className="rounded-full bg-white/15 p-2.5 outline-none backdrop-blur hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6h2.5L8 3v10L4.5 10H2z" />
                {muted ? <path d="M11 6l4 4M15 6l-4 4" /> : <path d="M11 5.5a3.5 3.5 0 0 1 0 5M13 3.5a6.5 6.5 0 0 1 0 9" />}
              </svg>
            </Button>
          )}
          <Button
            onPress={onClose}
            aria-label="Close"
            autoFocus
            className="rounded-full bg-white/15 p-2.5 outline-none backdrop-blur hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {canPlay ? (
          <LiveFrame cam={cam} frameRef={frame} className="absolute inset-0 h-full w-full border-0" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <Still cam={cam} bucket={Math.floor(Date.now() / STILL_REFRESH_MS)} sizes="100vw" priority />
            <Link
              href={watchUrl(cam.youtubeId)}
              target="_blank"
              className="relative z-10 rounded-full bg-white/15 px-4 py-2 text-sm font-medium outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
            >
              Watch live on YouTube
            </Link>
          </div>
        )}
        {/* Gesture layer: the iframe would otherwise swallow every touch. */}
        <div
          aria-hidden
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
            setOffset(0, 0, true);
          }}
          className="absolute inset-0 touch-none"
        />
      </div>

      <p className="shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-center text-xs text-white/60">
        Swipe up or right to close
      </p>
    </div>
  );
}
