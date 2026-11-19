import { afterEach, describe, expect, it, vi } from "vitest";
import { webcams } from "@/data/webcams";
import { getWebcams } from "./youtube-webcams";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getWebcams", () => {
  it("reports a failed liveness check once and marks only that camera offline", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const [first, second] = webcams;
    const probe = vi.fn(async (url: string) => {
      if (url.includes(second.youtubeId)) throw new Error("timed out");
      return url.includes(first.youtubeId);
    });

    const env = await getWebcams(probe);

    expect(env.ok).toBe(true);
    if (!env.ok) return;
    expect(env.data.find((c) => c.id === first.id)?.live).toBe(true);
    expect(env.data.find((c) => c.id === second.id)?.live).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0].join(" ")).toContain(`${second.id}`);
    expect(errorSpy.mock.calls[0].join(" ")).toContain("timed out");
  });

  it("returns a failed envelope when every check fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const env = await getWebcams(vi.fn().mockRejectedValue(new Error("network down")));

    expect(env.ok).toBe(false);
  });
});
