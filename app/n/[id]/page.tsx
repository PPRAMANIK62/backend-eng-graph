import { ViewTransition } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGraph, getNodeBody, getPhases, imageDir } from "@/lib/content";
import { minutes, phaseHref, type LinkedNode } from "@/lib/graph";
import { renderMarkdown } from "@/lib/markdown";
import { layoutPhase } from "@/components/map/model";
import { ArticleBar } from "@/components/article/article-bar";
import { ArticleEnd } from "@/components/article/article-end";
import { ConceptLink } from "@/components/article/concept-link";
import { MORPH_VT, NAV, PAGE_VT } from "@/components/chrome/nav";
import s from "@/components/article/article.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGraph().nodes.map(n => ({ id: n.id }));
}

export async function generateMetadata({ params }: PageProps<"/n/[id]">): Promise<Metadata> {
  const { id } = await params;
  const n = getGraph().nodes.find(x => x.id === id);
  return n ? { title: n.title, description: n.note } : {};
}

export default async function ArticlePage({ params }: PageProps<"/n/[id]">) {
  const { id } = await params;
  const graph = getGraph();
  const node = graph.nodes.find(n => n.id === id);
  const source = getNodeBody(id);
  if (!node || !source) notFound();

  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const phase = getPhases().find(p => p.n === node.phase)!;
  const laid = layoutPhase(graph, node.phase).nodes;
  const place = laid.find(n => n.id === id)!;
  const steps = Math.max(...laid.map(n => n.level)) + 1;
  const needs = graph.edges.filter(e => e.target === id).map(e => byId.get(e.source)!);
  const unlocks = graph.edges.filter(e => e.source === id).map(e => byId.get(e.target)!);
  const linked = new Map<string, LinkedNode>(
    graph.nodes.map(n => [n.id, { id: n.id, title: n.title, note: n.note, depth: n.depth, words: n.words, readable: n.readable }]),
  );
  const content = renderMarkdown(source.body, imageDir(source.phase), linked, { Link: ConceptLink });
  const mapHref = `${phaseHref(node.phase)}#${id}`;
  const items = graph.nodes.map(n => ({ id: n.id, title: n.title, note: n.note, phase: n.phase }));

  return (
    <ViewTransition key={id} enter={PAGE_VT} exit={PAGE_VT} default="none">
      <div className={s.page}>
        <ArticleBar mapHref={mapHref} phaseLabel={`Phase ${phase.n} · ${phase.short}`} items={items} phase={node.phase} />
        <article className={s.article}>
          <header className={s.head}>
            {place.trail.length > 1 && (
              <p className={s.trail} aria-label="One way in">
                {place.trail.slice(0, -1).map(t => (
                  <span key={t}>
                    <Link href={`/n/${t}`} transitionTypes={NAV.back}>
                      {byId.get(t)!.title}
                    </Link>
                    <span className={s.arr}>›</span>
                  </span>
                ))}
                <b>{node.title}</b>
              </p>
            )}
            <ViewTransition name={`title-${id}`} share={MORPH_VT} default="none">
              <h1 className={s.title}>{node.title}</h1>
            </ViewTransition>
            <p className={s.lede}>{node.note}</p>
          </header>
          <aside className={s.rail} aria-label="About this concept">
            <p className={s.meta}>
              <span>{node.depth === "deep" ? "Deep read" : "Short read"}</span>
              <span>{minutes(node.words)} min</span>
              <span>
                Step {place.level + 1} of {steps} in phase {phase.n}
              </span>
              <span>Updated {node.updated}</span>
            </p>
            {(needs.length > 0 || unlocks.length > 0) && (
              <div className={s.rel}>
                <RelRow tone="need" label="Needs" items={needs} here={node.phase} />
                <RelRow tone="lead" label="Unlocks" items={unlocks} here={node.phase} />
              </div>
            )}
          </aside>
          <div className={s.prose}>{content}</div>
          <ArticleEnd id={id} mapHref={mapHref} next={unlocks.map(n => ({ id: n.id, title: n.title, note: n.note, words: n.words }))} />
        </article>
      </div>
    </ViewTransition>
  );
}

function RelRow({
  tone,
  label,
  items,
  here,
}: {
  tone: "need" | "lead";
  label: string;
  items: { id: string; title: string; phase: number }[];
  here: number;
}) {
  if (!items.length) return null;
  return (
    <div className={s.relRow} data-tone={tone}>
      <span className={s.relLabel}>{label}</span>
      <span className={s.relChips}>
        {items.map(n => (
          <Link key={n.id} href={`/n/${n.id}`} transitionTypes={tone === "need" ? NAV.back : NAV.forward} className={s.relChip}>
            {n.title}
            {n.phase !== here && <em>phase {n.phase}</em>}
          </Link>
        ))}
      </span>
    </div>
  );
}
