import type { ReactNode } from "react";
import { canSavePreferences } from "@/lib/preferences";

function InfoIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.25v4M8 4.75v.01" strokeWidth="2" />
    </svg>
  );
}

const UNSAVED = "This browser isn't keeping site data, so you'll need to pick it again next time.";

/**
 * The one style for "this is saved on your device", wherever a preference is kept. `children`
 * says what's remembered; if storage is blocked, the note says that instead of promising.
 */
export function SavedNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-ink">
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-accent" />
      <span>{canSavePreferences() ? children : UNSAVED}</span>
    </p>
  );
}

/** The same message, small and unboxed, for a control with no room for a note (the theme toggle). */
export function SavedHint({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1 text-xs text-accent">
      <InfoIcon className="size-3.5 shrink-0" />
      {canSavePreferences() ? children : "Not saved in this browser"}
    </p>
  );
}
