---
id: 0004-site-app
title: Build the site on ai-eng-graph's stack, with a zoom map instead of a metro map
phase: 1
status: decided
date: 2026-09-28
replaced_by:
---

## What I had to decide

How this graph gets on the web. `CLAUDE.md` said the site would reuse
ai-eng-graph's app once the first node was written. Phase 1 is written, so
the question was how much to reuse: the whole app with its metro map, or
the stack with a different way to move through the graph.

## Options

- **Copy ai-eng-graph's app as it is.** Next.js 16, the metro map with
  lines and trips, Motion for animation. The least work, but its map shows
  every zone's lines and stations at once, and a trip is planned in a side
  card rather than seen on the graph.
- **Same stack, a new map.** Keep Next.js, React 19, Tailwind, shadcn with
  Base UI, next-themes, d3-zoom and the markdown pipeline, and draw a
  different map: one phase per screen, concepts left to right in reading
  order, every "needs" drawn as a line.
- **A static site generator** (Astro or similar). Already turned down for
  ai-eng-graph in its decision 0001, for reasons that apply here too.

## What I measured

Nothing was benchmarked. The map design was chosen by building throwaway
HTML and CSS prototypes on 2026-09-28 and comparing them in the browser:
a reading-order board, a card catalog, a lens, a drawer laid out as a
graph, a card lens, and a zoom map. The first three were rejected because
none of them drew the links between concepts. The zoom map was picked
over the other two. The prototypes were deleted once the app replaced them.

## What I picked and why

Same stack, new map. The home page is phase 1 as a full-screen map; other
phases get `/phase/N` once they have written nodes. Clicking a concept
flies the camera to it, draws its prerequisite chain in amber and what it
unlocks in teal, and opens a reading panel. The concept lives in the URL
hash, so the browser's back and forward buttons retrace the path. Articles
are at `/n/<id>`, and experiment and decision records at
`/experiments/<id>` and `/decisions/<id>`.

Two changes from ai-eng-graph:

- **No Motion library.** Every animation is CSS: transitions on the map,
  keyframes for panels, and the browser's view transitions between pages.
  The camera flight is a CSS transition on the map's transform, and d3-zoom
  only handles dragging and zooming by hand.
- **oxlint and oxfmt instead of ESLint.** Faster, and one tool each for
  linting and formatting.

Figures are inlined into the page as in ai-eng-graph, but each one gets its
own style scope, so their short class names don't leak and their dark
colours follow the site's theme switch instead of only the system setting.

## What I gave up

ai-eng-graph's trips (a planned route through several lines) and its
reading-order badges. The zoom map shows one concept's chain at a time
instead. Planned nodes don't appear on the map at all, as `CLAUDE.md`
says, so the map only shows what's written. On phones the whole-phase
overview is small; you pinch or tap to zoom in. If the map gets crowded as
phases grow, the layout is the first thing to look at again.
