/**
 * Check content/nodes/ and content/sources/ against the rules in WRITING.md.
 *
 * Errors (exit 1):
 *   - id doesn't match the file name, or a node isn't in nodes/phase-N/ for its phase
 *   - missing or invalid frontmatter fields
 *   - a graph link or inline [[link]] points to a node that doesn't exist
 *     (inline links are also checked in decisions/ and experiments/)
 *   - leads_to / needs aren't mirrored, compare_with isn't mirrored
 *   - a link under Further reading matches no source note's url
 *   - a node still has a status field (a node is planned until its body has text,
 *     and whatever is committed is published)
 *   - a written node lists no sources under Further reading
 *   - an image link ![..](img/..) points to a file that doesn't exist
 * Warnings:
 *   - a [@citation] marker in the body instead of under Further reading
 *   - a source no node cites
 *   - an orphan: a node that links nowhere, or that nothing links to
 *   - a written node doesn't link something it needs in the text
 *   - a node is past its depth's word limit (may be two concepts)
 *   - a written deep node cites fewer than 3 sources
 *   - a written node hasn't been updated in 12 months
 *   - a written node still has a VISUAL: comment that was never drawn
 *   - an image in nodes/phase-N/img/ that no node uses
 *
 * Usage:
 *   bun scripts/check.ts          run the checks   (or: bun run check)
 *   bun scripts/check.ts --map    print the graph by phase, then run the checks
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const CONTENT = join(ROOT, "content");
const NODES = join(CONTENT, "nodes");
const SOURCES = join(CONTENT, "sources");
const LINKING_DIRS = ["decisions", "experiments"]; // [[links]] here must resolve too

const DEPTHS: Record<string, number> = { deep: 2500, short: 1000 }; // depth -> word limit
const KINDS = ["blog", "book", "code", "docs", "paper", "spec", "talk"];
const LINK_FIELDS = ["needs", "leads_to", "compare_with"] as const;
const STALE_DAYS = 365;
const DEEP_MIN_SOURCES = 3;

const CITATION = /\[@([a-z0-9-]+)(?:,[^\]]*)?\]/g;
const LINK = /\]\((https?:\/\/[^)\s]+)\)/g;
const WIKILINK = /\[\[([a-z0-9-]+)(?:\|[^\]]*)?\]\]/g;
const COMMENT = /<!--[\s\S]*?-->/g;
const IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g;
const VISUAL = /<!--\s*VISUAL:/g;
const HEADING = /^#.*$/gm;

type Value = string | string[];
type Meta = Record<string, Value>;

type Node = {
  meta: Meta;
  written: boolean; // has text beyond headings; a planned node doesn't
  needs: string[];
  leads_to: string[];
  compare_with: string[];
  readingUrls: string[];
  bodyCites: Set<string>;
  links: Set<string>;
  images: string[]; // absolute paths
  visualsTodo: number;
  words: number;
  where: string;
  cites: Set<string>;
};

const all = (re: RegExp, text: string) => [...text.matchAll(re)].map(m => m[1]);
const str = (v: Value | undefined) => (typeof v === "string" ? v : "");
const pyList = (xs: string[]) => `[${xs.map(x => `'${x}'`).join(", ")}]`;
const shown = (v: Value | undefined) => (v === undefined ? "None" : Array.isArray(v) ? pyList(v) : v);

/** Return [frontmatter, body]. Handles the flat YAML the templates use. */
function parse(path: string): [Meta | null, string] {
  const text = readFileSync(path, "utf8");
  if (!text.startsWith("---\n")) return [null, text];
  const end = text.indexOf("\n---", 4);
  if (end === -1) return [null, text];
  const raw = text.slice(4, end);
  const body = text.slice(end + 4);
  const meta: Meta = {};
  let key: string | null = null;
  for (const line of raw.split(/\r?\n/)) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && key) {
      meta[key] = `${str(meta[key])} ${line.trim()}`.trim();
      continue;
    }
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    key = m[1];
    const value = m[2].replace(/\s+#.*$/, "").trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      meta[key] = value
        .slice(1, -1)
        .split(",")
        .map(v => v.trim())
        .filter(Boolean);
    } else if ([">-", ">", "|", "|-"].includes(value)) {
      meta[key] = "";
    } else {
      meta[key] = value;
    }
  }
  return [meta, body];
}

const cleanUrl = (url: string) => url.trim().replace(/\/+$/, "").toLowerCase();

const mdFiles = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter(f => f.endsWith(".md"))
        .sort()
    : [];

/** Every .md under dir, any depth, sorted by path. */
function walkMd(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkMd(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out.sort();
}

function loadSources(errors: string[]): Map<string, Meta> {
  const sources = new Map<string, Meta>();
  for (const name of mdFiles(SOURCES)) {
    if (name.startsWith("_")) continue; // working lists like _candidates.md, not source notes
    const stem = basename(name, ".md");
    const [meta] = parse(join(SOURCES, name));
    const where = `content/sources/${name}`;
    if (meta === null) {
      errors.push(`${where}: no frontmatter`);
      continue;
    }
    if (meta.id !== stem) errors.push(`${where}: id '${shown(meta.id)}' should be '${stem}'`);
    for (const field of ["title", "author", "url", "accessed"]) if (!meta[field]?.length) errors.push(`${where}: missing ${field}`);
    if (!KINDS.includes(str(meta.kind))) errors.push(`${where}: kind must be one of ${pyList(KINDS)}`);
    sources.set(stem, meta);
  }
  return sources;
}

function loadNodes(errors: string[]): Map<string, Node> {
  const nodes = new Map<string, Node>();
  for (const path of walkMd(NODES)) {
    const [meta, body] = parse(path);
    const stem = basename(path, ".md");
    const where = relative(ROOT, path);
    if (meta === null) {
      errors.push(`${where}: no frontmatter`);
      continue;
    }
    if (meta.id !== stem) errors.push(`${where}: id '${shown(meta.id)}' should be '${stem}'`);
    for (const field of ["title", "note", "phase"]) if (!meta[field]?.length) errors.push(`${where}: missing ${field}`);
    const parent = basename(dirname(path));
    if (parent !== `phase-${shown(meta.phase)}`)
      errors.push(`${where}: phase ${shown(meta.phase)} but file is in ${parent}/, move it to content/nodes/phase-${shown(meta.phase)}/`);
    if (nodes.has(stem)) errors.push(`${where}: id '${stem}' also used by ${nodes.get(stem)!.where}`);
    if (!(str(meta.depth) in DEPTHS)) errors.push(`${where}: depth must be one of ${pyList(Object.keys(DEPTHS).sort())}`);
    if (meta.status !== undefined)
      errors.push(`${where}: remove status; a node is planned until its body has text, and committed means published`);
    const links: Record<(typeof LINK_FIELDS)[number], string[]> = { needs: [], leads_to: [], compare_with: [] };
    for (const field of LINK_FIELDS) {
      const v = meta[field];
      if (v !== undefined && !Array.isArray(v)) errors.push(`${where}: ${field} must be a list like [a, b]`);
      else links[field] = v ?? [];
    }
    const text = body.replace(COMMENT, "");
    const cut = text.indexOf("## Further reading");
    const bodyText = cut === -1 ? text : text.slice(0, cut);
    const reading = cut === -1 ? "" : text.slice(cut + "## Further reading".length);
    nodes.set(stem, {
      meta,
      written: /\S/.test(text.replace(HEADING, "")),
      ...links,
      readingUrls: all(LINK, reading),
      bodyCites: new Set(all(CITATION, bodyText)),
      links: new Set(all(WIKILINK, text)),
      images: all(IMAGE, text)
        .filter(src => !src.startsWith("http"))
        .map(src => resolve(dirname(path), src)),
      visualsTodo: (body.match(VISUAL) ?? []).length,
      words: text.replace(IMAGE, "").split(/\s+/).filter(Boolean).length, // alt text isn't article prose
      where,
      cites: new Set(),
    });
  }
  return nodes;
}

function checkNode(nid: string, n: Node, nodes: Map<string, Node>, sources: Map<string, Meta>, errors: string[], warnings: string[]) {
  const { where } = n;

  for (const field of LINK_FIELDS)
    for (const target of n[field]) if (!nodes.has(target)) errors.push(`${where}: ${field} -> '${target}' has no node file`);
  for (const target of n.leads_to)
    if (nodes.has(target) && !nodes.get(target)!.needs.includes(nid))
      errors.push(`${where}: leads_to '${target}', but ${target} doesn't list '${nid}' in needs`);
  for (const target of n.needs)
    if (nodes.has(target) && !nodes.get(target)!.leads_to.includes(nid))
      errors.push(`${where}: needs '${target}', but ${target} doesn't list '${nid}' in leads_to`);
  for (const target of n.compare_with)
    if (nodes.has(target) && !nodes.get(target)!.compare_with.includes(nid))
      errors.push(`${where}: compare_with '${target}' isn't mirrored in ${target}`);
  for (const target of [...n.links].sort())
    if (!nodes.has(target)) errors.push(`${where}: links [[${target}]], but no node '${target}' exists`);

  const byUrl = new Map([...sources].map(([sid, m]) => [cleanUrl(str(m.url)), sid]));
  for (const url of n.readingUrls) {
    const sid = byUrl.get(cleanUrl(url));
    if (sid) n.cites.add(sid);
    else errors.push(`${where}: Further reading links ${url}, but no note in sources/ has that url`);
  }
  if (n.bodyCites.size)
    warnings.push(
      `${where}: citation markers in the body (${[...n.bodyCites].sort().join(", ")}); list sources only under Further reading`,
    );
  if (n.written) {
    if (!n.cites.size) errors.push(`${where}: written but no sources under Further reading`);
    else if (n.meta.depth === "deep" && n.cites.size < DEEP_MIN_SOURCES)
      warnings.push(`${where}: deep node cites ${n.cites.size} sources, expected ${DEEP_MIN_SOURCES}+`);
  }

  if (n.written)
    for (const target of n.needs)
      if (!n.links.has(target)) warnings.push(`${where}: needs '${target}' but never links [[${target}]] in the text`);
  for (const img of n.images)
    if (!existsSync(img) || !statSync(img).isFile())
      errors.push(`${where}: image ${relative(ROOT, img)} doesn't exist (build it with visuals/build.ts)`);
  if (n.written && n.visualsTodo) warnings.push(`${where}: ${n.visualsTodo} VISUAL: comment(s) not drawn yet`);

  const limit = DEPTHS[str(n.meta.depth)];
  if (limit && n.words > limit) warnings.push(`${where}: ${n.words} words, over ${limit} for ${n.meta.depth}, may be two concepts`);

  if (n.written) {
    const updated = str(n.meta.updated);
    const day = /^\d{4}-\d{2}-\d{2}$/.test(updated) ? new Date(`${updated}T00:00:00`) : null;
    if (!day || isNaN(day.getTime())) errors.push(`${where}: updated must be a date like 2026-09-23`);
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const age = Math.round((today.getTime() - day.getTime()) / 86_400_000);
      if (age > STALE_DAYS) warnings.push(`${where}: not updated in ${age} days, re-check it`);
    }
  }
}

function outgoing(n: Node, nodes: Map<string, Node>): Set<string> {
  const targets = new Set([...n.needs, ...n.leads_to, ...n.compare_with, ...n.links]);
  return new Set([...targets].filter(t => nodes.has(t)));
}

function printMap(nodes: Map<string, Node>) {
  const byPhase = new Map<string, string[]>();
  for (const [nid, n] of nodes) {
    const phase = str(n.meta.phase) || "?";
    byPhase.set(phase, [...(byPhase.get(phase) ?? []), nid]);
  }
  for (const phase of [...byPhase.keys()].sort()) {
    console.log(`\nPhase ${phase}`);
    const ids = byPhase.get(phase)!.sort((a, b) => nodes.get(a)!.needs.length - nodes.get(b)!.needs.length || (a < b ? -1 : a > b ? 1 : 0));
    for (const nid of ids) {
      const n = nodes.get(nid)!;
      console.log(`  ${nid}  [${str(n.meta.depth) || "?"}, ${n.written ? "written" : "planned"}]`);
      console.log(`      ${str(n.meta.note)}`);
      for (const field of LINK_FIELDS) if (n[field].length) console.log(`      ${field}: ${n[field].join(", ")}`);
    }
  }
  console.log();
}

function main(): number {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sources = loadSources(errors);
  const nodes = loadNodes(errors);

  if (process.argv.includes("--map")) printMap(nodes);

  const cited = new Set<string>();
  const incoming = new Map([...nodes.keys()].map(nid => [nid, new Set<string>()]));
  for (const [nid, n] of nodes) {
    checkNode(nid, n, nodes, sources, errors, warnings);
    n.cites.forEach(s => cited.add(s));
    for (const target of outgoing(n, nodes)) incoming.get(target)!.add(nid);
  }

  if (nodes.size > 1)
    for (const [nid, n] of nodes) {
      if (!outgoing(n, nodes).size) warnings.push(`${n.where}: orphan, links to no other node`);
      if (!incoming.get(nid)!.size) warnings.push(`${n.where}: orphan, no node links to it`);
    }
  for (const folder of LINKING_DIRS)
    for (const name of mdFiles(join(CONTENT, folder))) {
      const text = readFileSync(join(CONTENT, folder, name), "utf8").replace(COMMENT, "");
      for (const target of [...new Set(all(WIKILINK, text))].sort())
        if (!nodes.has(target)) errors.push(`content/${folder}/${name}: links [[${target}]], but no node '${target}' exists`);
    }

  const used = new Set([...nodes.values()].flatMap(n => n.images));
  for (const phase of readdirSync(NODES)
    .filter(d => d.startsWith("phase-"))
    .sort()) {
    const imgDir = join(NODES, phase, "img");
    if (!existsSync(imgDir)) continue;
    for (const name of readdirSync(imgDir).sort()) {
      const img = join(imgDir, name);
      if (!used.has(img)) warnings.push(`${relative(ROOT, img)}: image not used by any node`);
    }
  }

  for (const sid of sources.keys()) if (!cited.has(sid)) warnings.push(`sources/${sid}.md: not cited by any node yet`);

  for (const w of warnings) console.log(`warn  ${w}`);
  for (const e of errors) console.log(`error ${e}`);
  console.log(`${nodes.size} nodes, ${sources.size} sources, ${errors.length} errors, ${warnings.length} warnings`);
  return errors.length ? 1 : 0;
}

process.exit(main());
