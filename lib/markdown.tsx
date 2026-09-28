import "server-only";

import fs from "node:fs";
import path from "node:path";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import { visit, SKIP } from "unist-util-visit";
import type { Root as MdRoot, PhrasingContent, Link } from "mdast";
import type { Root as HastRoot } from "hast";
import NextLink from "next/link";
import type { LinkedNode } from "./graph";
import { scopeFigure } from "./figure";

/** Links between content files (../../experiments/0001-x.md) become site paths (/experiments/0001-x). */
function siteHref(href: string | undefined): string | undefined {
  if (!href || /^[a-z]+:/i.test(href) || href.startsWith("#")) return href;
  const rec = href.match(/(?:^|\/)(experiments|decisions)\/([a-z0-9-]+)\.md(#.*)?$/);
  if (rec) return `/${rec[1]}/${rec[2]}${rec[3] ?? ""}`;
  const node = href.match(/(?:^|\/)nodes\/phase-\d+\/([a-z0-9-]+)\.md(#.*)?$/);
  if (node) return `/n/${node[1]}${node[2] ?? ""}`;
  return href;
}

const WIKILINK = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

/** [[id]] and [[id|words]] become links to /n/id, marked so the renderer can add a hover card. */
function remarkWikilinks() {
  return (tree: MdRoot) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined || !node.value.includes("[[")) return;
      const parts: PhrasingContent[] = [];
      let last = 0;
      for (const m of node.value.matchAll(WIKILINK)) {
        if (m.index! > last) parts.push({ type: "text", value: node.value.slice(last, m.index) });
        const link: Link = {
          type: "link",
          url: `/n/${m[1]}`,
          children: [{ type: "text", value: m[2] ?? m[1].replaceAll("-", " ") }],
          data: { hProperties: { "data-node": m[1] } },
        };
        parts.push(link);
        last = m.index! + m[0].length;
      }
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });
  };
}

/** Drop authoring comments and the h1 (the page renders the title). */
function remarkSiteShape() {
  return (tree: MdRoot) => {
    tree.children = tree.children.filter(n => !(n.type === "html" && n.value.trim().startsWith("<!--")));
    const h1 = tree.children.findIndex(n => n.type === "heading" && n.depth === 1);
    if (h1 !== -1) tree.children.splice(h1, 1);
  };
}

/** A paragraph holding only an image becomes a figure; an italic paragraph right after it is its caption. */
function rehypeFigures() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) return;
      const kids = node.children.filter(c => !(c.type === "text" && !c.value.trim()));
      if (kids.length !== 1 || kids[0].type !== "element" || kids[0].tagName !== "img") return;
      node.tagName = "figure";
      node.children = [kids[0]];
      // The next element sibling, skipping whitespace text.
      let j = index + 1;
      while (j < parent.children.length && parent.children[j].type === "text") j++;
      const next = parent.children[j];
      if (next?.type !== "element" || next.tagName !== "p") return;
      const inner = next.children.filter(c => !(c.type === "text" && !c.value.trim()));
      if (inner.length === 1 && inner[0].type === "element" && inner[0].tagName === "em") {
        node.children.push({ type: "element", tagName: "figcaption", properties: {}, children: inner[0].children });
        parent.children.splice(index + 1, j - index);
      }
    });
  };
}

/** How an in-text concept link renders. Defaults to a plain link to the concept's page. */
export type ConceptLink = React.ComponentType<{ node: LinkedNode; children: React.ReactNode }>;

export function renderMarkdown(body: string, imgDir: string, nodes: Map<string, LinkedNode>, options: { Link?: ConceptLink } = {}) {
  const Concept = options.Link ?? PlainConceptLink;
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks)
    .use(remarkSiteShape)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeFigures);
  const hast = processor.runSync(processor.parse(body)) as HastRoot;

  let figures = 0;
  const components: Partial<Components> = {
    a: ({ href, children, ...rest }) => {
      const id = (rest as Record<string, unknown>)["data-node"] as string | undefined;
      const node = id ? nodes.get(id) : undefined;
      if (id && node) return <Concept node={node}>{children}</Concept>;
      if (id) return <span>{children}</span>; // a planned concept: no page to link to yet
      const to = siteHref(href);
      if (to?.startsWith("/")) return <NextLink href={to}>{children}</NextLink>;
      const external = to?.startsWith("http");
      return (
        <a href={to} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => {
      const file = typeof src === "string" && src.startsWith("img/") ? path.join(imgDir, src) : null;
      if (file?.endsWith(".svg") && fs.existsSync(file)) {
        const key = `fig-${path.basename(file, ".svg")}-${figures++}`;
        return (
          <span className="figure-svg" dangerouslySetInnerHTML={{ __html: scopeFigure(fs.readFileSync(file, "utf8"), key, alt ?? "") }} />
        );
      }
      // oxlint-disable-next-line nextjs/no-img-element -- figures are inlined above; this is the fallback for other images
      return <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />;
    },
  };

  return toJsxRuntime(hast, { Fragment, jsx, jsxs, components });
}

function PlainConceptLink({ node, children }: { node: LinkedNode; children: React.ReactNode }) {
  return <NextLink href={`/n/${node.id}`}>{children}</NextLink>;
}
