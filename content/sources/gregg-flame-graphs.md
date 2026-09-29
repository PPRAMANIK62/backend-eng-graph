---
id: gregg-flame-graphs
title: Flame Graphs
author: Brendan Gregg
url: https://www.brendangregg.com/flamegraphs.html
kind: blog
primary: true
---

## Summary

The official page for flame graphs, by their inventor. It defines how to
read one (x-axis, y-axis, width, colour), the variations (icicle graphs,
flame charts, sunbursts), where they came from (a MySQL CPU problem), and
which profilers can produce them.

## Key claims

- What the axes mean. "The x-axis shows the stack profile population, sorted alphabetically (it is not the passage of time), and the y-axis shows stack depth, counting from zero at the bottom." (Summary)
- Width is frequency. "The wider a frame is is, the more often it was present in the stacks." (Summary) [the doubled word is on the page]
- The top edge is what was running. "The top edge shows what is on-CPU, and beneath it is its ancestry." (Summary)
- Colours are random in the original, to tell neighbours apart. "Original flame graphs use random colors to help visually differentiate adjacent frames." (Summary)
- Interactive features: hover, click to zoom, search with a cumulative percentage. (Summary)
- Icicle graphs are the same thing upside down, and many tools default to them. "Icicle charts are flame graphs upside down." and "many flame graph implementations use the icicle layout by default instead." (Variations)
- Flame charts put time on the x-axis; flame graphs sort alphabetically to merge frames. "Flame graphs reorder the x-axis samples alphabetically, which maximizes frame merging, and better shows the big picture of the profile." (Variations)
- Flame charts can't show many threads sensibly. "Multi-threaded applications can't be shown sensibly by a single flame chart, whereas they can with a flame graphs" (Variations)
- Some tools mislabel flame charts. "Some analysis tools have implemented flame charts and mistakingly called them flame graphs." (Variations)
- Origin: a MySQL performance issue; function tracing had too much overhead, so he switched to timed sampling and dropped time from the x-axis. "I switched to timed sampling (profiling) to solve the overhead problem, but since the function flow is no longer known (sampling has gaps) I ditched time on the x-axis and reordered samples to maximize frame merging." (Origin)
- Warm colours because the CPUs were hot. "picked just warm colors initially as it explained why the CPUs were "hot" (busy)." (Origin)
- Released in 2011. (Updates)
- perf can make them itself now. "Linux: perf (perf script report flamegraph)" (Operating Systems)
- Getting good stacks is the hard part. "Once you have a profiler that can generate meaningful stacks, converting them into a flame graph is usually the easy step." (Operating Systems)
- Flame graphs work for any hierarchical data, not only CPU profiles: memory, off-CPU, differential. (intro list)
- Flame charts came from Chrome's WebKit Web Inspector. "Flame charts were first added by Google Chrome's WebKit Web Inspector (bug)." (Variations)
- Memory flame graphs count bytes, off-CPU ones show blocking time. "visualize stacks with byte counts, instead of the traditional CPU sample Flame Graphs" and "Off-CPU Time Flame Graphs (PDF) can solve issues of blocking time." (Updates)

## Visuals worth redrawing

- The MySQL CPU flame graph example: redraw a small made-up one instead.

## My notes

- Fuller explanation is in the ACM Queue article "The Flame Graph"
  (2016), which couldn't be opened (ACM blocked the request).
