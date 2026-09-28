// The graph as the site sees it. Pure data and helpers, safe on server and client.

export type Depth = "deep" | "short";

export type NodeSummary = {
  id: string;
  title: string;
  note: string;
  depth: Depth;
  phase: number;
  updated: string;
  words: number;
  /** Written, so it has a page. A planned node (headings and template comments only) stays off the site. */
  readable: boolean;
};

/** What an in-text concept link needs to know about its target. */
export type LinkedNode = { id: string; title: string; note: string; depth: Depth; words: number; readable: boolean };

/** "a needs b" is stored as { source: b, target: a }: read the source first. */
export type Edge = { source: string; target: string };

export type Graph = { nodes: NodeSummary[]; edges: Edge[] };

export type PhaseInfo = { n: number; title: string; short: string; concepts: number };

export function parentsOf(graph: Graph, id: string): string[] {
  return graph.edges.filter(e => e.target === id).map(e => e.source);
}

export function childrenOf(graph: Graph, id: string): string[] {
  return graph.edges.filter(e => e.source === id).map(e => e.target);
}

export const WPM = 230;
export const minutes = (words: number) => Math.max(1, Math.round(words / WPM));

export const phaseHref = (phase: number) => (phase === 1 ? "/" : `/phase/${phase}`);
