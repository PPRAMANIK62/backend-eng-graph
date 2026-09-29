---
id: gregg-cpu-flame-graphs
title: CPU Flame Graphs
author: Brendan Gregg
url: https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html
kind: blog
primary: true
---

## Summary

The detailed page on CPU flame graphs: why a text profile of thousands of
lines is hard to read, what each part of a flame graph means, the three
steps to make one (capture stacks, fold them, render), and the language-
specific traps (missing frame pointers in C and C++, JIT symbols in Java
and Node.js).

## Key claims

- Sampling at a fixed rate is coarse but effective. "Profiling by sampling at a fixed rate is a coarse but effective way to see which code-paths are hot (busy on-CPU)." (intro)
- Text output is huge: his example perf report was over 8,000 lines, and one screen covered 3% of samples. "The above output has been truncated, and only shows 45 lines from over 8,000 lines of output." (1.1 Too Much Data)
- Each box is a stack frame. "Each box represents a function in the stack" (3. Description)
- The x-axis order means nothing. "The left to right ordering has no meaning (it's sorted alphabetically to maximize frame merging)." (3. Description)
- Width is total time on-CPU or in an ancestor of on-CPU code. "The width of the box shows the total time it was on-CPU or part of an ancestry that was on-CPU (based on sample count)." (3. Description)
- Wide can mean slow per call or called often; call counts aren't known. "Functions with wide boxes may consume more CPU per execution than those with narrow boxes, or, they may simply be called more often." (3. Description)
- Call counts aren't known. "The call count is not shown (or known via sampling)." (3. Description)
- Samples can exceed elapsed time with many threads. "The sample count can exceed elapsed time if multiple threads were running and sampled concurrently." (3. Description)
- Colours aren't significant. "The colors aren't significant, and are usually picked at random to be warm colors (other meaningful palettes are supported)." (3. Description)
- Three steps. "Capture stacks", "Fold stacks", "flamegraph.pl" (4. Instructions)
- Folded stacks can be grepped to filter. "The second step generates a line-based output for flamegraph.pl to read, which can also be grep'd to filter for functions of interest." (4. Instructions)
- perf command: 99 Hz, all CPUs, with stacks. "The perf record command samples at 99 Hertz (-F 99) across all CPUs (-a), capturing stack traces so that a call graph (-g) of function ancestry can be generated later." (4.1 Linux perf)
- Odd rates avoid lockstep sampling. "The odd numbered rates, 99 and 199, are used to avoid sampling in lockstep with other activity and producing misleading results." (4.3 DTrace)
- eBPF's profile(8) aggregates stacks in the kernel. "My profile(8) tool in bcc does in-kernel aggregations of sampled stack traces, so that only the summary is emitted to user space." (4.2 eBPF profile)
- Missing frame pointers break C stacks and lose towers. "This commonly happens for software installed via Linux repositories, and your flame graph will be missing towers." (6. C)
- Fixes: -fno-omit-frame-pointer, or DWARF debuginfo with perf's DWARF walker. (6. C)
- JIT runtimes: no symbol table, and the JVM used the frame pointer register. "The JVM compiles methods on the fly (just-in-time: JIT), and doesn't expose a traditional symbol table for system profilers to read." (8. Java)
- Interrupts show up as thin strands (hair) that can't merge, because they land on top of random application stacks. "Interrupts can occur at any time, adding a short burst of CPU cycles, as well as a deep stack trace, on top of any application code." (5. Examples, reversed merge order)
- The first screen of the perf report covered 3% of samples. "So after reading this screen of text, we can only account for 3% of the samples." (1.1 Too Much Data)
- Colour modes can mark user, kernel and JIT code. "I added the --colors=java mode to flamegraph.pl so it made use of those annotations, which will color user/kernel/jit code differently." (4.x Java)
- Without JIT symbols, perf shows hex. "you'll see hexadecimal numbers and broken stack traces, as it can't convert addresses into Java symbols" (8. Java)
- Works for any stack plus value: counts, bytes or latency. "For any of these, the stack trace can be gathered, along with a relevant value: counts, bytes, or latency." (Other types)
- Saving samples has a cost of its own. "This does involve CPU, file system, and disk overheads to save the samples to the file system for later processing." (4.1 Linux perf)
- The JVM breaks frame-pointer walking. "The JVM also uses the frame pointer register (RBP on x86-64) as a general purpose register, breaking traditional stack walking." (8. Java)
- A JVMTI agent can write a symbol map for perf. "A JVMTI agent, perf-map-agent (previously here), which can provide a Java symbol table for perf to read (/tmp/perf-PID.map)." (8.2 Linux perf_events)
- The JVM option that keeps frame pointers. "The +PreserveFramePointer was added to JDK8u60 to facilitate perf and flame graph generation" (8.2 Linux perf_events)
- Dump the symbol map right after recording. "runs immediately after perf record, to minimize symbol churn." (8.2 Linux perf_events)

## Visuals worth redrawing

- The perf report text vs the flame graph of the same data.

## My notes

- The page has a note that perf gained its own flame graph generator and
  the author lost track of its status. Use the main flame graphs page
  for "perf script report flamegraph".
