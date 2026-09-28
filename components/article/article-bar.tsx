"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SearchBox, type SearchItem } from "@/components/chrome/search-box";
import { ThemeSwitch } from "@/components/chrome/theme-switch";
import { NAV } from "@/components/chrome/nav";
import s from "./article.module.css";

/** The floating bar on an article: back to this concept on the map, search, theme. */
export function ArticleBar({
  mapHref,
  phaseLabel,
  items,
  phase,
}: {
  mapHref: string;
  phaseLabel: string;
  items: SearchItem[];
  phase: number;
}) {
  const router = useRouter();
  return (
    <header className={s.bar}>
      <Link href={mapHref} transitionTypes={NAV.close} className={s.barBack}>
        <ArrowLeft size={15} /> Map
      </Link>
      <span className={s.barWhere}>{phaseLabel}</span>
      <SearchBox items={items} phase={phase} onPick={id => router.push(`/n/${id}`, { transitionTypes: NAV.forward })} />
      <ThemeSwitch />
    </header>
  );
}
