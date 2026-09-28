# Workspace rules

This folder is my path to being a strong backend engineer: a learning
resource on backend and distributed systems, with a research article for
every concept in a knowledge graph, and a lab where each phase builds one
real component from scratch, proven by a harness and measured against the
production system it imitates. Read `PLAN.md` for the why and the concepts
per phase, `LAB.md` for what gets built each phase, and `WRITING.md` for how
articles are written and linked.

## Hard rules

- Stay inside this directory. Don't read, write, or reference files outside
  it, including parent and sibling folders and agent memory. Keep notes and
  state here.
- Backend and distributed systems only. AI engineering is handled
  elsewhere, not in this folder.
- One concept per node. Not a whole topic, not half a concept. Each node is
  `deep` or `short`. Sizing rules are in `WRITING.md`.
- You write the articles, built only from source notes in `content/sources/`. I
  review them. Committing publishes, so don't commit anything until I say so.
- Never claim an experiment, measurement or build that didn't happen. No
  number goes in an article, experiment or decision unless a run produced
  it, and the run's setup is written down.
- Never cite from memory. Every citation points to a file in `content/sources/`, and
  every source file comes from a page you actually opened. If you can't open
  it, say so and don't cite it.
- Quotes stay short (a sentence or two). No full copies of anyone's article
  or book. Diagrams get redrawn and credited, not copied.
- Plain language everywhere, in articles and in replies. No bookish tone, no
  AI filler words. See the style section in `WRITING.md`.
- I'm new to most of this. Explain lab work as you go, and don't skip the
  reading to get to the build.
- No calendar dates anywhere: not in articles, notes, frontmatter, docs,
  data, file names or commit messages. A year that is part of a fact
  ("RFC 9293 (2022)", "Linux 4.13 (2017)") is fine; pin stale things to
  a version instead of a day. `bun run check` rejects dates in `content/`.
- Don't publish secrets. Keys go in environment variables, never in this
  folder's files.

## Folder layout

```
PLAN.md                 why, the 15 skills, the concepts per phase
LAB.md                  what gets built per phase: component, harness,
                        comparison, done-when
WRITING.md              how articles are sized, written, cited and linked
tentative-shape.md      first guess at every node; node files win once they exist
content/templates/      node, source, decision, experiment; copy these
content/nodes/          one article per concept (content/nodes/phase-N/<id>.md);
                        figures in content/nodes/phase-N/img/
content/sources/        one note per source (<id>.md); files starting with _
                        are working lists (e.g. _candidates.md), not notes
content/decisions/      one record per real build choice (<id>.md)
content/experiments/    one write-up per harness run or benchmark (<id>.md)
lab/                    the builds, one directory per component (see LAB.md)
scripts/check.ts        checks citations, quotes, links, orphans, size, dates
                        (bun run check; bun run check --map prints the graph)
app/, components/, lib/ the site (Next.js; see decision 0004-site-app)
```

The site reads `content/` and `PLAN.md` at build time: `bun dev`, `bun run
build`. A planned node (headings and template comments only) stays off the
site. There's no status field. Motion is CSS only (no Motion library). Lint
with `bun run lint` (oxlint), format with `bun run format` (oxfmt).

## The phase loop

Every phase runs these steps, in order. Nothing else.

1. **Start.** Read the phase in `PLAN.md` and `LAB.md`.
2. **Check the tentative shape.** Read the phase's table in
   `tentative-shape.md`.
3. **Suggest changes.** Compare it with what the written nodes already cover
   (grep them for the phase's topics), and with what the phase's build in
   `LAB.md` needs. Propose splits, merges, depth changes, moves between
   phases and new nodes. Tell me, then update `tentative-shape.md` and
   `PLAN.md`.
4. **Check sources.** Read the phase's section of
   `content/sources/_candidates.md`. If it's empty, research it first:
   open every candidate, and record what you saw, like the header of that
   file says. Every node needs enough candidates (3 to 6 for `deep`, 1 or
   2 for `short`); note the gaps.
5. **Build the nodes.** Create a planned node for each concept from
   `content/templates/node.md`: id, title, depth, phase, note, and links
   mirrored on both sides. Run `bun run check --map` and fix orphans and
   broken links.
6. **Write them,** with "Writing one article" below, `needs` first.
7. **Build the phase's piece of the lab,** with "Building" below. The
   phase is done when its "done when" line in `LAB.md` is true; show me
   the evidence for each part.

## Writing one article

1. **Set up.** Check the planned node's note, depth and links still look
   right. If it's really two concepts, propose the split. If new linked
   concepts come up, create planned nodes for them with mirrored links.
2. **Sources.** Start from the node's list in `_candidates.md`, primary ones
   first. Re-open each one; if it's dead, changed, or replaced by something
   newer, search for a replacement.
3. **Source notes.** For each source used, copy `content/templates/source.md` to
   `content/sources/<id>.md` (skip if it exists; one source serves many nodes).
   Summary in plain words, key claims each with a short quote copied
   word for word and its location, visuals worth redrawing, open questions.
   Mark `primary` honestly.
4. **Write.** The whole article as an explanation in our own words,
   following "The shape of every article" in `WRITING.md`: no quotes or
   "X says" in the body, sources listed once in Further reading as real
   links. Every concept that has a node is linked as `[[id]]` on first
   mention. If it starts explaining a second concept at length, stop and
   propose a new node for it.
5. **Review.** Run `bun run check` and fix every error and warning. Then
   check by hand: every fact is in a source note or an experiment; it reads
   as an explanation, not a digest; links are honest; "Where it gets
   tricky" covers disagreements and what's changed; the note works as a
   hover card; the style rules hold. Mark each `VISUAL:` for a figure. Tell
   me what you changed and what you're unsure about.
6. **Publish.** Only when I say so: commit.

## Building

- **Targets first.** Before building a component, turn its harness and
  targets in `LAB.md` into checks and numbers you can measure.
- **Harness first.** Build the harness before the feature, or with it.
  Plant a bug and show the harness catches it before trusting it.
- **Experiments.** Every harness run and benchmark that makes a claim gets
  a write-up in `content/experiments/` from
  `content/templates/experiment.md`: machine, kernel, filesystem, versions,
  exact command, raw data path. Number them in order.
- **Decision records.** Any choice with real alternatives (a language, a
  file format, an algorithm, a library) gets a record in
  `content/decisions/` from `content/templates/decision.md`, with what was
  measured. Number them in order.
- **Articles follow the build.** When a build step uses a concept that has
  no written node, flag it.
- **The best bug.** Each build ends with at least one bug written up from
  symptom to cause, in the experiment or decision it came from.

## Other work

- **Run `bun run check`** after any change to `content/`.
- **Re-check old nodes.** When a new version of something a node covers
  ships, check its sources are still current and the article is still
  right. Tell me what changed.
- **Keep this file short.** Update it only for lasting rules, not task
  history.
