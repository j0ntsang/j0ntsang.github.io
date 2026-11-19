import { webcams, type WebcamDef } from "@/data/webcams";
import { collect } from "@/lib/envelope";
import { sourceById } from "@/sources/registry";

const def = sourceById["webcams"];

export type Webcam = WebcamDef & { live: boolean };

/** Resolves true if the URL loads as an image, false if it 404s; rejects on timeout. */
export type ImageProbe = (url: string) => Promise<boolean>;

/**
 * Live stills send CORP but no CORS headers, so fetch() can't read them. An <img> can,
 * and its error event is how a missing still shows up.
 */
const loadsAsImage: ImageProbe = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = "";
      reject(new Error("timed out"));
    }, 8_000);
    img.onload = () => (clearTimeout(timer), resolve(true));
    img.onerror = () => (clearTimeout(timer), resolve(false));
    img.src = url;
  });

async function isLiveOrLog(probe: ImageProbe, camId: string, youtubeId: string): Promise<boolean> {
  try {
    // A `_live` still only exists while the stream is broadcasting, so it doubles as a liveness check.
    return await probe(`https://i.ytimg.com/vi/${youtubeId}/mqdefault_live.jpg?t=${Math.floor(Date.now() / 60_000)}`);
  } catch (err) {
    console.error(`[source:${def.id}]`, `liveness check failed for ${camId}:`, err instanceof Error ? err.message : String(err));
    return false;
  }
}

export function getWebcams(probe: ImageProbe = loadsAsImage) {
  return collect<Webcam[]>(def.id, async () => {
    const cams = await Promise.all(webcams.map(async (w) => ({ ...w, live: await isLiveOrLog(probe, w.id, w.youtubeId) })));
    if (!cams.some((c) => c.live)) throw new Error("No webcam streams are live");
    return { observedAt: new Date().toISOString(), timeBasis: "checked", data: cams };
  });
}
