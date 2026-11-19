import { stillUrl } from "@/data/webcams";
import type { Webcam } from "@/sources/adapters/youtube-webcams";

/** A live still. The browser picks the 320 px or 1280 px image from the rendered size. */
export function Still({ cam, bucket, sizes, priority = false }: { cam: Webcam; bucket: number; sizes: string; priority?: boolean }) {
  if (!cam.live) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-surface-2 text-sm text-muted">
        Camera offline
      </div>
    );
  }
  return (
    <img
      src={stillUrl(cam.youtubeId, "mq", bucket)}
      srcSet={`${stillUrl(cam.youtubeId, "mq", bucket)} 320w, ${stillUrl(cam.youtubeId, "maxres", bucket)} 1280w`}
      sizes={sizes}
      width={1280}
      height={720}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className="aspect-video w-full select-none bg-surface-2 object-cover"
    />
  );
}
