---
id: ren-google-wide-profiling-2010
title: "Google-Wide Profiling: A Continuous Profiling Infrastructure for Data Centers"
author: Gang Ren, Eric Tune, Tipp Moseley, Yixin Shi, Silvius Rus, Robert Hundt (Google)
url: https://research.google.com/pubs/archive/36575.pdf
kind: paper
primary: true
---

## Summary

IEEE Micro paper (2010) on GWP, Google's always-on profiler for its
fleet. It samples in two dimensions (a few machines at a time, and
events within each machine), stores raw profiles, symbolizes them
offline against saved unstripped binaries, and loads them into a
queryable database. Describes uses: fleet-wide hot code, version
comparisons, platform affinity, and feedback-directed optimization.

## Key claims

- Production tools must be cheap. "However, application owners won’t tolerate latency degradations of more than a few percent, so these tools must be nonintrusive and have minimal overhead." (p. 65, introduction)
- Profiling can be on demand or continuous. "Profiling can begin on demand to analyze a performance problem, or it can run continuously." (p. 65)
- It collects stack traces, hardware events, lock contention, heap profiles and kernel events. (p. 65)
- Overhead costs money at scale. "any unnecessary profiling overhead can cost millions of dollars in additional resources." (p. 66)
- Questions it answers include hottest code, performance across software versions, most contended locks, memory hogs. "How does performance differ across software versions?" (p. 66, list)
- Two-dimensional sampling. "At any moment, profiling occurs only on a small subset of all machines in the fleet, and event-based sampling is used at the machine level." (p. 66, Collector)
- The collector picks a random sample of machines from the machine database, profiles each for a while, then moves on; a machine takes a few minutes. (p. 67, Collector)
- Per-machine rates are capped conservatively. "we measure the event-based profiling overhead on a set of benchmark applications and then conservatively set the maximum rates to ensure the overhead is always less than a few percent." (p. 67)
- No full call stacks for machine-wide profiles, to save unwinding cost. "we don’t collect whole call stacks for the machine-wide profiles to avoid the high overhead associated with unwinding" (p. 67)
- Aggregate overhead. "As a result, the aggregated profiling overhead is negligible—less than 0.01 percent." (p. 67)
- The collector stops profiling when failures pass a threshold. (p. 67)
- Per-process profiles come from a common library with an HTTP server and a handler per profile type. "The common library includes a simple HTTP server linked with handlers for each type of profiler." (p. 68)
- Binaries ship without symbols, so symbolization is hard. "applications are usually deployed into data centers without any debug or symbolic information, which can make source correlation impossible." (p. 68)
- JIT code (Java, QEMU) can't be symbolized offline. (p. 68)
- Shared code can be hot overall while small in each program. "GWP can identify routines that don’t account for a significant portion" (p. 75; the sentence ends on p. 76, "of any single application but consume the most cycles overall")
- The fix: keep unstripped binaries in a global repository and symbolize with MapReduce. "Currently, GWP stores unstripped binaries in a global repository" (p. 68)
- Profiles are tagged with job, machine and datacenter attributes for later correlation. (p. 68)
- Shared code that's hot nowhere can be hot everywhere: zlib. "the GWP profiles revealed that the zlib library (www.zlib.net) accounted for nearly 5 percent of all CPU cycles consumed." (p. 76)
- Teams found hot functions they didn't know about. "Application developers often are surprised by application’s profiles when browsing GWP results." (p. 75)
- Profiles from two queries can be compared, pointing a change at a source revision, compiler or datacenter. (p. 77, Datacenter performance monitoring)
- Profiles from live data feed compiler optimization (FDO). "This profile will be higher quality than any profile derived from test inputs because it was derived from running on live data." (p. 77)
- Runtime-generated code can't be symbolized later. "The code is not available offline and can therefore no longer be symbolized." (p. 68, about Java and QEMU)

## Visuals worth redrawing

- Figure 1 (p. 67): the pipeline, machines and daemons, collectors,
  binary repository, symbolizer, profile database, web server.

## My notes

- The 0.01% is the fleet-wide average because most machines aren't
  being profiled at any moment; the per-machine cap is "a few percent".
