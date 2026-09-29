import Link from "next/link";
import { phaseHref, type PhaseInfo } from "@/lib/graph";
import s from "./chrome.module.css";

/** Every phase in order. The current one shows its name; phases with nothing written yet are greyed out. */
export function PhaseTabs({ phases, current }: { phases: PhaseInfo[]; current: number | null }) {
  return (
    <nav className={s.tabs} aria-label="Phases">
      {phases.map(p =>
        p.concepts > 0 ? (
          <Link
            key={p.n}
            href={phaseHref(p.n)}
            className={s.tab}
            aria-current={p.n === current ? "page" : undefined}
            title={`Phase ${p.n}: ${p.title}`}
          >
            <span className={s.tabNum}>{p.n}</span>
            <span className={s.tabName}>{p.short}</span>
          </Link>
        ) : (
          <span key={p.n} className={s.tab} data-off title={`Phase ${p.n}: ${p.title}. Nothing written yet.`}>
            <span className={s.tabNum}>{p.n}</span>
          </span>
        ),
      )}
    </nav>
  );
}
