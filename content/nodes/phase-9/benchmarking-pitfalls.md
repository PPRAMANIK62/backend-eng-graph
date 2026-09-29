---
id: benchmarking-pitfalls
title: Benchmarking pitfalls
depth: deep
phase: 9
note: >-
  Warmup, noise, CPU frequency scaling, and comparing numbers that
  aren't comparable.
needs: [load-testing]
leads_to: []
compare_with: [storage-benchmarks]
---

# Benchmarking pitfalls

A benchmark always produces a number, whether or not it measured what
you think it did. Most misleading benchmarks aren't dishonest. They
measured a cold process, a busy machine, a CPU that changed speed
halfway through, a lucky memory layout, or a bottleneck in the
benchmark itself, and then got compared with a number from a different
setup.

## You benchmark A, measure B, and conclude C

The most common failure is testing something other than what you
meant. A "filesystem" benchmark that only exercises the disk. A server
benchmark limited by a single-threaded client. A comparison where the
two sides ran different software versions, or where the network
between client and server was the real limit.

The defense is to watch the system while the benchmark runs, not just
read the number at the end. Brendan Gregg calls this active
benchmarking. Run the benchmark for a long time in a steady state, and
use the usual tools (`top`, `mpstat`, `iostat`, `perf`, the
[[use-method]]) to find what is actually limiting it. The test: can you
explain why the result was X and not 2X? If you can't name the
limiting resource, you don't yet know what you measured.

Statistics don't fix this. A careful confidence interval around a
benchmark of the wrong thing makes a wrong result look trustworthy.

## Warmup

The first run in a fresh process often behaves differently from the
rest. pyperf, Python's benchmark runner, starts 20 separate worker
processes, and each one runs the benchmark once as a warmup and throws
that result away before measuring. One warmup value is usually enough,
but you should look at the values to check.

Some programs never settle, especially ones with a JIT compiler. Don't
respond by warming up "until it looks stable": if two runs use
different amounts of warmup, their results aren't comparable. Pick a
fixed warmup and use it everywhere.

## Noise from the rest of the machine

Anything else running on the machine can slow your benchmark down at
random: background services, other tenants on the same host. The
usual steps for low-noise benchmarking on Linux:

- Stop as many other processes and services as you can.
- Reserve CPU cores for the benchmark (`cset shield`) and switch off
  their SMT siblings, so nothing shares the core.
- Keep the program and its files on `tmpfs`, because real storage adds
  a lot of variability.
- Run it several times, so you can see the noise at all.

With all of that in place, you can expect run-to-run variation under
0.1% (LLVM's figure for its own benchmarks).

For latency benchmarks, this kind of interference is also one of the
causes of [[tail-latency]] in production. Remove it when you're
comparing two versions of code; keep it when you want to know what
users will see.

## The CPU changes speed

Modern CPUs change their clock speed on their own, through frequency
scaling and Turbo Boost, and even the room's temperature affects it.
That's enough to shift a result between two runs of the same code. The
usual fix is to set the Linux frequency governor to `performance`
and turn off Turbo Boost for the benchmark, so the clock stays put.

## Microbenchmarks that measure nothing

A microbenchmark times one small function in a loop. The compiler sees
a loop whose result is never used and is entitled to delete the work,
leaving you timing an empty loop. The other classic mistake is timing the setup: building the input
inside the timed region, so the number is mostly allocation.

Go's `testing` package addresses both with `b.Loop`, added in Go 1.24:

```go
func BenchmarkLen(b *testing.B) {
    big := NewBig()   // setup, not timed
    for b.Loop() {
        big.Len()     // only this is timed, and its result is kept alive
    }
}
```

Only the loop body is timed, so setup before the loop doesn't count.
And the results of calls inside the loop are kept alive, so the
compiler can't optimize the body away. The older `for i := 0; i <
b.N; i++` style needs a manual `b.ResetTimer()` after setup and has no
such protection; the docs now say to prefer `b.Loop`.

## Is the difference real?

You change the code, run the benchmark before and after, and see 3%.
Is that the change or the noise? One run each can't tell you. The Go
team's `benchstat` shows how to decide:

- **Run each side at least 10 times, ideally 20,** and fix that number
  in advance.
- **Interleave the runs,** before, after, before, after, instead of ten
  of one and then ten of the other, so that noise from the machine
  (a background job, thermal throttling) falls evenly on both sides.
- **Compare medians with a test that doesn't assume a shape.** By
  default `benchstat` reports the median with a confidence interval and
  uses the Mann-Whitney U-test for the A/B comparison. It prints `~`
  when it finds no significant difference, and a p-value otherwise:
  how likely it is that a difference this big came from noise alone.

Less noise and more runs let the test detect smaller changes. That's
the link between the machine-quieting steps above and the statistics.

## Numbers that only look comparable

**Memory layout.** Changing the size of the environment variables, or
the order object files are linked, moves code and data in memory.
In one study that alone changed run time often by about 33%, once by
almost 300%, and was enough to flip the answer to "is `-O3` faster
than `-O2`?". Which layout was lucky differed from one CPU to another.
Of 133 papers the authors surveyed, none dealt with this.

That's why low noise isn't the same as a correct answer. Pin
everything down and you get the same number every time, from one layout
that may happen to favor one side. The remedy the study suggests is the
opposite of pinning: run in many different setups (for example, varied
environment sizes and link orders) and look at the spread.

**Different setups.** Two numbers are only comparable if everything
except the thing you changed is the same: software versions, data
size, durability settings ([[storage-benchmarks]]), and the load model
and how latency was timed ([[load-testing]],
[[coordinated-omission]]). A p99 without the request rate next to it
isn't comparable to anything.

## Where it gets tricky

**Turn off address randomization or keep it?** One common setup
disables ASLR to cut noise. Another keeps it on and runs many processes
so the random layouts average out. The layout study explains the
disagreement: disabling ASLR lowers the noise but fixes
one layout, which can bias the answer. Low noise helps when you're
looking for small differences in one program on one machine. Many
layouts help when you want a conclusion that holds elsewhere.

**Rerunning until it's significant.** If the comparison says "no
significant change" and you run it again, and again, you'll eventually
get a "significant" result by chance. With the usual 0.05 threshold, a
test is expected to report a difference 5% of the time when there is
none. For the same reason, compare 100 benchmarks at once and expect
about 5 of them to show a change that isn't real.

## What this means when you build

- Before trusting a number, name what limited it, with evidence from
  tools that ran during the test.
- Use a fixed warmup, many runs, and several processes.
- For microbenchmarks, make sure the timed code can't be optimized
  away and that setup isn't timed (in Go, use `b.Loop`).
- Decide before and after with a statistical comparison over at least
  10 interleaved runs each, and don't rerun until you like the answer.
- Pin CPU frequency, quiet the machine, and write down what you did.
- Write down the machine, kernel, versions, settings and exact command
  next to every result, and compare only like with like.

## Further reading

- [Active Benchmarking](https://www.brendangregg.com/activebenchmarking.html), Brendan Gregg, 2014. Watching a benchmark while it runs to find what really limits it, and a checklist of common mistakes.
- [Benchmarking tips](https://llvm.org/docs/Benchmarking.html), LLVM docs. Concrete Linux steps to cut noise: governor, Turbo Boost, core isolation, SMT, tmpfs.
- [Run a benchmark](https://pyperf.readthedocs.io/en/latest/run_benchmark.html), pyperf docs. Warmups, many worker processes, and why ASLR is averaged rather than disabled.
- [testing package](https://pkg.go.dev/testing), The Go Authors, go1.24 and later. `b.Loop`: what is timed and how it keeps the compiler from deleting the benchmark.
- [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat), The Go Authors. How many runs, interleaving, medians and the Mann-Whitney test, and the multiple-testing trap.
- [Producing Wrong Data Without Doing Anything Obviously Wrong!](https://users.cs.northwestern.edu/~robby/courses/322-2013-spring/mytkowicz-wrong-data.pdf), Todd Mytkowicz, Amer Diwan, Matthias Hauswirth and Peter F. Sweeney, ASPLOS 2009. How memory layout biases results, and how to randomize the setup to avoid it.
