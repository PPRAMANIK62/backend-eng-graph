---
id: cgroups
title: cgroups
depth: deep
phase: 14
note: >-
  Limiting and measuring a group of processes' CPU, memory and I/O with
  cgroups v2, and why page cache counts against the memory limit.
needs: [process, page-cache]
leads_to: [containers]
compare_with: [linux-namespaces]
---

# cgroups

A cgroup (control group) is a group of [[process|processes]] that the
kernel accounts for and limits as one unit: how much CPU time it gets,
how much memory it can hold, how fast it can do disk I/O, how many
processes it can fork. Every container's resource limits, and every
Kubernetes CPU and memory limit, ends up as a few numbers written into
cgroup files. Knowing what those numbers really do explains two classic
production surprises: a service that's slow at 40% CPU, and a container
that gets OOM-killed while its heap looks small.

## A cgroup is a directory

cgroup v2 shows up as a filesystem, normally mounted at `/sys/fs/cgroup`.
The tree of directories is the tree of groups. Say you want to run an
API server with a limit of two CPUs and 1 GiB of memory:

```
mkdir /sys/fs/cgroup/api                      # a new cgroup
echo "+cpu +memory" > /sys/fs/cgroup/cgroup.subtree_control
echo "200000 100000" > /sys/fs/cgroup/api/cpu.max
echo 1G > /sys/fs/cgroup/api/memory.max
echo $PID > /sys/fs/cgroup/api/cgroup.procs   # move the server in
```

That's the whole interface: make a directory, turn on the controllers
you want in the parent's `cgroup.subtree_control`, write limits into the
files that appear, and move a process in by writing its PID to
`cgroup.procs`. Its [[thread|threads]] go with it. Anything it forks from then on
is born in the same cgroup, so the whole process tree stays inside.
Removing an empty cgroup is `rmdir`.

A few rules shape the tree:

- **Every process is in exactly one cgroup.** `/proc/<pid>/cgroup`
  tells you which.
- **Limits flow down.** A cgroup can only hand out what its parent gave
  it, and a limit set near the root can't be overridden further down.
- **Processes live in the leaves.** A cgroup (other than the root) that
  hands resources to children can't also have processes of its own. So
  to control a group, you create children and move its processes into
  them first.
- **There's one tree.** cgroup v1 let each controller have its own
  separate hierarchy. In practice that was hard to use and hard to make
  controllers cooperate, so v2 has a single hierarchy for everything.

![A tree under /sys/fs/cgroup. The root has cpu and memory enabled in cgroup.subtree_control. Two children: system.slice with its own services, and api, which holds the API server's processes and has cpu.max set to 200000 100000 and memory.max set to 1G. Processes sit only in leaf cgroups.](img/cgroups-tree.svg)

*A small cgroup v2 tree. Controllers are switched on in a parent and their files appear in its children.*

## Four ways to share a resource

Controllers hand out resources in four ways, and it helps to know which
kind a knob is:

- **Weights** split a resource by ratio among the children that are
  using it. `cpu.weight` ranges from 1 to 10,000 with a default of 100.
  A child with weight 200 gets twice the CPU of one with 100, but only
  when both want CPU. When one is idle the other can use everything.
- **Limits** cap usage: `cpu.max`, `memory.max`, `io.max`. The sum of
  the children's limits may be more than the parent has.
- **Protections** guarantee a floor, like `memory.low` and `memory.min`:
  memory below this line isn't reclaimed while there's memory to take
  from someone else.
- **Allocations** give out a fixed share of something finite, and can't
  be over-committed.

## CPU: a budget per period, then sleep

`cpu.max` holds two numbers, a quota and a period, both in microseconds.
The default is `max 100000`: no quota, 100 ms period. Writing
`200000 100000` means "at most 200 ms of CPU time in every 100 ms",
which is two CPUs' worth.

The catch is that this limits the *average*, not how many cores you use
at once. Say the API server has a thread pool of eight threads and a
burst of requests arrives. All eight run on eight cores. Eight cores burn
200 ms of CPU time in 25 ms of wall-clock time. The quota is gone, and
the kernel stops the whole group until the next period starts, 75 ms
later. Every request in flight just waits.

![Timeline of three 100 ms periods for a cgroup with cpu.max 200000 100000. In the first period eight threads run together for 25 ms, using the 200 ms quota, and the group is then throttled for the remaining 75 ms. The second period repeats the pattern. A request that arrives during a throttled stretch waits until the next period begins.](img/cgroups-cpu-throttling.svg)

*How a burst that fits the average still gets throttled. Our own example numbers; the pattern follows Dan Luu, "The container throttling problem".*

That's what Twitter found in its own fleet. Most CPU-bound services
started failing their latency targets at around half of their reserved
CPU. In one case study a service with a 20-core quota violated its [[sli-slo-sla|SLO]]
while averaging about 8 cores, because short bursts above 20 cores used
up the quota and then got throttled. The cause was thread pools sized to
the host's core count, much bigger than the reservation. Shrinking the
thread pools let that service handle about twice the load. A JVM's
garbage collector threads, sized to all the cores on the host, turned
sub-second pauses into pauses of several seconds the same way.

You can see throttling in `cpu.stat`, in its `nr_throttled` and
`throttled_usec` fields, which report throttling caused by the group's
own quota. If those grow while average CPU looks fine, this is your
problem, and it shows up as [[tail-latency]], not as high utilization.
The fix is usually on your side: size [[thread-pool|thread pools]] and
runtime settings to the quota, not to the machine.

## Memory: page cache counts

The memory controller tracks more than your heap. It charges a cgroup
for:

- anonymous memory (heap, stacks),
- the [[page-cache]] for files the group reads and writes,
- kernel structures like dentries and inodes,
- TCP socket buffers.

So `memory.current` is not "how big is my process". If your service
writes a large log file or reads a big dataset, the cached file pages
count against its limit. `memory.stat` breaks it down; the `file` line
is page cache. Because the kernel happily fills free memory with cache,
a cgroup's usage looks high when things are quiet. Meta's advice for
sizing is to read `memory.current` while the system is under some
memory pressure, not when it's idle.

Cache is reclaimable, which is what makes this mostly fine: when the
cgroup reaches its limit, the kernel first tries to reclaim memory, and
cache pages are the easy thing to take back (how that works is in
[[page-cache]]). An OOM kill comes only when reclaim can't bring usage
down.

There are two limits, and they behave very differently:

- **`memory.high`** is a throttle. Above it, the group's processes are
  slowed down and forced to reclaim memory themselves. It never calls
  the OOM killer. It's meant to be the main way to control memory,
  because a group that's squeezed gets slower instead of dead, and
  something can notice and react.
- **`memory.max`** is the hard wall. If usage reaches it and reclaim
  can't bring it down, the OOM killer runs inside the cgroup and kills
  something there. `memory.events` counts how often each limit was hit,
  including `oom_kill`, and `memory.oom.group` makes the kernel kill the
  whole group together instead of one process from it.

Setting a hard limit well needs an accurate idea of the working set,
and that's hard to estimate. Guess low and you get OOM kills; guess high
and you waste memory. That's why v2 leans on `memory.high` plus a
monitor. The monitor's best signal is pressure stall information in
`memory.pressure`, the time the group loses waiting for memory (see
[[use-method]]).

Some other memory details worth knowing:

- Memory is charged to the cgroup that first touched it, and it stays
  charged there until freed. A page of cache shared by two cgroups lands
  in one of them, and which one isn't defined.
- Moving a process to another cgroup doesn't move the memory it already
  charged.

## I/O and PIDs

`io.max` caps bytes per second and I/O operations per second per
device, for example `8:16 rbps=2097152 wiops=120`. Writes through the
page cache are tricky to charge, because the actual disk write happens
later, in writeback. cgroup v2 ties writeback to the memory controller
so the I/O is charged to the right group, but only on filesystems that
support it: ext2, ext4, btrfs, f2fs and XFS. On others, all writeback is
charged to the root.

`pids.max` caps how many processes and threads a group can have. It
exists because a fork bomb runs out of process IDs long before it runs
into a memory limit.

## Where it gets tricky

**v1 versus v2.** cgroups arrived in Linux 2.6.24; v2 was made official
in Linux 4.5. The files differ (`memory.limit_in_bytes` in v1,
`memory.max` in v2), so tools and runtimes that read cgroup files
directly have to know which one they're on. `stat -fc %T /sys/fs/cgroup`
prints `cgroup2fs` on v2. Kubernetes has supported v2 as stable since
v1.25 and deprecated v1 in v1.35.

**Your runtime might not read the limit.** A language runtime that
doesn't understand cgroup v2 may size its heap from the host's total
memory and get OOM-killed. Kubernetes' docs list the versions of Java
and Node.js that read v2 limits; Node.js does since v20.3.0. For Go,
[[garbage-collection]] covers setting `GOMEMLIMIT` just under the
container's limit.

**CPU limits versus weights.** A quota protects neighbours from a
runaway service, which is why Twitter turned quotas on, but it throttles
you even when the machine has idle cores. A weight only matters when
groups compete for CPU. Twitter's experience shows the cost of setting
quotas without sizing thread pools to match.

**Page cache blame.** A service that reads files heavily can look like
it's leaking memory in `memory.current` when it's just caching. Check
the `file` line in `memory.stat` before you raise the limit.

**Namespaces are separate.** cgroups limit how much a group can use,
but they don't hide anything. That's the job of
[[linux-namespaces]]. A [[containers|container]] uses both.

## What this means when you build

- Size thread pools, GC threads and worker counts to the CPU quota, not
  to `nproc` on the host. Watch `nr_throttled` in `cpu.stat`.
- Remember page cache counts against memory limits. Leave room for it,
  and look at `memory.stat` before calling something a leak.
- Prefer `memory.high` as the working limit and `memory.max` as the
  backstop, and alert on `memory.events` and `memory.pressure`.
- Make sure your language runtime reads cgroup v2 limits, or set its
  heap limit yourself.
- Set `pids.max` for anything that forks.
- For your own runtime: create the cgroup directory before starting the
  container, write its PID into `cgroup.procs` before it execs, and
  remove the directory after it exits.

## Further reading

- [Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html), Tejun Heo, Linux kernel docs. The reference: the tree rules, every cpu, memory, io and pids file, and why v1 was redesigned.
- [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html), man-pages 6.19. When cgroups and each controller arrived, and when v2 became official.
- [Memory Controller](https://facebookmicrosites.github.io/cgroup2/docs/memory-controller.html), Meta cgroup2 docs. memory.low versus memory.high in production, and measuring memory under pressure.
- [The container throttling problem](https://danluu.com/cgroup-throttling/), Dan Luu and colleagues, 2019. How CPU quotas throttle bursty services at half their reserved CPU, from Twitter's fleet.
- [About cgroup v2](https://kubernetes.io/docs/concepts/architecture/cgroups/), Kubernetes docs, v1.36. What Kubernetes needs from cgroup v2 and which language runtimes read v2 limits.
