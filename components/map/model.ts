// Lays out one phase as a map: concepts left to right in reading order, a
// curve for every "needs", and stubs at the edges for links to other phases.
// Pure; runs at build time on the server.

import { type Graph, type NodeSummary, parentsOf, childrenOf } from "@/lib/graph";

export const CHIP = { w: 176, h: 56 };
const ALONG = 60; // gap between steps
const ACROSS = 16; // gap between concepts in a step
const PAD = 48;
const TOP = 36; // room for the step labels

export type MapNode = {
  id: string;
  x: number;
  y: number;
  level: number; // step within this phase, from 0
  before: string[]; // every prerequisite inside this phase, transitively
  unlocks: string[]; // direct dependents inside this phase
  trail: string[]; // one chain of prerequisites, first to read first, ending here
  stubsIn: string[]; // stubs (other phases) this node needs
  stubsOut: string[]; // stubs (other phases) that need this node
};

export type MapStub = { key: string; id: string; side: "in" | "out"; phase: number; x: number; y: number };

export type MapEdge = { key: string; from: string; to: string; d: string; cross: boolean };

export type PhaseMap = {
  phase: number;
  width: number;
  height: number;
  steps: { x: number; label: string }[];
  nodes: MapNode[];
  stubs: MapStub[];
  edges: MapEdge[];
};

export const stubKey = (side: "in" | "out", id: string) => `${side}:${id}`;
export const edgeKey = (from: string, to: string) => `${from}>${to}`;

export function layoutPhase(graph: Graph, phase: number): PhaseMap {
  const nodes = graph.nodes.filter(n => n.phase === phase);
  const here = new Set(nodes.map(n => n.id));
  const phaseOf = new Map(graph.nodes.map(n => [n.id, n.phase]));
  const inNeeds = new Map(nodes.map(n => [n.id, parentsOf(graph, n.id).filter(x => here.has(x))]));
  const inKids = new Map(nodes.map(n => [n.id, childrenOf(graph, n.id).filter(x => here.has(x))]));
  const crossIn = new Map(nodes.map(n => [n.id, parentsOf(graph, n.id).filter(x => !here.has(x))]));
  const crossOut = new Map(nodes.map(n => [n.id, childrenOf(graph, n.id).filter(x => !here.has(x))]));

  // Step: the longest chain of prerequisites inside the phase.
  const level = new Map<string, number>();
  const levelOf = (id: string, seen = new Set<string>()): number => {
    if (level.has(id)) return level.get(id)!;
    if (seen.has(id)) return 0; // a cycle in needs; stop rather than loop
    seen.add(id);
    const ps = inNeeds.get(id)!;
    const l = ps.length ? 1 + Math.max(...ps.map(p => levelOf(p, seen))) : 0;
    level.set(id, l);
    return l;
  };
  nodes.forEach(n => levelOf(n.id));
  const steps = nodes.length ? Math.max(...nodes.map(n => level.get(n.id)!)) + 1 : 0;

  const cols = orderColumns(nodes, steps, level, inNeeds, inKids);
  const stubsIn = [...new Set(nodes.flatMap(n => crossIn.get(n.id)!))];
  const stubsOut = [...new Set(nodes.flatMap(n => crossOut.get(n.id)!))];
  const all = [
    ...(stubsIn.length ? [stubsIn.map(id => stubKey("in", id))] : []),
    ...cols,
    ...(stubsOut.length ? [stubsOut.map(id => stubKey("out", id))] : []),
  ];

  // Place each column, centered on the tallest.
  const tallest = Math.max(1, ...all.map(c => c.length));
  const span = (k: number) => k * CHIP.h + (k - 1) * ACROSS;
  const pos = new Map<string, { x: number; y: number }>();
  all.forEach((col, i) => {
    const off = (span(tallest) - span(col.length)) / 2;
    col.forEach((key, j) => pos.set(key, { x: PAD + i * (CHIP.w + ALONG), y: PAD + TOP + off + j * (CHIP.h + ACROSS) }));
  });
  const width = PAD * 2 + all.length * CHIP.w + Math.max(0, all.length - 1) * ALONG;
  const height = PAD * 2 + TOP + span(tallest);

  const offset = stubsIn.length ? 1 : 0;
  const stepLabels = all.map((_, i) => ({
    x: PAD + i * (CHIP.w + ALONG),
    label: i < offset ? "Other phases" : i - offset >= steps ? "Later phases" : `Step ${i - offset + 1}`,
  }));

  const edges: MapEdge[] = [];
  const add = (a: string, b: string, cross: boolean) =>
    edges.push({ key: edgeKey(a, b), from: a, to: b, d: curve(pos.get(a)!, pos.get(b)!), cross });
  for (const n of nodes) {
    for (const m of inNeeds.get(n.id)!) add(m, n.id, false);
    for (const m of crossIn.get(n.id)!) add(stubKey("in", m), n.id, true);
    for (const c of crossOut.get(n.id)!) add(n.id, stubKey("out", c), true);
  }

  const before = (id: string, acc = new Set<string>()) => {
    for (const p of inNeeds.get(id)!) {
      if (acc.has(p)) continue;
      acc.add(p);
      before(p, acc);
    }
    return acc;
  };
  const trail = (id: string) => {
    const t = [id];
    for (let c = id; inNeeds.get(c)!.length;) {
      c = [...inNeeds.get(c)!].sort((a, b) => level.get(b)! - level.get(a)!)[0];
      t.unshift(c);
    }
    return t;
  };

  return {
    phase,
    width,
    height,
    steps: stepLabels,
    nodes: nodes.map(n => ({
      id: n.id,
      ...pos.get(n.id)!,
      level: level.get(n.id)!,
      before: [...before(n.id)],
      unlocks: inKids.get(n.id)!,
      trail: trail(n.id),
      stubsIn: crossIn.get(n.id)!.map(x => stubKey("in", x)),
      stubsOut: crossOut.get(n.id)!.map(x => stubKey("out", x)),
    })),
    stubs: [
      ...stubsIn.map(id => ({ key: stubKey("in", id), id, side: "in" as const, phase: phaseOf.get(id)!, ...pos.get(stubKey("in", id))! })),
      ...stubsOut.map(id => ({
        key: stubKey("out", id),
        id,
        side: "out" as const,
        phase: phaseOf.get(id)!,
        ...pos.get(stubKey("out", id))!,
      })),
    ],
    edges,
  };
}

/** Concepts per step, ordered to cut crossings: a few barycenter sweeps each way. */
function orderColumns(
  nodes: NodeSummary[],
  steps: number,
  level: Map<string, number>,
  inNeeds: Map<string, string[]>,
  inKids: Map<string, string[]>,
): string[][] {
  const cols: string[][] = Array.from({ length: steps }, () => []);
  for (const n of nodes) cols[level.get(n.id)!].push(n.id);
  const pos = new Map<string, number>();
  const update = () => cols.forEach(c => c.forEach((id, i) => pos.set(id, (i + 0.5) / c.length)));
  update();
  const mean = (ids: string[]) => (ids.length ? ids.reduce((s, x) => s + pos.get(x)!, 0) / ids.length : null);
  const sortBy = (col: string[], key: (id: string) => number | null) => {
    const k = new Map(col.map(id => [id, key(id) ?? pos.get(id)!]));
    col.sort((a, b) => k.get(a)! - k.get(b)!);
  };
  for (let sweep = 0; sweep < 8; sweep++) {
    for (let i = 1; i < cols.length; i++) {
      sortBy(cols[i], id => mean(inNeeds.get(id)!));
      update();
    }
    for (let i = cols.length - 2; i >= 0; i--) {
      sortBy(cols[i], id => mean(inKids.get(id)!));
      update();
    }
  }
  return cols;
}

const r = (v: number) => Math.round(v * 10) / 10;

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const sx = a.x + CHIP.w,
    sy = a.y + CHIP.h / 2,
    tx = b.x,
    ty = b.y + CHIP.h / 2;
  const d = Math.max((tx - sx) / 2, 24);
  return `M${r(sx)} ${r(sy)}C${r(sx + d)} ${r(sy)} ${r(tx - d)} ${r(ty)} ${r(tx)} ${r(ty)}`;
}

/**
 * Advance widths in hundredths of an em for ASCII 32 to 126, in Schibsted
 * Grotesk 500 (the chip font), measured with canvas measureText in Chromium.
 */
const ADVANCE =
  "24 25 37 67 57 87 69 21 32 32 43 63 27 48 29 45 62 36 58 58 60 59 60 54 59 60 29 28 63 63 63 54 90 71 65 71 71 59 57 72 73 37 55 68 55 89 74 77 63 77 65 62 66 69 69 95 67 63 61 32 45 32 63 50 50 56 60 56 60 58 35 56 58 25 28 57 27 88 59 60 60 60 42 52 35 59 57 83 57 56 51 34 25 34 63"
    .split(" ")
    .map(Number);

/** Width of `text` in ems at the chip font. */
function ems(text: string): number {
  let w = 0;
  for (const ch of text) w += (ADVANCE[ch.charCodeAt(0) - 32] ?? 60) / 100;
  return w;
}

/**
 * Split a title into at most `lines` lines no wider than `max` ems. Breaks
 * at spaces and after hyphens.
 */
export function wrap(text: string, max: number, lines = 2): string[] {
  const words = text.split(/\s+/).flatMap(w => w.split(/(?<=-)/));
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const joined = !line ? w : line.endsWith("-") ? line + w : `${line} ${w}`;
    if (line && ems(joined) > max) {
      out.push(line);
      line = w;
    } else line = joined;
  }
  if (line) out.push(line);
  if (out.length <= lines) return out;
  let last = out
    .slice(lines - 1)
    .join(" ")
    .replace(/- /g, "-");
  while (ems(`${last}…`) > max) last = last.slice(0, -1);
  return [...out.slice(0, lines - 1), `${last.trimEnd()}…`];
}
