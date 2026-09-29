---
id: stack-walking
title: Stack walking
depth: short
phase: 9
note: >-
  How a profiler finds the call stack of a sample: frame pointers, DWARF
  unwinding and symbol maps for JIT code.
needs: [profiling]
leads_to: []
compare_with: []
---

# Stack walking

A sampling [[profiling|profiler]] interrupts a program many times a
second and records where it was. A single address isn't much use: you
want the whole call stack, which function called which, to see why the
program was there. Recording that stack is stack walking. It's the
part of profiling that most often goes quietly wrong, and when it does,
your [[flame-graphs|flame graphs]] lie.

## Following the frame pointers

Every function call pushes a frame onto the stack (see
[[heap-and-stack]]). On x86-64, a function can keep a register, `%rbp`,
pointing at its own frame, and each frame stores the caller's value of
that register. That register is the frame pointer. Starting from the
current frame, a profiler follows the chain back one frame at a time
and reads each return address. It's fast and simple, which is why
`perf` uses frame pointers by default for user-space stacks.

The catch is that the x86-64 ABI makes the frame pointer optional, and
compilers can skip it to free the register for other work. GCC stopped
emitting it by default in 2004 (for i386, later x86-64), and Linux
distributions built their binaries and libraries that way. A profiler
walking such a stack gets lost at the first function without one. In
practice the stack stops in libc, the application frames above it are
gone, and the samples land under `[unknown]`. `perf`'s manual says it
plainly: with binaries built using `-fomit-frame-pointer`, the frame
pointer method produces bogus call graphs.

## The other ways to walk

`perf record --call-graph` offers three methods for user space:

| Method | How | Cost |
|---|---|---|
| `fp` (default) | Follow the frame pointer chain | Cheap, but needs frame pointers everywhere |
| `dwarf` | Unwind using the compiler's DWARF call frame information | Works without frame pointers, but expensive to do at sampling time |
| `lbr` | Read Intel's Last Branch Record hardware | Cheap, but only 16 or 32 frames |

DWARF unwinding was designed for debuggers, not for thousands of
samples a second, so its overhead is high. LBR is cheap but too shallow
for most application stacks, which are deeper than 32 frames: useful,
but not enough for a flame graph.

## Frame pointers are coming back

The cheapest fix is to put frame pointers back. Fedora, and Ubuntu from
24.04 LTS, now build libc and other packages with them by default. The
reported cost of keeping frame pointers is usually under 1%, with
reports of about 2%, and microbenchmarks as bad as 10%. Go has used
frame pointers by default for years.

## JIT code needs two fixes

Runtimes that compile code at run time, like the JVM, break stack
walking twice:

1. **No symbols.** The JIT-compiled methods don't appear in any symbol
   table a system profiler can read, so samples show up as hex
   addresses. The fix is a symbol map: an agent such as perf-map-agent
   writes `/tmp/perf-PID.map`, which `perf` reads to name the code. Dump
   it right after recording, because methods get recompiled and moved.
2. **No frame pointers.** The JVM used `%rbp` as an ordinary register.
   `-XX:+PreserveFramePointer`, added in JDK 8u60, makes compiled code
   keep it, so frame-pointer walking works again.

## Where it gets tricky

**Broken stacks look like real data.** Nothing crashes. You get a flame
graph with a big `[unknown]` tower, or application code attributed to
libc. In one of Gregg's examples 15% of samples sat in the wrong place.

**Off-CPU profiles suffer most.** Time spent blocked is mostly inside
libc's read, write and mutex functions, so if libc has no frame
pointers, off-CPU flame graphs are mostly broken.

**Symbols are separate from stacks.** A correct stack of addresses is
still useless without names for them. Fleet-wide profilers have to
solve that at scale; see [[continuous-profiling]].

## What this means when you build

- Build your code, and ideally your base images, with frame pointers
  (in C and C++, don't build with `-fomit-frame-pointer`). The cost is
  small.
- Pick a distribution release that ships libc with frame pointers, or
  expect stacks to stop there.
- For Java, run with `-XX:+PreserveFramePointer` and a perf map agent
  when you profile with system tools.
- When a profile shows `[unknown]` or hex addresses, fix the stacks
  before reading anything into the numbers.

## Further reading

- [The Return of the Frame Pointers](https://www.brendangregg.com/blog/2024-03-17/the-return-of-the-frame-pointers.html), Brendan Gregg, 2024. How frame pointers disappeared from Linux, what that broke, what they cost, and the alternatives.
- [perf-record(1)](https://man7.org/linux/man-pages/man1/perf-record.1.html), Linux perf developers. The fp, dwarf and lbr call-graph methods, and the warning about binaries without frame pointers.
- [CPU Flame Graphs](https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html), Brendan Gregg. Why JIT runtimes break stacks and symbols, and the perf map and PreserveFramePointer fixes.
