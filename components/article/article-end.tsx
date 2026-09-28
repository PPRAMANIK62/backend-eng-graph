"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { minutes } from "@/lib/graph";
import { useHydrated, useUnderstood } from "@/lib/progress";
import { NAV } from "@/components/chrome/nav";
import s from "./article.module.css";

type Next = { id: string; title: string; note: string; words: number };

/** End of an article: mark it understood, then go on to what it unlocks. */
export function ArticleEnd({ id, next, mapHref }: { id: string; next: Next[]; mapHref: string }) {
  const { understood, toggle } = useUnderstood();
  const hydrated = useHydrated();
  const on = hydrated && understood.has(id);

  return (
    <section className={s.end} aria-label="What next">
      <p className={s.endTitle}>Got it?</p>
      <p className={s.endLede}>Mark it and it gets a check on the map, so you can see how much of the phase you've covered.</p>
      <button type="button" className={s.mark} data-on={on || undefined} aria-pressed={on} onClick={() => toggle(id)}>
        <span className={s.markBox}>
          <Check size={13} strokeWidth={3.4} />
        </span>
        {on ? "Understood" : "Mark as understood"}
      </button>

      {next.length > 0 && (
        <>
          <p className={s.upNext}>This unlocks</p>
          <ul className={s.nextList}>
            {next.map(n => (
              <li key={n.id}>
                <Link href={`/n/${n.id}`} transitionTypes={NAV.forward} className={s.nextCard}>
                  <span>
                    <b>{n.title}</b>
                    <small>
                      {n.note} · {minutes(n.words)} min
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link href={mapHref} transitionTypes={NAV.close} className={s.backMap}>
        See it on the map
      </Link>
    </section>
  );
}
