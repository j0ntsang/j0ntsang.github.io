import { useCallback, useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup, type Key } from "react-aria-components";
import { STILL_REFRESH_MS } from "@/data/webcams";
import type { Webcam } from "@/sources/adapters/youtube-webcams";
import { CoverFlow } from "./CoverFlow";
import { FullscreenCam } from "./FullscreenCam";
import { WebcamGrid } from "./WebcamGrid";

type View = "coverflow" | "grid";

const toggleClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent selected:bg-accent selected:text-on-accent";

export function WebcamViewer({ cams, initialBucket }: { cams: Webcam[]; initialBucket: number }) {
  const [view, setView] = useState<View>("coverflow");
  const [openId, setOpenId] = useState<string | null>(null);
  const bucket = useStillBucket(initialBucket);
  const open = cams.find((c) => c.id === openId) ?? null;
  const onOpen = useCallback((cam: Webcam) => setOpenId(cam.id), []);

  return (
    <div className="flex flex-col gap-4">
      <ToggleButtonGroup
        aria-label="Webcam layout"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[view]}
        onSelectionChange={(keys: Set<Key>) => setView(([...keys][0] as View) ?? "coverflow")}
        className="inline-flex self-start rounded-lg border border-line bg-surface p-0.5"
      >
        <ToggleButton id="coverflow" className={toggleClass}>
          Cover flow
        </ToggleButton>
        <ToggleButton id="grid" className={toggleClass}>
          All cameras
        </ToggleButton>
      </ToggleButtonGroup>

      {view === "coverflow" ? (
        // Unmount the live player while fullscreen is open: one stream at a time.
        <CoverFlow cams={cams} bucket={bucket} onOpen={onOpen} paused={open !== null} />
      ) : (
        <WebcamGrid cams={cams} bucket={bucket} onOpen={onOpen} />
      )}

      <FullscreenCam cam={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

/** Time bucket for still-image URLs, advanced on YouTube's 5-minute cache cycle. */
function useStillBucket(initial: number) {
  const [bucket, setBucket] = useState(initial);
  useEffect(() => {
    const tick = () => setBucket(Math.floor(Date.now() / STILL_REFRESH_MS));
    tick();
    const id = setInterval(tick, STILL_REFRESH_MS);
    return () => clearInterval(id);
  }, []);
  return bucket;
}
