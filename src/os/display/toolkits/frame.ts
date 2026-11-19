// toolkits/frame — draw into a surface by embedding a whole separate web app, the way X11
// forwarding shows a program that runs somewhere else. The app is its own build with its own
// stack (fredericton: React 19 + Tailwind 4, next to this site's React 18 + Tailwind 3); the
// compositor still only sees one element.
//
// The app must be same-origin. That lets the window title follow the app's <title>, and lets
// Escape reach the window. Under cross-origin isolation it must also be served with COEP,
// which coi-serviceworker adds (and the dev server sends).

import type { Surface } from "../compositor";

const isTyping = (el: Element | null) =>
  !!el && ((el as HTMLElement).isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export function mountFrame(surface: Surface, url: string, label: string) {
  const frame = document.createElement("iframe");
  frame.src = new URL(url, document.baseURI).href;
  frame.title = label;
  frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#fff";
  surface.el.style.height = "100%";
  surface.el.append(frame);

  let titleWatch: MutationObserver | undefined;

  frame.addEventListener("load", () => {
    const doc = frame.contentDocument;
    if (!doc) return;

    titleWatch?.disconnect();
    const syncTitle = () => doc.title && surface.setTitle(doc.title);
    syncTitle();
    titleWatch = new MutationObserver(syncTitle);
    titleWatch.observe(doc.head, { subtree: true, childList: true, characterData: true });

    // Keys pressed inside the frame never reach the window, so pass Escape on (closes it, as
    // in every other window) when the app didn't use it and nobody is typing. Not `q`: the
    // app has text fields the compositor's own typing check can't see into.
    doc.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || isTyping(doc.activeElement)) return;
      frame.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
    });
  });

  surface.onClose(() => {
    titleWatch?.disconnect();
    frame.remove();
  });
}
