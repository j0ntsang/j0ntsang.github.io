import { useSyncExternalStore } from "react";
import { ToggleButton, ToggleButtonGroup, type Key } from "react-aria-components";
import { THEME_KEY, writePreference, type ThemeChoice } from "@/lib/preferences";

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const readThemeChoice = (): ThemeChoice => {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
};

function saveThemeChoice(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    delete root.dataset.theme;
    writePreference(THEME_KEY, null);
  } else {
    root.dataset.theme = choice;
    writePreference(THEME_KEY, choice);
  }
  listeners.forEach((fn) => fn());
}

const THEME_OPTIONS: { id: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  {
    id: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
      </>
    ),
  },
  { id: "dark", label: "Dark", icon: <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" /> },
  {
    id: "system",
    label: "Auto",
    icon: (
      <>
        <rect x="2" y="3" width="12" height="8" rx="1" />
        <path d="M6 14h4M8 11v3" />
      </>
    ),
  },
];

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, readThemeChoice);

  return (
    <ToggleButtonGroup
      aria-label="Colour theme"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[choice]}
      onSelectionChange={(keys: Set<Key>) => {
        const next = [...keys][0] as ThemeChoice | undefined;
        if (next) saveThemeChoice(next);
      }}
      className="inline-flex shrink-0 rounded-lg border border-line bg-surface p-0.5"
    >
      {THEME_OPTIONS.map((o) => (
        <ToggleButton
          key={o.id}
          id={o.id}
          aria-label={o.id === "system" ? "Match system setting" : `${o.label} mode`}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent selected:bg-accent selected:text-on-accent"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {o.icon}
          </svg>
          <span className="hidden sm:inline">{o.label}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
