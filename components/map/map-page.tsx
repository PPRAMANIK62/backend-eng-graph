import "server-only";

import { cache, ViewTransition } from "react";
import { getGraph, getPhases } from "@/lib/content";
import { PAGE_VT } from "@/components/chrome/nav";
import { layoutPhase, wrap } from "./model";
import { ZoomMap, type Concept } from "./zoom-map";

/** Every written concept, with its title already split for a chip. */
export const getConcepts = cache((): Record<string, Concept> =>
  Object.fromEntries(getGraph().nodes.map(n => [n.id, { ...n, lines: wrap(n.title, 19) }])),
);

export function MapPage({ phase }: { phase: number }) {
  const map = layoutPhase(getGraph(), phase);
  return (
    <ViewTransition key={phase} enter={PAGE_VT} exit={PAGE_VT} default="none">
      <ZoomMap map={map} concepts={getConcepts()} phases={getPhases()} />
    </ViewTransition>
  );
}
