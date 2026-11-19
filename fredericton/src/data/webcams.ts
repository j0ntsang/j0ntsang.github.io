/**
 * Live streams from the "Fredericton Caméra Web Cameras" YouTube channel (@frederictonwebcams).
 * The channel runs exactly these four. If a stream restarts, YouTube issues a new video ID;
 * the adapter then reports it offline and this list needs the new ID.
 */
export type WebcamDef = { id: string; name: string; place: string; youtubeId: string };

export const WEBCAM_CHANNEL = "https://www.youtube.com/@frederictonwebcams";

export const webcams: WebcamDef[] = [
  { id: "river", name: "Wolastoq River", place: "Downtown", youtubeId: "7TWcVHjxLUo" },
  { id: "officers-square", name: "Officers' Square", place: "Queen Street", youtubeId: "nfgjdKhacxU" },
  { id: "city-hall", name: "City Hall", place: "Queen & York", youtubeId: "jdAQEyWn4xs" },
  { id: "bridge-south", name: "Westmorland Street Bridge", place: "Facing south", youtubeId: "5yPimLNdWvg" },
];

/** YouTube serves live stills with a 5-minute cache, so refreshing faster gains nothing. */
export const STILL_REFRESH_MS = 5 * 60_000;

export const stillUrl = (youtubeId: string, size: "mq" | "maxres", bucket: number) =>
  `https://i.ytimg.com/vi/${youtubeId}/${size}default_live.jpg?t=${bucket}`;

/** Privacy-enhanced embed, muted autoplay (browsers block unmuted), JS API on for mute toggling. */
export const embedUrl = (youtubeId: string) =>
  `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&enablejsapi=1`;

export const watchUrl = (youtubeId: string) => `https://www.youtube.com/watch?v=${youtubeId}`;

/**
 * Opened from the jontsang.ca terminal, this page is cross-origin isolated (COEP), which blocks
 * YouTube's player unless its iframe is `credentialless`, and only Chromium supports that.
 * Elsewhere under COEP the cameras fall back to stills and a link to YouTube.
 */
export type EmbedMode = "normal" | "credentialless" | "unavailable";

export function embedMode(): EmbedMode {
  if (!globalThis.crossOriginIsolated) return "normal";
  return "credentialless" in HTMLIFrameElement.prototype ? "credentialless" : "unavailable";
}
