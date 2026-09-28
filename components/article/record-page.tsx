import "server-only";

import { ViewTransition } from "react";
import Link from "next/link";
import { citingNodes, getGraph, getRecords, recordDir, type RecordDoc } from "@/lib/content";
import { phaseHref, type LinkedNode } from "@/lib/graph";
import { renderMarkdown } from "@/lib/markdown";
import { NAV, PAGE_VT } from "@/components/chrome/nav";
import { ArticleBar } from "./article-bar";
import { ConceptLink } from "./concept-link";
import s from "./article.module.css";

const LABEL = { experiments: "Experiment", decisions: "Decision" } as const;

/** An experiment write-up or a decision record, in the same reading layout as an article. */
export function RecordPage({ doc }: { doc: RecordDoc }) {
  const graph = getGraph();
  const linked = new Map<string, LinkedNode>(
    graph.nodes.map(n => [n.id, { id: n.id, title: n.title, note: n.note, depth: n.depth, words: n.words, readable: n.readable }]),
  );
  const content = renderMarkdown(doc.body, recordDir(doc.kind), linked, { Link: ConceptLink });
  const cited = citingNodes(doc.kind, doc.id);
  const number = doc.id.match(/^\d+/)?.[0];
  const items = graph.nodes.map(n => ({ id: n.id, title: n.title, note: n.note, phase: n.phase }));

  return (
    <ViewTransition key={doc.id} enter={PAGE_VT} exit={PAGE_VT} default="none">
      <div className={s.page}>
        <ArticleBar mapHref={phaseHref(doc.phase || 1)} phaseLabel={`${LABEL[doc.kind]} ${number ?? ""}`} items={items} phase={doc.phase} />
        <article className={s.article}>
          <header className={s.head}>
            <p className={s.trail}>
              {LABEL[doc.kind]} {number}
            </p>
            <h1 className={s.title}>{doc.title}</h1>
          </header>
          <aside className={s.rail} aria-label="About this record">
            <p className={s.meta}>
              <span>Phase {doc.phase}</span>
              {doc.about && <span>{doc.about}</span>}
            </p>
            {cited.length > 0 && (
              <div className={s.rel}>
                <div className={s.relRow} data-tone="need">
                  <span className={s.relLabel}>Cited in</span>
                  <span className={s.relChips}>
                    {cited.map(n => (
                      <Link key={n.id} href={`/n/${n.id}`} transitionTypes={NAV.back} className={s.relChip}>
                        {n.title}
                      </Link>
                    ))}
                  </span>
                </div>
              </div>
            )}
          </aside>
          <div className={s.prose}>{content}</div>
        </article>
      </div>
    </ViewTransition>
  );
}

export function recordParams(kind: RecordDoc["kind"]) {
  return getRecords(kind).map(d => ({ id: d.id }));
}
