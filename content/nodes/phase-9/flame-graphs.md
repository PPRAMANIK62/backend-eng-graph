---
id: flame-graphs
title: Flame graphs
depth: short
phase: 9
note: >-
  Reading a profile as stacked bars.
needs: [profiling]
leads_to: [continuous-profiling]
compare_with: []
---

# Flame graphs

A flame graph draws a whole [[profiling|profile]] as one picture. Each
function is a bar, bars sit on top of the functions that called them,
and a bar's width is how often that function showed up in the samples.
The widest bars are where the time went, and you can see them in a few
seconds instead of paging through thousands of lines of text. Brendan
Gregg made them while chasing a MySQL CPU problem and released them in
2011.

## Why a picture

A sampling profiler hands you a pile of call stacks with counts. The
text report for even a small program is long: in one of Gregg's
examples, `perf report` printed over 8,000 lines, and the first screen
accounted for about 3% of the samples. You'd have to read on for pages
to find where half the time went. A flame graph fits the same data on
one screen.

## From stacks to bars

Say a profiler took eight samples of a web server. Each sample is one
stack, written root first with semicolons between frames:
`main;serve;handle;parse`. The flame graph is built in three steps:

1. **Capture** the stacks with any profiler.
2. **Fold** them: one line per distinct stack, with how many times it
   was seen.
3. **Sort and merge:** sort the stacks alphabetically, so identical
   prefixes sit next to each other, and draw each run of identical
   frames as one bar.

![Left: eight stacks in the order they were sampled, such as main;serve;handle;parse, main;serve;handle;query and gc;mark. An arrow labelled sort, merge points right to a flame graph: gc with mark on top on the left; main, serve and handle as wide bars across the rest; and on top of handle, parse (the widest, outlined as most CPU time), query and render. The y-axis is stack depth; the x-axis note says width is the share of samples and the order is alphabetical, not time.](img/flame-graphs-from-stacks.svg)

*Eight made-up samples folded into a flame graph. Adapted from Brendan Gregg, "CPU Flame Graphs".*

## How to read one

- **Up is deeper.** The bottom bar is the root of the stack. Each bar's
  caller is the bar directly under it.
- **The top edge is what was running.** Everything beneath a top bar is
  just the path of calls that led there. So look for wide bars along
  the top: that's code that was on the CPU a lot.
- **Width is share of samples.** A bar's width is the fraction of
  samples in which that function was on the stack, running itself or
  waiting on something it called.
- **Left to right means nothing.** The x-axis is the samples sorted
  alphabetically. It is not time.
- **Colour means nothing** in the classic version. The warm colours are
  random, only there to tell neighbours apart. Some tools use colour on
  purpose, for example to separate kernel, user and JIT-compiled code;
  check the legend.

Most flame graphs are interactive: hover for the exact numbers, click a
bar to zoom into it, and search for a function name to get the total
share of samples that include it.

## Making one

On Linux with `perf` and Gregg's scripts, sampling every CPU at 99 Hz
for 60 seconds:

```
perf record -F 99 -a -g -- sleep 60
perf script | ./stackcollapse-perf.pl > out.folded
./flamegraph.pl out.folded > out.svg
```

The folded file is plain text, so you can `grep` it before drawing,
for example to keep only stacks that pass through the filesystem. Newer
`perf` can produce the graph itself (`perf script report flamegraph`),
and many profilers draw them directly.

The same picture works for anything counted per stack. In an off-CPU
flame graph the width is time spent blocked, not samples on the CPU;
memory flame graphs count bytes allocated.

## Where it gets tricky

**Flame charts are different.** A flame chart, which Chrome's WebKit
Web Inspector introduced, puts time on the x-axis, so you see the order things happened
in. A flame graph gives up time order to merge stacks and show the big
picture, and it can show many threads at once, which a single flame
chart can't. Some tools draw flame charts and call them flame graphs.

**Icicle graphs are the same thing upside down,** root at the top. Many
tools use that layout by default. Read it the same way.

**Wide isn't slow.** A wide bar may be one slow function or a fast
function called very often. Sampling can't tell them apart, because it
never counts calls.

**Broken stacks look like real data.** If a library was built without
frame pointers, [[stack-walking|stack walks]] stop there, and the graph is missing whole
towers. JIT-compiled
code with no symbol map shows up as hex addresses. Kernel interrupts
land on top of whatever code was running, so they show up as thin
strands that can't merge. Getting good stacks is the hard part; drawing
them is easy.

**A sum across threads can exceed the clock.** With many threads
sampled at once, the total samples can add up to more time than the
profile ran.

## What this means when you build

- Start with the widest bars along the top, then follow them down to
  find which of your functions led there.
- Use search to get the total share of a function that appears in many
  places.
- Fix stack walking first (frame pointers, symbol maps), or you'll be
  reading a picture of the profiler's gaps.
- Make one before and one after a change; comparing them shows whether
  the time really moved.

## Further reading

- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. The official page: how to read them, icicles and flame charts, where they came from.
- [CPU Flame Graphs](https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html), Brendan Gregg. Step by step from `perf` samples to a flame graph, and the stack-walking problems per language.
