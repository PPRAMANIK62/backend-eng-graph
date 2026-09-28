"use client";

import Link from "next/link";
import { minutes, type LinkedNode } from "@/lib/graph";
import { useHydrated, useUnderstood } from "@/lib/progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { fonts } from "@/components/chrome/fonts";
import { NAV } from "@/components/chrome/nav";
import s from "./article.module.css";

/** In-text concept links: go to that concept, show its note on hover. */
export function ConceptLink({ node, children }: { node: LinkedNode; children: React.ReactNode }) {
  const { understood } = useUnderstood();
  const hydrated = useHydrated();
  const done = hydrated && understood.has(node.id);
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={150}
        closeDelay={80}
        render={<Link href={`/n/${node.id}`} transitionTypes={NAV.forward} className={s.clink} data-done={done || undefined} />}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent side="top" sideOffset={8} className={`${fonts} ${s.pop}`}>
        <b>{node.title}</b>
        <p>{node.note}</p>
        <span>
          {node.depth === "deep" ? "Deep" : "Short"} · {minutes(node.words)} min read{done ? " · understood" : ""}
        </span>
      </HoverCardContent>
    </HoverCard>
  );
}
