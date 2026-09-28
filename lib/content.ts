import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type { Depth, Edge, Graph, NodeSummary, PhaseInfo } from "./graph";

// Reads content/ and PLAN.md at build time. scripts/check.ts is what validates
// content; this only trusts the shape check.ts enforces.

const ROOT = process.cwd();
const NODES_DIR = path.join(ROOT, "content", "nodes");

const COMMENT = /<!--[\s\S]*?-->/g;
const IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
const HEADING = /^#.*$/gm;

type RawNode = NodeSummary & { needs: string[]; leadsTo: string[]; body: string };

const loadRaw = cache((): Map<string, RawNode> => {
  const nodes = new Map<string, RawNode>();
  for (const phaseDir of fs.readdirSync(NODES_DIR)) {
    const dir = path.join(NODES_DIR, phaseDir);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".md"))) {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const text = content.replace(COMMENT, "");
      nodes.set(data.id, {
        id: data.id,
        title: data.title,
        note: data.note,
        depth: data.depth as Depth,
        phase: Number(data.phase),
        words: text.replace(IMAGE, "").split(/\s+/).filter(Boolean).length,
        readable: /\S/.test(text.replace(HEADING, "")),
        needs: data.needs ?? [],
        leadsTo: data.leads_to ?? [],
        body: content,
      });
    }
  }
  return nodes;
});

/** Written nodes only, and the needs edges between them. Planned nodes stay off the site. */
export const getGraph = cache((): Graph => {
  const raw = [...loadRaw().values()].filter(n => n.readable);
  const has = new Set(raw.map(n => n.id));
  const edges = new Map<string, Edge>();
  for (const n of raw) {
    for (const a of n.needs.filter(x => has.has(x))) edges.set(`${a}>${n.id}`, { source: a, target: n.id });
    for (const b of n.leadsTo.filter(x => has.has(x))) edges.set(`${n.id}>${b}`, { source: n.id, target: b });
  }
  const nodes: NodeSummary[] = raw
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ id, title, note, depth, phase, words, readable }) => ({ id, title, note, depth, phase, words, readable }));
  return { nodes, edges: [...edges.values()] };
});

/** Where a phase's figures live: content/nodes/phase-N/img/. */
export const imageDir = (phase: number) => path.join(NODES_DIR, `phase-${phase}`);
export const recordDir = (kind: RecordKind) => path.join(ROOT, "content", kind);

export function getNodeBody(id: string): { phase: number; body: string } | null {
  const n = loadRaw().get(id);
  return n?.readable ? { phase: n.phase, body: n.body } : null;
}

/** Phase names come from PLAN.md, the one place they live. */
export const getPhases = cache((): PhaseInfo[] => {
  const plan = fs.readFileSync(path.join(ROOT, "PLAN.md"), "utf8");
  const graph = getGraph();
  return [...plan.matchAll(/^### Phase (\d+): (.+)$/gm)].map(m => {
    const n = Number(m[1]);
    return { n, title: m[2].trim(), short: m[2].split(/[,:]/)[0].trim(), concepts: graph.nodes.filter(x => x.phase === n).length };
  });
});

export type RecordKind = "experiments" | "decisions";
export type RecordDoc = { kind: RecordKind; id: string; title: string; phase: number; about: string; body: string };

/** Experiment write-ups and decision records: one page each on the site. */
export const getRecords = cache((kind: RecordKind): RecordDoc[] => {
  const dir = recordDir(kind);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".md") && !f.startsWith("_"))
    .sort()
    .map(f => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      return {
        kind,
        id: String(data.id ?? f.slice(0, -3)),
        title: String(data.title ?? ""),
        phase: Number(data.phase),
        about: String(kind === "experiments" ? (data.component ?? "") : (data.status ?? "")),
        body: content,
      };
    });
});

/** Written concepts whose text links to a record, for "cited in". */
export function citingNodes(kind: RecordKind, id: string): NodeSummary[] {
  const raw = loadRaw();
  return getGraph().nodes.filter(n => raw.get(n.id)!.body.includes(`${kind}/${id}.md`));
}
