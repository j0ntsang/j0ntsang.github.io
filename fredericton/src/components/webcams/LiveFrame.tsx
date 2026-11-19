import type { Ref } from "react";
import { embedMode, embedUrl } from "@/data/webcams";
import type { Webcam } from "@/sources/adapters/youtube-webcams";

type Props = { cam: Webcam; className: string; frameRef?: Ref<HTMLIFrameElement>; tabIndex?: number };

/** The YouTube player, or nothing where this page can't embed it (see embedMode). */
export function LiveFrame({ cam, className, frameRef, tabIndex }: Props) {
  const mode = embedMode();
  if (mode === "unavailable") return null;
  return (
    <iframe
      ref={frameRef}
      src={embedUrl(cam.youtubeId)}
      title={`${cam.name} live`}
      allow="autoplay; encrypted-media; picture-in-picture"
      tabIndex={tabIndex}
      // Not in React's types yet; must be set before the frame loads, which React does.
      {...(mode === "credentialless" ? { credentialless: "" } : {})}
      className={className}
    />
  );
}
