# How the articles get written

Written 2026-09-28, adapted from ai-eng-graph. Every node in the graph is a
research article built from the best published engineering writing, with
citations.

## What makes an article worth reading

This is a learning resource. A reader comes to understand a concept, not to
read a digest of who said what. So an article is an explanation, written in
our own words, the way a good engineer would teach it to a friend. The
sources are where we learned it; they're listed once at the end.

- **Explain, don't report.** Write "a TCP handshake costs one round trip
  before any data moves", not "the RFC says the handshake takes one round
  trip". No "X says", "as described in", "according to" in the body.
- **Build from an example.** Start with something concrete (one packet,
  one query, one write to disk) and grow the idea from it step by step.
- **Combine what the sources know.** The mechanism from one, the numbers
  from another, the reason behind a design from a third, told as one
  explanation.
- **Cover the tricky parts.** Where people disagree, what changed recently,
  what's often misunderstood. Explain the disagreement itself, not who holds
  each side (name people only when it's part of the story, like the Redlock
  debate or who named CAP).
- **Place the topic in the graph.** What you need first, what comes next,
  what it's often confused with.
- **Add something original.** A redrawn diagram, or a small experiment that
  was actually run, often from the lab. "We ran this on Postgres at
  REPEATABLE READ, here's the history" is enough. Link the write-up in
  `content/experiments/`. Never describe an experiment that wasn't run.

## Style

- Plain language. No bookish or academic tone. Write like explaining it to a
  friend who's a good engineer. Talk to the reader as "you".
- Short sentences. Short paragraphs, one idea each.
- No quotes from sources in the body, unless the exact wording is the point
  (a line from a spec, say).
- Date and version anything that goes stale: "Linux 5.1 (2019) added
  io_uring", not "Linux has io_uring". Kernel, database
  and protocol versions matter here.
- A visual wherever a picture explains faster than words: packet diagrams,
  on-disk layouts, timelines of two transactions. Visuals support the
  reading, they don't replace it.
- Numbers with units and conditions: "about 100 µs on a consumer NVMe
  SSD", never just "fast".
- No AI-sounding filler: no "delve", "crucial", "landscape", "in today's
  world", no "it's not X, it's Y" tricks, no one-line dramatic closers.

## One concept per node

Each file covers one concept. Small enough to connect cleanly, big enough that
the concept isn't split across files. Big files that mix topics can't be
linked properly, because a link can only point at a whole file.

- **Too big** if the hover note needs an "and" to say what it is, or another
  article would want to link to just one part of it. Split that part out.
- **Too small** if a piece makes no sense without its neighbour. Merge it
  back.
- Ids name the concept, not the question: `write-ahead-log`, `raft`,
  `write-skew`.

## Two depths

Not every concept deserves the same weight. Both depths are real articles,
just different sizes. Set it with `depth` in the frontmatter.

- **deep**: the concepts a job interview would dig into. TCP, the WAL,
  isolation levels, MVCC, Raft, consistent hashing, load shedding. 3 to 6
  sources, every section, under about 2,500 words.
- **short**: smaller concepts that other nodes lean on. TIME_WAIT, bloom
  filters, Little's law. 1 or 2 sources, and "Where it gets tricky" can be
  dropped when there's nothing real to say. Under about 1,000 words.

The check script warns when a node runs past its limit, or when a deep node
cites fewer than 3 sources. Past the limit usually means it holds two
concepts.

## The shape of every article

1. **Title.** Names the concept, as a plain question when that reads better
   ("What does fsync actually promise?").
2. **Opening.** Two or three sentences, no heading: what it is and why you'd
   care when building.
3. **The explanation.** As many sections as it needs, with headings that say
   what the section explains ("The page cache lies to you"), not generic
   ones. Step by step, from a concrete example, with the main visual.
4. **Where it gets tricky.** Misconceptions, disagreements, what's changed,
   what nobody knows yet.
5. **What this means when you build.** The practical takeaways for a
   backend engineer. Short.
6. **Further reading.** Every source the article drew on, one line each on
   what it's good for.

A `short` article can skip 4 when there's nothing real to say.

## Sources

One file per source in `content/sources/`, made from `content/templates/source.md`.

- Prefer primary sources: RFCs and specs, papers, official docs, source
  code, and engineering blogs from the team that built the thing. Use
  secondary explainers to understand the topic, and primary sources for
  the claims.
- Books are fine sources (DDIA, Database Internals, OSTEP and the like)
  when I've actually read the part I cite. Note the chapter and section.
- 3 to 6 sources per article is normal.
- Record the URL, author, publish date, and the date I read it.
- Key claims get a short quote and where in the source it came from, so any
  claim in an article can be checked against the notes.

## Further reading and accuracy

- The body has no citation markers. The sources go in the "Further reading"
  list at the end, one per source, as a real link:
  `- [Title](url), author, year. What it's good for.`
- The url must match the `url` of a note in `content/sources/`. Nothing is listed
  that doesn't have a note.
- Only verified facts. Every fact in an article must come from a source in
  Further reading and be in that source's note (re-open the page and add it
  to the note if it isn't), or from an experiment in `content/experiments/`
  that was really run. Our own framing, examples and analogies are fine;
  new facts from memory are not. If a fact can't be verified, leave it out.
- `bun run check` checks that every Further reading link matches
  a source note and every graph link points to a real node.

## Respecting the authors

- Quotes stay short, a sentence or two at most. Everything else is written
  fresh, not paraphrased line by line.
- Always link to the original.
- Redraw diagrams and credit them ("adapted from ..."). Don't paste their
  images.
- Store notes and short quotes, never full copies of someone else's article
  or book.

## Graph links

Each article's frontmatter has three kinds of links:

- `needs`: what you should read first. MVCC needs isolation levels.
- `leads_to`: what this opens up. The WAL leads to LSM trees.
- `compare_with`: what it's often confused with or weighed against. B+tree
  vs LSM tree.

Keep them honest. If A lists B in `leads_to`, then B lists A in `needs`.
The check script enforces this.

Inside the text, link every concept that has its own node the first time it
comes up, like the dictionary does: `[[fsync]]`, or
`[[fsync|an fsync call]]` to change the wording. On the site these become
hover notes. Rules:

- If the concept doesn't have a node yet, create a planned one so the link
  resolves. Unwritten nodes are fine. Missing ones aren't.
- Anything in `needs` should be linked in the text too, so the reader can
  jump back to it at the moment it matters.
- Don't explain a linked concept again at length. One line of reminder, then
  the link.
- No orphans. Every node links to at least one other node, and at least one
  node links to it. The check script warns on both.

## Planning the map

Links are designed, not added by accident. Each phase plans its whole part
of the map before any article in it is written, then writes in an order
where `needs` come first. The steps are "The phase loop" in `CLAUDE.md`.
The map will change as I learn. That's fine, update the planned nodes when
it does.

## Planned and written

There's no status field. A node is one of two things:

- **Planned**: the file exists with its concept, note and links, and the body
  is only headings and template comments. It shows on the map as "opening
  later" and has no page.
- **Written**: the body has text. Whatever is committed is published, so a
  written node has a page as soon as it's committed.

Drafts stay uncommitted until I've reviewed them.

## Keeping articles current

Backend fundamentals change slower than AI, but versions, defaults and
tools don't. A written node gets re-checked every 12 months: are the
sources still current, has a new version changed the behavior, is the
article still right? Update `updated` after each check. The check script
warns when a written node hasn't been touched in 12 months.
