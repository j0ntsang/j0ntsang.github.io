import { describe, expect, it } from "vitest";
import { resolvePath, tildify } from "../path";

const HOME = "/home/guest";

describe("resolvePath", () => {
  it("expands ~ and ~/x to the home directory", () => {
    expect(resolvePath("~", "/", HOME)).toBe(HOME);
    expect(resolvePath("~/october/../x", "/", HOME)).toBe("/home/guest/x");
  });

  it("does not expand ~name", () => {
    expect(resolvePath("~root", "/tmp", HOME)).toBe("/tmp/~root");
  });

  it("resolves relative paths against the working directory", () => {
    expect(resolvePath("a/./b/..", HOME, HOME)).toBe("/home/guest/a");
  });

  it("treats an empty input as the working directory", () => {
    expect(resolvePath("", "/etc", HOME)).toBe("/etc");
  });

  it("stops .. at the root", () => {
    expect(resolvePath("../../../..", "/home", HOME)).toBe("/");
    expect(resolvePath("/..", "/", HOME)).toBe("/");
  });

  it("collapses repeated and trailing slashes", () => {
    expect(resolvePath("//usr///share//", "/", HOME)).toBe("/usr/share");
    expect(resolvePath("/", "/home", HOME)).toBe("/");
  });
});

describe("tildify", () => {
  it("abbreviates home and paths inside it", () => {
    expect(tildify("/home/guest", HOME)).toBe("~");
    expect(tildify("/home/guest/x", HOME)).toBe("~/x");
  });

  it("leaves a sibling that merely shares the prefix alone", () => {
    expect(tildify("/home/guestbook", HOME)).toBe("/home/guestbook");
    expect(tildify("/home/guestx/y", HOME)).toBe("/home/guestx/y");
  });

  it("leaves unrelated paths alone", () => {
    expect(tildify("/etc/motd", HOME)).toBe("/etc/motd");
  });
});
