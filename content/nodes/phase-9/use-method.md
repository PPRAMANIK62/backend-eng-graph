---
id: use-method
title: The USE method
depth: short
phase: 9
note: >-
  Utilization, saturation, errors for every resource: a checklist for
  finding bottlenecks.
needs: []
leads_to: []
compare_with: [red-method, queueing-theory]
---

# The USE method

The USE method is a checklist for the first minutes of a performance
problem: for every resource the machine has, check its utilization, its
saturation and its errors. It starts from a list of resources, not from
whatever graphs you already have, so it also shows you what you haven't
looked at. It finds bottlenecks and failing parts quickly. It doesn't
find everything.

## Three questions for each resource

Say a service on one host has become slow and you don't know why. Before
opening any tool, you list the host's resources: CPUs, memory, network
interfaces, storage devices, and the controllers and buses that connect
them. Then you ask three questions about each one.

- **Utilization:** how much of the time was it busy doing work? Usually
  a percentage over an interval, like "this disk was 90% busy over the
  last second".
- **Saturation:** how much work is waiting because it can't be served
  yet? Usually the length of a queue, or the time spent in it.
- **Errors:** how many error events happened? A count.

For the CPUs, utilization is the busy percentage per CPU. Saturation is
the run queue: threads that are ready to run but waiting their turn (see
[[cpu-scheduler]]). For memory, utilization is how much is in use, and
saturation shows up as the kernel paging or swapping memory out. For a
network interface, utilization is throughput against its maximum, and
saturation shows up as dropped packets and overruns. For a disk,
utilization is its busy percentage and saturation is its wait queue.
Errors are device errors, failed allocations, interface error counters.

There is a second meaning of utilization for things that fill up, like
memory or disk space: the share of capacity used, where 100% means
nothing more fits. Keep both in mind; a disk has both kinds, the I/O it
serves and the space it holds.

![Flowchart. Pick a resource, then ask three questions in turn: errors (counters rising), utilization (busy percentage high), saturation (work queued). A yes to any of them leads to a box saying you have a suspect to investigate, then come back, because the first problem may not be the only one. Three no answers lead to the next resource, and the loop repeats for every resource on the list. A note says to check errors first because they're quickest to read.](img/use-method-flow.svg)

*The USE method as a loop over resources. Adapted from Brendan Gregg, "The USE Method".*

Every resource and question together gives about thirty metrics. Some
you can't easily measure; write those down anyway, since a gap you know
about beats one you don't. The common problems usually show up in the
easy ones: CPU and memory saturation, network and disk utilization.

## Software resources count too

The same questions work for limits inside software:

- A [[mutex]]: utilization is the time it's held, saturation is the
  threads queued waiting for it.
- A [[thread-pool]]: utilization is how busy its threads are, saturation
  is the requests waiting for a free thread.
- [[file-descriptor|File descriptors]] and the process or thread limit:
  utilization is how many are in use, waiting for one is saturation,
  and errors are the failed allocations, like a "cannot fork".
- Container and VM limits ([[cgroups]]): a container's memory use
  against its cap is its utilization, even when the host has plenty
  free.

## Reading the numbers

**Utilization.** 100% usually means a bottleneck; check saturation to
confirm it. Trouble can start well before that, around 70%, for two
reasons. An average over seconds or minutes can hide short bursts at
100%. And some devices, like disks, can't be interrupted in the middle
of an operation, so queues start forming as they get busy. Why waiting
grows so fast near full load is [[queueing-theory]].

**Saturation.** Any saturation is worth a look. Work is waiting, which
means latency.

**Errors.** Non-zero counters that are still climbing while things are
slow deserve attention, even when the errors are recovered from. A
retried operation or a failed disk in a redundant set still costs time.

**All clear.** Low utilization, no saturation and no errors rules a
resource out, which narrows the search.

## Where it gets tricky

**Averages lie about bursts.** One customer's monitoring showed CPU
never above 80%, in five-minute averages. Within those five minutes the
CPUs sat at 100% for seconds at a time, and requests queued. Use the
shortest interval you can get.

**Caches are left off the list.** A cache works better under load, not
worse, so the three questions don't fit it. Check hit ratios after
you've ruled out the bottlenecks (see [[caching]]).

**It finds one class of problem.** USE finds resources that are
overloaded or failing. It won't tell you that the code does too much
work per request or waits on a slow downstream service. The method's
author estimates it finds about 80% of server issues with 5% of the
effort; that's his estimate, not a measurement. Looking at where
requests spend their time, with [[profiling]] or per-request latency,
finds more but needs you to know the code. The first problem you find
may also not be the only one, so finish the list.

**Linux now measures saturation directly.** The original checklists
infer saturation from run-queue lengths, paging and device queues. Linux
also has pressure stall information (PSI): files under `/proc/pressure/`
for CPU, memory and I/O that report the share of time some tasks, or
all of them, were stalled waiting on that resource. It gives averages
over 10, 60 and 300 seconds plus a running total, and the same files
exist per cgroup. That's saturation measured as time lost.

## What this means when you build

- Write the checklist for your hosts before you need it: each resource,
  the metric for each question, and the command or graph that shows it.
- Check errors first; they're the quickest to read.
- Add your own software limits: connection pools, thread pools, file
  descriptor limits, container quotas.
- USE looks at machines. For the requests your service handles, use
  [[red-method|RED]] next to it.

## Further reading

- [The USE Method](https://www.brendangregg.com/usemethod.html), Brendan Gregg, 2012 (updated 2017). The method from the person who made it: definitions, example metrics per resource, how to read them, and its limits.
- [PSI - Pressure Stall Information](https://docs.kernel.org/accounting/psi.html), Johannes Weiner, Linux kernel docs. The `/proc/pressure/` files, what "some" and "full" mean, and per-cgroup pressure.
