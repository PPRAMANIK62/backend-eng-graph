"use client";

import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useHydrated } from "@/lib/progress";
import s from "./chrome.module.css";

const OPTIONS = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "Match system", Icon: Monitor },
] as const;

/** Light, dark or system. The pill slides in CSS; the page crossfades between themes where supported. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const index = hydrated ? OPTIONS.findIndex(o => o.id === theme) : -1; // the stored choice isn't known on the server

  const choose = (next: string) => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) return setTheme(next);
    document.startViewTransition(() => flushSync(() => setTheme(next)));
  };

  return (
    <div role="radiogroup" aria-label="Theme" className={s.theme} style={{ "--i": index } as React.CSSProperties} data-ready={index >= 0}>
      <span className={s.themePill} aria-hidden />
      {OPTIONS.map(({ id, label, Icon }, i) => (
        // A radio group of icon buttons (WAI-ARIA radio pattern); a native radio can't hold an icon this way.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        <button key={id} type="button" role="radio" aria-checked={index === i} aria-label={label} title={label} onClick={() => choose(id)}>
          <Icon size={15} strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
