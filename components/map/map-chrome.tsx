"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { phaseHref, type PhaseInfo } from "@/lib/graph";
import { SearchBox, type SearchItem } from "@/components/chrome/search-box";
import { PhaseTabs } from "@/components/chrome/phase-tabs";
import { ThemeSwitch } from "@/components/chrome/theme-switch";
import { setFocus, useFocus } from "./focus";
import s from "./map.module.css";

/** Which phase the map is showing: 1 at /, n at /phase/n. */
function usePhase(): number {
  const m = usePathname().match(/^\/phase\/(\d+)/);
  return m ? Number(m[1]) : 1;
}

/**
 * The bar and legend over every phase map. They live in the map layout, not in
 * the per-phase map, so switching phases doesn't remount or animate them.
 */
export function MapChrome({ items, phases }: { items: SearchItem[]; phases: PhaseInfo[] }) {
  const router = useRouter();
  const phase = usePhase();
  const focus = useFocus();
  const byId = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

  const open = (id: string) => {
    const c = byId.get(id);
    if (!c) return;
    if (c.phase === phase) setFocus(id);
    else router.push(`${phaseHref(c.phase)}#${id}`);
  };

  return (
    <>
      <header className={s.bar}>
        <Link href="/" className={s.brand}>
          backend-eng-graph
        </Link>
        <PhaseTabs phases={phases} current={phase} />
        <SearchBox items={items} phase={phase} onPick={open} />
        <ThemeSwitch />
      </header>

      <div className={s.legend} aria-hidden data-hidden={focus ? "" : undefined}>
        <span>
          <i className={s.lgNeed} />
          needs
        </span>
        <span>
          <i className={s.lgLead} />
          unlocks
        </span>
        <span>
          <i className={s.lgDone} />
          understood
        </span>
      </div>
    </>
  );
}
