import { Button } from "react-aria-components";
import type { Webcam } from "@/sources/adapters/youtube-webcams";
import { Still } from "./Still";

export function WebcamGrid({ cams, bucket, onOpen }: { cams: Webcam[]; bucket: number; onOpen: (cam: Webcam) => void }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {cams.map((cam) => (
        <li key={cam.id}>
          <Button
            isDisabled={!cam.live}
            onPress={() => onOpen(cam)}
            aria-label={`${cam.name}, ${cam.place}. Open full screen`}
            className="group relative block w-full overflow-hidden rounded-xl border border-line bg-surface text-left outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed"
          >
            <Still cam={cam} bucket={bucket} sizes="(min-width: 640px) 50vw, 100vw" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent p-3 text-white">
              <span>
                <span className="block text-sm font-semibold">{cam.name}</span>
                <span className="block text-xs opacity-80">{cam.place}</span>
              </span>
              {cam.live && <LiveBadge />}
            </span>
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      <span aria-hidden className="size-1.5 rounded-full bg-white" />
      Live
    </span>
  );
}
