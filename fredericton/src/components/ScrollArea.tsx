import type { ReactNode } from "react";

/**
 * A list that scrolls inside its card past a reasonable height. Focusable and labelled, so
 * keyboard users can scroll it too (a scroll box that can't take focus traps its content).
 */
export function ScrollArea({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="-mx-1 max-h-96 overflow-y-auto overscroll-contain rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </div>
  );
}
