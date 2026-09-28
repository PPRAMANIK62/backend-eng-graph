# Candidate sources, all phases

Started 2026-09-28. **A reading list, not citations.** Every link listed
under a phase must have been opened and checked against what's written
about it, on the date given. Nothing here can be cited yet: a source becomes
citable only when it gets its own note (`sources/<id>.md`, made from
`templates/source.md`) while an article is being written. At that point,
re-open it, because docs and versions change.

Each phase's section gets researched in step 4 of the phase loop
(`CLAUDE.md`), if it's still empty. The node list follows
`tentative-shape.md`.

How each phase section is laid out:
- One block per node, with 3–6 candidates for `deep` and 1–2 for `short`.
  Each has a kind, whether it's primary, why it's worth reading,
  and what was seen when it was opened. "See X #n" means the source is
  already listed under another node.
- Then "Disagreements and tensions", "Couldn't open", "Rejected" and "Gaps"
  for that phase.

Prefer, in this order: RFCs and specs, papers, official docs and source
code, engineering blogs from the team that built the thing, then good
secondary explainers.

## Not opened yet

Books and courses I expect to lean on across many phases. **None of these
has been opened for this project yet.** Each one moves into a phase section
only after it's been opened and the part that matters has been checked.

- *Designing Data-Intensive Applications*, Kleppmann (check the latest
  edition): phases 6 to 12, 16.
- *Database Internals*, Petrov: phases 7, 8, 11, 12.
- *Operating Systems: Three Easy Pieces*, Arpaci-Dusseau: phases 1, 4.
- *High Performance Browser Networking*, Grigorik: phases 2, 3.
- *Systems Performance*, Gregg: phases 1, 9.
- CMU 15-445 lecture notes and videos: phases 6 to 8.
- MIT 6.5840 lecture notes and papers: phases 11, 12.
- The Google SRE books: phases 13, 14.
- Jepsen analyses: phases 8, 11, 12.

## Things that change the plan

<!-- Findings from the research that affect LAB.md, PLAN.md or
     tentative-shape.md. Each needs a decision from me before its phase. -->

### Phase 1 (found 2026-09-28)

Done 2026-09-28: `huge-pages` and `fsync-errors` added, `cpu-scheduler`
note says EEVDF, `garbage-collection` needs `cpu-cache`, the drive's
sysfs values read (experiment 0003), articles cite NVMe Base 2.4. Still
open: LazyFS vs dm-log-writes, for decision 0002 when the build starts.

**Who and why, processes and the CPU:**
- `cpu-scheduler` note should say CFS was replaced by EEVDF in 6.6 (2023), and flag that man-pages still say CFS. Not a size change.
- `latency-numbers` pulls in syscall and context-switch costs (napkin-math and lmbench list them next to memory and network). Keep them in `system-call` and `context-switch` and link, so the table node stays one concept.

**Memory:**
- **Huge pages might be its own short node.** The THP doc has real content (modes, bloat, latency spikes, mTHP) and databases and runtimes set it on purpose. Folding it into `virtual-memory` risks a second concept. Suggest a `huge-pages` short node, needs `virtual-memory`. Your call.
- **`garbage-collection` should link to `cpu-cache`.** Go 1.26's default GC was redesigned around cache locality (Green Tea), so the link is real.
- **Sources 4 and 5 under `memory-hierarchy` fit `latency-numbers` better.** Move them there when that node's sources are gathered.

**Files and storage devices:**
- **NVMe specs moved on 2026-08-04.** Base Specification 2.4 and NVM Command Set 1.3 (both ratified 2026-07-31) are current. Cite those, not 2.1/2.2. The SN740 itself is NVMe 1.4b, so its behavior follows the older revision; note that in the articles.
- **`torn-writes` needs the author's own numbers.** Whether RWF_ATOMIC works on this machine depends on the kernel (7.1.9 here, so new enough), the filesystem (btrfs: no support seen in any source opened) and the drive's AWUPF. The phase 1 append-only log should not assume atomic writes; recovery that drops a torn tail stays necessary. Suggest a small experiment reading AWUPF, VWC and the sysfs atomic values before writing the node.
- **LUKS drops TRIM by default.** If the `ssd-internals` article or a lab run talks about TRIM on the author's machine, check `allow_discards` first.

**Page cache and durability:**
- `fsync` is at risk of holding two concepts: "what fsync guarantees and costs" and "what happens when fsync fails" (fsyncgate, ATC 2020, Postgres PANIC). Suggest a short node `fsync-errors` (needs `fsync`, links `crash-consistency`) so the main `fsync` article stays one concept. Decision needed before writing.
- Several fsync sources (SQLite atomic commit, Dan Luu's two posts, ATC 2020) serve `crash-consistency`, `torn-writes` and `atomic-rename` as well. Whoever researches those nodes should start from this list.

**Crash consistency, encoding and the log:**
- **LazyFS can't catch a missing directory fsync.** Its own paper says it does not model metadata durability: a rename or file creation that was never fsynced still survives a LazyFS "crash". So a harness built only on LazyFS can't catch the `atomic-rename` bug (forgetting to fsync the directory), or a log that creates a new segment file without syncing the directory. dm-log-writes works at the block layer under a real file system (ext4), so it captures real metadata behavior, but only at flush points, and needs root, `dmsetup`, a loop device and the `replay-log` tool (last commit 2024-07-09). LazyFS is easier to aim (crash after the Nth fsync on file X, torn writes) and is maintained (release 0.3.1 on 2026-05-07, commit 2026-08-24). The decision record for `lab/crashtest` should weigh this; using both (LazyFS for data and torn writes, dm-log-writes for metadata ordering) is a real option.
- `fsync` and `torn-writes` are already their own phase 1 nodes; several sources here (Moyer, Rebello, PostgreSQL 28.1, SQLite `synchronous`) also serve `fsync`, and PostgreSQL 28.1 serves `torn-writes`. Worth reusing when those nodes are researched.

## Phase 1: The machine under the backend

Researched 2026-09-28 by five parallel passes, one per group below. The
new nodes `huge-pages` and `fsync-errors` came out of this research.

### Who and why, processes and the CPU
#### `backend-engineer` (short)

1. [Introduction (Site Reliability Engineering book, ch. 1)](https://sre.google/sre-book/introduction/), Benjamin Treynor Sloss, ed. Betsy Beyer, 2016 (book). Book chapter, primary: yes (Google's own definition of SRE). Good for the SRE side of the overlap. Seen 2026-09-28: the line "SRE is what happens when you ask a software engineer to design an operations team"; the 50% cap on ops work; sections "Ensuring Durable Focus on Engineering", "Pursuing Maximum Change Velocity Without Violating a Service's SLO", "Monitoring", "Emergency Response", "Change Management", "Demand Forecasting and Capacity Planning", "Provisioning", "Efficiency and Performance".
2. [What I Talk About When I Talk About Platforms](https://martinfowler.com/articles/talk-about-platforms.html), Evan Bottcher, 2018-03-05. Essay on martinfowler.com, primary: no (practitioner essay, but it's where the common definition comes from). Good for the platform side of the overlap. Seen 2026-09-28: defines a digital platform as "a foundation of self-service APIs, tools, services, knowledge and support which are arranged as a compelling internal product"; sections include "Platform as an internal product" and "Wait a minute… isn't this a 'DevOps Team'?".

#### `latency-numbers` (deep)

1. [Designs, Lessons and Advice from Building Large Distributed Systems](https://www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf), Jeff Dean, LADIS 2009 keynote (workshop held 2009-10-10/11). Slides, primary: yes (the origin of the "Numbers Everyone Should Know" table as usually quoted). Seen 2026-09-28: slide "Numbers Everyone Should Know": L1 cache reference 0.5 ns, branch mispredict 5 ns, L2 7 ns, mutex lock/unlock 25 ns, main memory reference 100 ns, compress 1K bytes with Zippy 3,000 ns, send 2K over 1 Gbps 20,000 ns, read 1 MB sequentially from memory 250,000 ns, round trip within same datacenter 500,000 ns, disk seek 10,000,000 ns, read 1 MB sequentially from disk 20,000,000 ns, packet CA->Netherlands->CA 150,000,000 ns. Next slide: "Back of the Envelope Calculations" (30 thumbnails example, 560 ms serial design). No SSD row.
2. [Teach Yourself Programming in Ten Years](https://norvig.com/21-days.html), Peter Norvig, undated page (Colin Scott's page, #3, says the numbers are from 2002). Essay, primary: yes for the older table. Shows the earlier version of the same table. Seen 2026-09-28: under "Answers", "Approximate timing for various operations on a typical PC": L1 0.5 ns, branch mispredict 5 ns, L2 7 ns, mutex 25 ns, main memory 100 ns, disk seek 8,000,000 ns (Dean says 10 ms), US to Europe and back 150 ms. No datacenter round trip, no machine named.
3. [Latency Numbers Every Programmer Should Know (interactive, by year)](https://colin-scott.github.io/personal_website/research/interactive_latency.html), Colin Scott, undated (slider 1990–2020). Interactive page, primary: no. Good for the history, and a warning: its numbers are extrapolated, not measured. Seen 2026-09-28: notes say "All of Norvig's original numbers were from 2002"; values are projected with y = a*b^x curves (clock speed flat at ~3 GHz after ~2005, memory latency falling 7%/year until 2000 then flat, disk doubling every 2 years before 2002 and every 5 after).
4. [napkin-math](https://github.com/sirupsen/napkin-math), Simon Eskildsen (sirupsen), README revalidated 2026-03-08. Repo with benchmark code, primary: yes (numbers come from runs in the repo, with the machine given). The only modern, measured table found. Seen 2026-09-28: machine is GCP `c4-standard-48-lssd` (Xeon 6985P-C, Ubuntu 22.04.5); "numbers rounded for memorization, not faux precision"; rows include sequential memory 0.5 ns per 64 B, random memory 20 ns, system call 300 ns, context switch 10 μs, random SSD read (8 KiB) 100 μs, sequential SSD write with fsync 300 μs, network within same region 250 μs, NA East <-> West 60 ms, EU West <-> NA East 80 ms, NA West <-> Singapore 180 ms. Note 2 says to use `fio` for real I/O numbers.
5. [lmbench: Portable Tools for Performance Analysis](https://www.usenix.org/legacy/publications/library/proceedings/sd96/full_papers/mcvoy.pdf), Larry McVoy and Carl Staelin, USENIX 1996 Annual Technical Conference. Paper, primary: yes. The method for measuring these numbers ourselves. Seen 2026-09-28: sections "3.4 Timing issues", "6.1 Memory read latency background" (defines back-to-back-load latency and says lmbench measures it), "6.2 Memory read latency" (a list of pointers per array size and stride, walked to find each cache level), "6.3 Operating system entry" (write one word to /dev/null, chosen because getpid and gettimeofday are too optimized), "6.6 Context switching" (ring of 2 to 20 processes passing a token over pipes, pipe overhead factored out). Also serves `system-call` and `context-switch`.
6. [Azure network round-trip latency statistics](https://learn.microsoft.com/en-us/azure/networking/azure-network-latency), Microsoft Learn, ms.date 2026-07-30 (updated 2026-08-20). Official docs, primary: yes. Real inter-region round-trip data with its method written down. Seen 2026-09-28: "How is latency measured?" says internal probes on the Azure backbone, 1-minute intervals, tables show P50 over a 30-day window, updated every 6 to 9 months; latency is directional (East US -> East US 2 is 8 ms, reverse 9 ms); examples: East US -> West US 69 ms, West Europe -> West US 146 ms, Southeast Asia -> West US 170 ms.

#### `process` (deep)

1. [fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html), Linux man-pages 6.19, page dated 2026-06-05. Man page, primary: yes. Seen 2026-09-28: DESCRIPTION opens "fork() creates a new process by duplicating the calling process" and lists what the child does not inherit; NOTES: "Under Linux, fork() is implemented using copy-on-write pages", so the cost is copying page tables and a new task structure.
2. [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html), Linux man-pages 6.19, page dated 2026-02-08. Man page, primary: yes. How to look at a process's state from outside (`/proc/pid`). Seen 2026-09-28: "The proc filesystem is a pseudo-filesystem which provides an interface to kernel data structures"; covers /proc/pid directories and the `hidepid` mount option. (Details of each file are split into separate proc_pid_* pages.)
3. [The Abstraction: The Process (OSTEP ch. 4)](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf), Remzi and Andrea Arpaci-Dusseau, © 2008–23. Textbook chapter, primary: no. Clearest plain explanation. Seen 2026-09-28: "a process ... is a running program"; sections 4.1 The Abstraction: A Process, 4.2 Process API, 4.3 Process Creation: A Little More Detail, 4.4 Process States, 4.5 Data Structures.
4. [Interlude: Process API (OSTEP ch. 5)](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf), Arpaci-Dusseau, © 2008–23. Textbook chapter, primary: no. Seen 2026-09-28: sections 5.1 The fork() System Call, 5.2 wait(), 5.3 exec(), 5.4 Why? Motivating The API, 5.5 Process Control And Users, 5.6 Useful Tools.
5. [A fork() in the road](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/04/fork-hotos19.pdf), Andrew Baumann, Jonathan Appavoo, Orran Krieger, Timothy Roscoe, HotOS 2019. Paper, primary: yes. The counter-view for "Where it gets tricky". Seen 2026-09-28: argues fork should be deprecated as the main way to create processes; Figure 1 times fork+exec by parent size on Ubuntu 16.04.3, i7-6850K at 3.6 GHz; posix_spawn() takes "around 0.5 ms" regardless of parent size; "Fork doesn't scale" paragraph.

#### `thread` (deep)

1. [pthreads(7)](https://man7.org/linux/man-pages/man7/pthreads.7.html), Linux man-pages 6.19, page dated 2026-02-08. Man page, primary: yes. Seen 2026-09-28: threads "share the same global memory (data and heap segments), but each thread has its own stack"; lists the attributes POSIX requires to be process-wide (process ID first) and the per-thread ones; LinuxThreads vs NPTL section: both are "1:1 implementations", built on clone(2), with sync on futex(2).
2. [clone(2)](https://man7.org/linux/man-pages/man2/clone.2.html), Linux man-pages 6.19, page dated 2026-06-06. Man page, primary: yes. Shows that on Linux a thread is a task that shares things. Seen 2026-09-28: "If CLONE_VM is set, the calling process and the child process run in the same memory space"; `CLONE_THREAD (since Linux 2.4.0)` puts the child in the same thread group.
3. [Concurrency: An Introduction (OSTEP ch. 26)](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf), Arpaci-Dusseau, © 2008–23. Textbook chapter, primary: no. Seen 2026-09-28: sections 26.1 Why Use Threads?, 26.2 An Example: Thread Creation, 26.3 Why It Gets Worse: Shared Data, 26.4 The Heart Of The Problem: Uncontrolled Scheduling, 26.5 The Wish For Atomicity.
4. [The Native POSIX Thread Library for Linux](https://akkadia.org/drepper/nptl-design.pdf), Ulrich Drepper and Ingo Molnar, 2005-02-21. Design paper from the builders, primary: yes. Why Linux threads are 1:1. Seen 2026-09-28: section "1-on-1 vs. M-on-N" and the consensus against M-on-N; a benchmark where starting 100,000 threads went from 15 minutes to 2 seconds. Opens with a warning that its descriptions of limitations are "completely, utterly out of date", so use it for design reasons only.
5. [Measuring context switching and memory overheads for Linux threads](https://eli.thegreenplace.net/2018/measuring-context-switching-and-memory-overheads-for-linux-threads/), Eli Bendersky, 2018-09-04. Blog with code, primary: no. What a thread costs in memory. Seen 2026-09-28: default 8 MiB stack is virtual until touched; 10,000 threads showed ~80 GiB virtual but ~80 MiB resident; `pthread_attr_setstacksize`. Also serves `context-switch`.

#### `system-call` (deep)

1. [syscall(2)](https://man7.org/linux/man-pages/man2/syscall.2.html) and [syscalls(2)](https://man7.org/linux/man-pages/man2/syscalls.2.html), Linux man-pages 6.19, dated 2026-02-02 and 2026-02-08. Man pages, primary: yes. Seen 2026-09-28: syscall(2) has the per-architecture tables of the trap instruction and which registers carry the syscall number, arguments and return value; syscalls(2) is the full list of Linux system calls with the kernel version each appeared in.
2. [vdso(7)](https://man7.org/linux/man-pages/man7/vdso.7.html), Linux man-pages 6.19, dated 2025-12-25. Man page, primary: yes. Seen 2026-09-28: "Making system calls can be slow"; int $0x80 "goes through the full interrupt-handling paths"; with the vDSO, gettimeofday "changes from a system call to a normal function call and a few memory accesses"; per-arch symbol tables (x86-64 `__vdso_clock_gettime`, `__vdso_gettimeofday`).
3. [Anatomy of a system call, part 1](https://lwn.net/Articles/604287/), David Drysdale, LWN, 2014-07-09. Article, primary: no (but from kernel source, high quality). Seen 2026-09-28: walks `sys_call_table`, the SYSCALL instruction, MSR_LSTAR set with `wrmsrl` at boot. Code is from a 2014 kernel; the entry code has moved since (check against current source when writing).
4. [Mechanism: Limited Direct Execution (OSTEP ch. 6)](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf), Arpaci-Dusseau, © 2008–23. Textbook chapter, primary: no. Seen 2026-09-28: 6.2 Problem #1: Restricted Operations (trap, return-from-trap, trap table, kernel stack); says 1996 Linux 1.3.37 on a 200 MHz P6 took ~4 μs per syscall and ~6 μs per context switch, and modern systems are "sub-microsecond"; a measurement homework on timing syscalls and context switches (pin with sched_setaffinity, mind the timer's precision). Also serves `context-switch`.
5. [Page Table Isolation (PTI)](https://docs.kernel.org/arch/x86/pti.html), kernel docs (docs.kernel.org showed 7.3.0-rc5). Official docs, primary: yes. The post-Meltdown cost, from the kernel itself. Seen 2026-09-28: 23.3 Overhead: CR3 writes "on the order of a hundred cycles" at every entry and exit; loss of global pages "never exceeding 1%"; PCID lets the kernel skip full TLB flushes; without PCID every CR3 write flushes the whole TLB.
6. [KPTI/KAISER Meltdown Initial Performance Regressions](https://www.brendangregg.com/blog/2018-02-09/kpti-kaiser-meltdown-performance.html), Brendan Gregg, 2018-02-09. Engineering blog (Netflix), primary: yes (his own measurements, Linux 4.14.11/12 on EC2). Seen 2026-09-28: five factors (syscall rate, context switches, page faults, working set size, cache access pattern); "At 50k syscalls/sec per CPU the overhead may be 2%"; example 5k syscalls/s/CPU with 100 MB working set: 2.1% without PCID, ~0.5% with PCID (Linux 4.14), a 3.0% gain with huge pages; one microbenchmark point over 800% overhead without PCID.

Also relevant, not counted: [The current state of kernel page-table isolation](https://lwn.net/Articles/741878/), Jonathan Corbet, LWN, 2017-12-20: "KPTI comes with a measurable run-time cost, estimated at about 5%", and the `nopti` boot option. And lmbench (`latency-numbers` #5, section 6.3).

#### `cpu-scheduler` (short)

1. [EEVDF Scheduler](https://docs.kernel.org/scheduler/sched-eevdf.html), kernel docs (7.3.0-rc5 tree). Official docs, primary: yes. Seen 2026-09-28: EEVDF from a 1995 paper; each task gets a "lag"; picks eligible tasks (lag >= 0) with the earliest virtual deadline; sleeping tasks get "deferred dequeue" so lag decays; tasks can ask for a time slice with sched_setattr(). Companion page [CFS Scheduler](https://docs.kernel.org/scheduler/sched-design-CFS.html) now says "CFS is making room for EEVDF".
2. [An EEVDF CPU scheduler for Linux](https://lwn.net/Articles/925371/), Jonathan Corbet, LWN, 2023-03-09. Article, primary: no. Seen 2026-09-28: CFS merged in 2.6.23; explains lag and eligibility with examples. Follow-up [Completing the EEVDF scheduler](https://lwn.net/Articles/969062/), Corbet, 2024-04-11: "Lag and sleeping" section, time-slice requests. [Linux 6.6 on Kernel Newbies](https://kernelnewbies.org/Linux_6.6) (6.6 released 2023-10-29), section "1.1. New task scheduler: EEVDF", confirms the replacement.

#### `context-switch` (short)

1. [How long does it take to make a context switch?](https://blog.tsunanet.net/2010/11/how-long-does-it-take-to-make-context.html), Benoit Sigoure, 2010-11-14. Blog with code, primary: yes (own measurements). Seen 2026-09-28: futex ping-pong on Intel CPUs from Woodcrest to Sandy Bridge; gettid syscall ~52–105 ns; unpinned switch ~3–4.5 μs, pinned ~1.3–1.9 μs; cache pollution as the hidden cost; "rule of thumb ... about 30µs of CPU overhead" as a worst case.
2. See `thread` #5 (Bendersky 2018): pipe and condvar ping-pong, pinned with taskset, "between 1.2 and 1.5 microseconds per context switch", ~2.2 μs unpinned, Haswell i7-4771; Go goroutines compared.

Also: `latency-numbers` #5 (lmbench 6.6) for method, `system-call` #4 (OSTEP) for the pin-to-one-core advice.

#### `signals` (short)

1. [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html), Linux man-pages 6.19, dated 2026-02-08. Man page, primary: yes. Seen 2026-09-28: table of standard signals with default actions (SIGKILL, SIGPIPE "Broken pipe: write to pipe with no readers", SIGTERM, all "Term"); "The signals SIGKILL and SIGSTOP cannot be caught, blocked, or ignored"; per-arch signal number table (SIGKILL 9, SIGPIPE 13, SIGTERM 15 on x86).
2. [Pod Lifecycle: Termination of Pods](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/), Kubernetes docs. Official docs, primary: yes. Where graceful shutdown shows up in practice. Seen 2026-09-28: grace period "defaults to 30 seconds"; the runtime first sends TERM (or the image's STOPSIGNAL), then KILL when the grace period ends; preStop hooks run first; custom stop signals behind the ContainerStopSignals feature gate. (Page WebFetch was truncated; read in full via curl.)

#### `strace` (short)

1. [strace(1)](https://man7.org/linux/man-pages/man1/strace.1.html), from the strace git repo (2026-07-15 state), on man7.org. Man page, primary: yes. Seen 2026-09-28: `-f` follows threads/children, `-p pid` attaches, `-c` counts time and calls per syscall, `-e trace=` filters; BUGS: "A traced process runs more slowly than a non-traced one. The performance impact can be mitigated by using the --seccomp-bpf option."
2. [strace Wow Much Syscall](https://www.brendangregg.com/blog/2014-05-11/strace-wow-much-syscall.html), Brendan Gregg, 2014-05-11. Engineering blog, primary: yes (own measurement). Seen 2026-09-28: `dd if=/dev/zero of=/dev/null bs=1 count=500k` went from 0.10 s to 45.96 s under strace (442x); ptrace stops the process at syscall entry and exit; suggests perf trace, sysdig, ktap, SystemTap, LTTng. Dated: predates `--seccomp-bpf`.

**Disagreements and tensions**


- **Disk seek:** Dean (2009) 10 ms, Norvig (2002 per Colin Scott) 8 ms.
- **Main memory:** Dean and Norvig say 100 ns per main memory reference; napkin-math (2026) lists random memory R/W at 20 ns. They likely measure different things (one dependent miss vs many in flight), which is exactly the pointer-chasing point lmbench makes about back-to-back loads. The article should measure both on our machine.
- **Context switch cost:** OSTEP says modern systems are "sub-microsecond"; Bendersky measured 1.2–1.5 μs pinned (2018); Sigoure 1.3–4.5 μs direct (2010) and 30 μs worst case with cache effects; napkin-math lists 10 μs. The spread is direct cost vs cache-inclusive cost, and pinned vs unpinned.
- **KPTI cost:** LWN (2017) "about 5%"; kernel docs call global-page loss "never exceeding 1%"; Gregg (2018) shows 0.5% to over 800% depending on syscall rate, working set and PCID. There is no single number.
- **EEVDF status:** kernelnewbies says 6.6 replaced CFS; LWN 2024 says EEVDF was "merged as an option for the 6.6 kernel"; the kernel EEVDF doc says Linux "began transitioning ... in version 6.6 (as a new option in 2024)" (6.6 came out in 2023). And sched(7) in man-pages 6.19 (2026) still says "the default scheduler is CFS" with no mention of EEVDF. Needs checking against the kernel source and our own kernel (Linux 7.1 on the author's machine).
- **fork:** man pages and OSTEP teach fork+exec as the model; Baumann et al. (2019) argue it should be retired in favour of posix_spawn-style calls.
- **Colin Scott's page** shows projected, not measured, numbers for years after 2002; easy to mistake for measurements.

**Couldn't open**


- None failed outright. WebFetch couldn't read the text of the Dean slides PDF, the lmbench PDF, and the full Kubernetes page (truncated); all three were read in full through curl (+ pdftotext for PDFs).

**Rejected**


- [What Every Programmer Should Know About Memory](https://akkadia.org/drepper/cpumemory.pdf), Drepper, 2007-11-21. Opened; section 3.3 does pointer-chasing with `NPAD` padding (Figures 3.10, 3.11). Belongs to `memory-hierarchy`/`cpu-cache`, not these nodes; keep for those.
- [GitLab Backend Engineer job description](https://handbook.gitlab.com/job-description-library/engineering/backend-engineer/). Opened: one company's job ladder (features, code review, on-call, specialties like Database and Infrastructure). Too company-specific to define the role.
- [Platform engineering (Wikipedia)](https://en.wikipedia.org/wiki/Platform_engineering). Opened; tertiary, and Bottcher's essay is the better source.
- Web search results for "backend vs data engineer" (boot.dev, Medium, logiciel.io, Glassdoor): career-content blogs, not opened as candidates.

**Gaps**


- `backend-engineer`: no solid source on the data engineering overlap, and no primary source defining "backend engineer" itself. The node may have to be mostly our own framing, with SRE and platform sources for the edges.
- `latency-numbers`: no source with a real SSD latency number from the drive side (napkin-math's is rounded; its own note points to `fio`). Only Azure found for inter-region RTT; AWS and GCP not checked. Everything else is covered.
- `system-call`: LWN anatomy article is from 2014; current x86 entry code isn't covered by a recent source.
- `strace`: no source measuring overhead with `--seccomp-bpf`; would be our own experiment.

### Memory
#### `memory-hierarchy` (deep)
1. [What Every Programmer Should Know About Memory](https://www.akkadia.org/drepper/cpumemory.pdf), Ulrich Drepper, 2007-11-21 (Version 1.0). paper, primary: yes. The standard long read on caches, DRAM and how software sees them. Seen 2026-09-28: sections 2 (RAM), 3 (CPU caches), 4 (virtual memory); in section 3 a table of Intel's numbers for a Pentium M: register ≤1 cycle, L1d ~3, L2 ~14, main memory ~240; states cache lines are "nowadays" 64 bytes; working-set-size graphs showing cycles per list element jump as the set outgrows L1d and L2. Old hardware (2007), so the numbers are for shape, not for today.
2. [Memory part 1: What every programmer should know about memory](https://lwn.net/Articles/250967/), Ulrich Drepper, LWN.net, 2007-09-21. paper (serialized), primary: yes. Same text in HTML, split into 9 parts, easier to read and link than the PDF. Seen 2026-09-28: part 1 covers Northbridge/Southbridge, SRAM vs DRAM, DRAM access protocol, SDR/DDR/DDR2/DDR3; links to parts 2 (CPU caches) through 9 (appendices).
3. [Gallery of Processor Cache Effects](http://igoro.com/archive/gallery-of-processor-cache-effects/), Igor Ostrovsky, 2010. blog explainer, primary: no. Seven small C# experiments that make the hierarchy visible; a good model for our own measurements. Seen 2026-09-28: examples 1 (memory accesses and performance), 2 (impact of cache lines, 64-byte lines), 3 (L1 and L2 sizes, his machine had 32KB L1 and 4MB L2, visible as steps in the graph), 4 ILP, 5 associativity, 6 false sharing (4.3 s vs 0.28 s), 7 hardware complexities.
4. [Latency Numbers Every Programmer Should Know (interactive)](https://colin-scott.github.io/personal_website/research/interactive_latency.html), Colin Scott, undated (slider to 2020). secondary, primary: no. The popular numbers, with the method shown. Seen 2026-09-28: slider 1990 to 2020; L1 3 cycles, L2 13 cycles, main memory ~100 ns, SSD random read ~20 µs, same-datacenter round trip 500 µs; code comments say uncited numbers come from Norvig's 2002 list and the rest are extrapolated with `y = a*b^x` curves. Extrapolated, not measured: use to show why we measure our own.
5. [AMD's Ryzen 9950X: Zen 5 on Desktop](https://chipsandcheese.com/p/amds-ryzen-9950x-zen-5-on-desktop), Chester Lam, Chips and Cheese, 2024-08-14. measurement blog, primary: no (independent measurements). A current CPU measured with pointer-chasing tests, to set against Drepper's 2007 table. Seen 2026-09-28: 48 KB L1D (up from 32 KB on Zen 4), 32 MB L3 per 8-core CCD, DDR5-6000 memory latency "just over 70 ns", cross-cluster core-to-core latency near 200 ns. I did not confirm exact L2/L3 latency figures on the page; check when re-opened.

#### `cpu-cache` (short)
1. [Memory part 2: CPU caches](https://lwn.net/Articles/252125/), Ulrich Drepper, LWN.net, 2007-10-01. paper (serialized), primary: yes. Cache lines, hits and misses, and MESI coherency. Seen 2026-09-28: "early caches these lines were 32 bytes long; now the norm is 64 bytes"; the Pentium M cycle table; MESI states (Modified, Exclusive, Shared, Invalid) and RFO messages. Does not itself cover false sharing.
2. [Memory part 6: More things programmers can do](https://lwn.net/Articles/256433/), Ulrich Drepper, LWN.net, 2007-10-31. paper (serialized), primary: yes. The false-sharing part. Seen 2026-09-28: section 6.4.1 (concurrency optimizations), Figure 6.10 with threads incrementing a location 500 million times; overheads of 390%, 734% and 1,147% for shared vs separate cache lines; advice to separate read-only from read-write data and pad to cache lines.

See also `memory-hierarchy` #3 (example 6, false sharing, measured).

#### `virtual-memory` (deep)
1. [OSTEP ch. 18: Paging: Introduction](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf), Remzi and Andrea Arpaci-Dusseau, © 2008–25. textbook chapter, primary: no. The clearest from-scratch explanation of pages, page tables and PTEs. Seen 2026-09-28: 18.1 simple example, 18.2 where page tables are stored, 18.3 what's in the page table, 18.4 "Paging: Also Too Slow", 18.5 a memory trace.
2. [OSTEP ch. 19: Paging: Faster Translations (TLBs)](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf), Arpaci-Dusseau, © 2008–23. textbook chapter, primary: no. TLBs and why locality makes them work. Seen 2026-09-28: 19.1 TLB control-flow algorithm (Figure 19.1), 19.2 array example (miss, hit, hit, miss... 70% hit rate from spatial locality), 19.5 context switches, 19.7 a real TLB entry (MIPS), 19.8 summary on "exceeding the TLB coverage" and larger pages as the fix.
3. [Page Tables (Linux kernel docs)](https://docs.kernel.org/mm/page_tables.html), kernel community, living doc. official docs, primary: yes. How Linux actually lays out page tables. Seen 2026-09-28: "Page tables map virtual addresses as seen by the CPU into physical addresses..."; 4 KiB pages (PAGE_SHIFT 12); five levels PGD, P4D, PUD, PMD, PTE; sections "Page Table Folding" and "MMU, TLB, and Page Faults"; huge pages mapped at higher levels.
4. [Memory Management Concepts Overview (Linux kernel docs)](https://docs.kernel.org/admin-guide/mm/concepts.html), kernel community, living doc. official docs, primary: yes. Short tour of virtual memory, huge pages, page cache, anonymous memory, reclaim and the OOM killer. Seen 2026-09-28: demand paging; "Usually TLB is pretty scarce resource"; huge pages "significantly reduces pressure on TLB"; anonymous memory reads map zeroed pages until written; kswapd vs direct reclaim.
5. [Transparent Hugepage Support (Linux kernel docs)](https://docs.kernel.org/admin-guide/mm/transhuge.html), kernel community, living doc. official docs, primary: yes. The huge-pages part, with its costs. Seen 2026-09-28: benefits (fewer TLB misses, fewer faults); modes `always`, `madvise`, `never`; warning that touching 1 byte of a large mmap can get a 2M page instead of 4k; mTHP (multi-size THP) and latency spikes.
6. [Memory part 3: Virtual Memory](https://lwn.net/Articles/253361/), Ulrich Drepper, LWN.net, 2007-10-09. paper (serialized), primary: yes. Hardware view: multi-level tables, TLB cost, ASIDs, huge pages. Seen 2026-09-28: 2^20-entry single-level table "not practical"; TLB flushed on context switch unless tagged with address-space IDs; section 4.3.2 on large pages and hugetlbfs.

#### `page-faults` (short)
1. [getrusage(2)](https://man7.org/linux/man-pages/man2/getrusage.2.html), Linux man-pages 6.19, page dated 2026-02-08. man page, primary: yes. The official minor/major definitions and the counters we can read. Seen 2026-09-28: `ru_minflt` "serviced without any I/O activity"; `ru_majflt` "serviced that required I/O activity".
2. [OSTEP ch. 21: Beyond Physical Memory: Mechanisms](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys.pdf), Arpaci-Dusseau, © 2008–23. textbook chapter, primary: no. What the OS does on a fault. Seen 2026-09-28: 21.1 swap space, 21.2 present bit, 21.3 the page fault (page-fault handler, the process blocks during I/O while another runs), 21.4 what if memory is full, 21.5 page fault control flow; aside on "page fault" terminology.

See also `virtual-memory` #3 (section "MMU, TLB, and Page Faults": lazy allocation and copy-on-write faults, `handle_mm_fault()`).

#### `heap-and-stack` (short)
1. [Go FAQ: How do I know whether a variable is allocated on the heap or the stack?](https://go.dev/doc/faq#stack_or_heap), Go team, living doc. official docs, primary: yes. Go's rule, and escape analysis. Seen 2026-09-28: correctness doesn't depend on it; locals go in the stack frame when possible; heap if the compiler can't prove the variable isn't referenced after return, or if it's very large; taking the address makes it a heap candidate, escape analysis rescues some.
2. [OSTEP ch. 14: Interlude: Memory API](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-api.pdf), Arpaci-Dusseau, © 2008–25. textbook chapter, primary: no. Stack vs heap in C, malloc/free, the classic bugs. Seen 2026-09-28: 14.1 types of memory (stack vs heap), 14.2 malloc, 14.3 free, 14.4 common errors, 14.5 underlying OS support (brk/sbrk, mmap).

See also `garbage-collection` #1 (section "Where Go values live").

#### `garbage-collection` (deep)
1. [A Guide to the Go Garbage Collector](https://go.dev/doc/gc-guide), Go team, living doc; says it "currently describes the garbage collector as of Go 1.19". official docs, primary: yes. The main source for how Go's GC works and how to tune it. Seen 2026-09-28: sections Where Go Values Live, Tracing GC, The GC Cycle, Understanding Costs, GOGC, Memory Limit (GOMEMLIMIT, Go 1.19, soft limit), Latency ("not fully stop-the-world and does most of its work concurrently"; brief STW pauses at phase transitions; "reducing GC frequency may also lead to latency improvements"), A Note About Virtual Memory, Optimization Guide.
2. [Getting to Go: The Journey of Go's Garbage Collector](https://go.dev/blog/ismmkeynote), Rick Hudson, Go blog, 2018-07-12. talk transcript by the builder, primary: yes. Why Go's GC is concurrent, non-moving and non-generational. Seen 2026-09-28: pause history 300–400 ms (Aug 2015) down to sub-1 ms (Mar 2017); SLO of "500 microseconds stop the world pause per GC cycle"; failed attempts (Request-Oriented Collector, generational) and why the write barrier wasn't fast enough; tri-color concurrent marking.
3. [The Green Tea Garbage Collector](https://go.dev/blog/greenteagc), Michael Knyszek and Austin Clements, Go blog, 2025-10-29. engineering blog by the builders, primary: yes. The current Go GC: marks by page, not object, for cache locality. Seen 2026-09-28: experiment in Go 1.25 (`GOEXPERIMENT=greenteagc`); "around 10% less time in the garbage collector", "up to 40%" for some; problem is poor cache use from the object graph walk. Also opened [Go 1.26 release notes](https://go.dev/doc/go1.26): Green Tea is on by default in Go 1.26 (Feb 2026), "10–40% reduction in garbage collection overhead" expected, opt out with `GOEXPERIMENT=nogreenteagc`, opt-out expected to go in 1.27.
4. [JEP 439: Generational ZGC](https://openjdk.org/jeps/439), OpenJDK, delivered in JDK 21 (created 2021-08-25, updated 2024-10-07). spec/enhancement proposal, primary: yes. The JVM's low-pause collector and why it went generational. Seen 2026-09-28: goals "Pause times should not exceed 1 millisecond", heaps "from a few hundred megabytes up to many terabytes"; weak generational hypothesis; Cassandra benchmark with a quarter of the heap and four times the throughput vs non-generational ZGC. Also opened the [ZGC wiki](https://wiki.openjdk.org/display/zgc/Main) (updated 2026-07-02): generational default from JDK 23, non-generational removed in JDK 24; heaps up to 16TB.
5. [Shenandoah GC wiki](https://wiki.openjdk.org/display/shenandoah/Main), OpenJDK, last updated 2026-05-28. official docs, primary: yes. The other JVM low-pause collector, with concurrent compaction. Seen 2026-09-28: pause times "no longer directly proportional to the size of the heap" (200 GB vs 2 GB), most pauses 0–10 ms; concurrent compaction; in OpenJDK 12+, backported to 11u; generational mode introduced in JDK 25.
6. [Why Discord is switching from Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust), Jesse Howarth, Discord, 2020-02-04. engineering blog, primary: yes (for their case). A real server where GC hurt tail latency. Seen 2026-09-28: Read States service; Go 1.9.2 (1.8 and 1.10 also tried); spikes every 2 minutes because "Go will force a garbage collection run every 2 minutes at minimum", scanning a huge LRU cache; tuning GC percent didn't help, shrinking the cache raised p99 from DB loads; Rust version removed the spikes. Checked Go source [runtime/proc.go](https://raw.githubusercontent.com/golang/go/master/src/runtime/proc.go) on master: `var forcegcperiod int64 = 2 * 60 * 1e9` is still there.

**Disagreements and tensions**


- **Latency numbers don't agree, and age matters.** Drepper's table (Pentium M, 2007) puts main memory at ~240 cycles; Colin Scott's page shows ~100 ns, extrapolated from Norvig's 2002 numbers; Chips and Cheese measured just over 70 ns on a 2024 desktop with DDR5. None is our machine. This backs the plan to measure on my own box (`latency-numbers`).
- **Generational or not.** Hudson (2018) explains Go dropped a generational design because the write barrier cost too much for Go's workloads. The JVM went the other way: ZGC went generational in JDK 21 and dropped the non-generational mode in JDK 24; Shenandoah added a generational mode in JDK 25. Different languages (value types, escape analysis in Go) are the stated reason, not a contradiction, but the article should say so.
- **"Pause" vs "cost".** Go's STW pauses have been sub-millisecond since 2017 (Hudson), yet Discord saw latency spikes in 2020. The Discord post blames the forced 2-minute GC scanning a large heap, not pause length. So "GC pauses" is too narrow; the node should cover mark work and CPU during a cycle too.
- **Pause targets.** ZGC aims at under 1 ms; the Shenandoah wiki says most pauses are 0–10 ms.
- **Go GC guide is partly stale.** It says it describes Go 1.19, while Go 1.26 (Feb 2026) changed the marking algorithm to Green Tea. Tuning knobs (GOGC, GOMEMLIMIT) still apply; internals should be checked against the Green Tea post.
- **Discord is old.** Go 1.9.2 in 2020; GOMEMLIMIT (1.19) and Green Tea (1.26) came later and the post never re-tested. The forced 2-minute GC still exists in the runtime source today.
- **Huge pages help and hurt.** Kernel docs list fewer TLB misses and faults, and in the same doc warn about memory bloat and latency; the right THP mode depends on the workload.

**Couldn't open**


- Nothing failed outright. The Drepper PDF and OSTEP PDFs came back as binary through WebFetch; I read them as text by piping the download through `pdftotext` (nothing saved to disk).

**Rejected**


- [JEP 379: Shenandoah (Production)](https://openjdk.org/jeps/379): only promotes Shenandoah out of experimental in JDK 15; no technical claims. The Shenandoah wiki is better.
- [Proposal: Soft memory limit](https://github.com/golang/proposal/blob/master/design/48409-soft-memory-limit.md), Michael Knyszek, 2021-09-15: good (death spirals, 50% GC CPU cap), but over the 6-per-node limit and the GC guide covers GOMEMLIMIT for users. Keep as backup if the article goes into the memory limit's design.
- OSTEP ch. 13 [The Abstraction: Address Spaces](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf) and ch. 20 [Paging: Smaller Tables](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-smalltables.pdf): opened (13.3 the address space, 13.4 goals incl. isolation; 20.3 multi-level page tables). Left out only for the 6 cap; ch. 13 may fit `process` better, ch. 20 is a good backup for multi-level tables.
- Search results on the forced GC (golang-nuts thread, Hacker News, golinuxcloud): not opened as candidates; the runtime source itself was checked instead.
- Chips and Cheese Zen 4 and gaming articles: seen only in search results, not opened.

**Gaps**


- `memory-hierarchy`: no current primary vendor source (Intel or AMD optimization manual) with cache latencies. Drepper is primary but from 2007. Disk and SSD latency as the bottom of the hierarchy only comes from Colin Scott's extrapolated page; a proper SSD/NVMe source is missing (may belong to phase 1's storage nodes anyway).
- `cpu-cache`: both candidates are Drepper 2007. A Go-specific false-sharing source (e.g. padding in Go's runtime or `sync` code) would help the lab, which is in Go. Not searched yet.
- `page-faults`: no source measuring the cost of a minor vs major fault in time. Our own experiment would have to fill that.
- `heap-and-stack`: nothing yet on what an allocation costs in Go (allocator design, `tcmalloc`-style size classes). Not searched.
- `garbage-collection`: no G1 source (the JVM default collector). The node note asks for a low-pause collector, so ZGC/Shenandoah cover it, but if the article compares against the default, G1 docs are needed.

### Files and storage devices
#### `file-descriptor` (short)

1. [open(2)](https://man7.org/linux/man-pages/man2/open.2.html), Linux man-pages project, man-pages 6.19 (2026-02-08). man page, primary: yes. The canonical place for the fd vs open file description split. Seen 2026-09-28: DESCRIPTION says open() "creates a new open file description, an entry in the system-wide table of open files", which "records the file offset and the file status flags"; a descriptor is "a reference to an open file description". Explains that dup(2) and fork(2) give descriptors that share one open file description (and so the offset). States the returned fd is "the lowest-numbered file descriptor not currently open". ERRORS lists EMFILE and points to RLIMIT_NOFILE in getrlimit(2).
2. [getrlimit(2)](https://man7.org/linux/man-pages/man2/getrlimit.2.html), Linux man-pages project, man-pages 6.19 (2026-02-08). man page, primary: yes. The ulimit side. Seen 2026-09-28: RLIMIT_NOFILE is "a value one greater than the maximum file descriptor number that can be opened by this process"; going over it gives EMFILE from open, pipe, dup. Since Linux 4.5 it also caps fds "in flight" over UNIX domain sockets.

#### `block-device` (short)

1. [sysfs-block ABI (stable)](https://www.kernel.org/doc/Documentation/ABI/stable/sysfs-block), Linux kernel docs, entries dated 2009 to 2024. official docs, primary: yes. Defines the numbers you read from `/sys/block/<disk>/queue/` on your own machine. Seen 2026-09-28: `logical_block_size` (May 2009) is "the smallest unit the storage device can address", typically 512 bytes. `physical_block_size` (May 2009) is "the smallest unit a physical storage device can write atomically", with the example of SATA drives with 4KB sectors exposing 512-byte logical blocks. `write_cache` (April 2016) shows "write back" or "write through" and warns that writing to it changes only the kernel's view, not the device. Also has `atomic_write_unit_min_bytes` / `_max_bytes` / `atomic_write_max_bytes` (February 2024), useful for `torn-writes`.
2. [Multi-Queue Block IO Queueing Mechanism (blk-mq)](https://docs.kernel.org/block/blk-mq.html), Linux kernel docs, no author or date on the page. official docs, primary: yes. The block layer between filesystems and NVMe queues. Seen 2026-09-28: sections Introduction (Background, Operation), Software staging queues, Hardware dispatch queues, Tag-based completion. Says the old single-queue, single-lock design was built for hard disks and that with SSDs and NVMe "the bottleneck of the stack had moved from the storage device to the operating system". Per-CPU software queues (`blk_mq_ctx`) do merging and scheduling; hardware dispatch queues (`blk_mq_hw_ctx`) map to the device.

#### `filesystem` (deep)

1. [OSTEP ch. 40, File System Implementation](https://pages.cs.wisc.edu/~remzi/OSTEP/file-implementation.pdf), Remzi and Andrea Arpaci-Dusseau, © 2008–26. book chapter, primary: no. The clearest from-scratch walk through a simple filesystem (vsfs). Seen 2026-09-28: sections 40.1 The Way To Think through 40.8 Summary, including 40.3 The Inode, 40.4 Directory Organization, 40.5 Free Space Management, 40.6 Access Paths, 40.7 Caching and Buffering. Uses 4 KB blocks and 256-byte inodes (16 per block); works out that 12 direct pointers plus single and double indirect blocks give a file of just over 4 GB.
2. [OSTEP ch. 42, Crash Consistency: FSCK and Journaling](https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf), Remzi and Andrea Arpaci-Dusseau, © 2008–23. book chapter, primary: no. Why journaling exists, step by step. Seen 2026-09-28: sections 42.1 A Detailed Example, 42.2 The File System Checker, 42.3 Journaling (or Write-Ahead Logging), 42.4 Other Approaches, 42.5 Summary. Covers data journaling vs "ordered journaling (or just metadata journaling)" and names ext3, NTFS and XFS as metadata-journaling users.
3. [ext4 General Information](https://docs.kernel.org/admin-guide/ext4.html), Linux kernel docs, no date on the page. official docs, primary: yes. The source for ext4's three data modes. Seen 2026-09-28: Data Mode section defines data=journal (all data into the journal first; disables delayed allocation and O_DIRECT), data=ordered, the default ("All data are forced directly out to the main file system prior to its metadata being committed to the journal"), and data=writeback (no ordering). Options section: barrier=1 is default and barriers make "volatile disk write caches safe to use".
4. [ext4 Journal (jbd2)](https://docs.kernel.org/filesystems/ext4/journal.html), Linux kernel docs, no date on the page. official docs, primary: yes. The on-disk shape of the journal. Seen 2026-09-28: block types (descriptor, commit, revocation, superblock v1/v2), checksum versions (COMPAT_CHECKSUM, CSUM_V2, CSUM_V3), and fast commits, which store "the minimal delta needed to recreate the affected metadata".
5. [Btrfs design](https://btrfs.readthedocs.io/en/latest/dev/dev-btrfs-design.html), btrfs project docs, "latest", no date. official docs, primary: yes. Needed because the author's machine runs btrfs: copy-on-write instead of a journal. Seen 2026-09-28: sections on Btree roots and Copy on write logging. New writes go to newly allocated blocks and pointers up to the superblock are updated; a commit flushes the btree blocks, then writes the superblock, and "Once the super block has been properly written to disk, the transaction is considered complete." Credits Ohad Rodeh's 2006 IBM work on B-trees and shadowing.
6. [Btrfs on-disk format](https://btrfs.readthedocs.io/en/latest/dev/On-disk-format.html), btrfs project docs, "latest", no date. official docs, primary: yes. Pairs with #5 for concrete layout. Seen 2026-09-28: superblock at 64 KiB with mirrors at 64 MiB and 256 GiB (mount reads only the first); root tree (1), extent tree (2), chunk tree (3), FS tree (5); "consists entirely of several trees. The trees use copy-on-write"; CRC32c checksums on superblocks and nodes.

Backup for XFS: [XFS Delayed Logging Design](https://docs.kernel.org/filesystems/xfs/xfs-delayed-logging-design.html), kernel docs, primary: yes. Seen 2026-09-28: XFS logs inodes and dquots logically and buffers physically; relogging; the Committed Item List (CIL) batches changes into one checkpoint. Useful if the article needs a second journaling design beside ext4.

#### `ssd-internals` (deep)

1. [OSTEP ch. 44, Flash-based SSDs](https://pages.cs.wisc.edu/~remzi/OSTEP/file-ssd.pdf), Remzi and Andrea Arpaci-Dusseau, © 2008–23. book chapter, primary: no. The best first read: builds an FTL up from raw flash. Seen 2026-09-28: sections 44.1 Storing a Single Bit (SLC/MLC/TLC) through 44.12 Summary, including 44.6 FTL Organization: A Bad Approach, 44.7 A Log-Structured FTL, 44.8 Garbage Collection, 44.9 Mapping Table Size, 44.10 Wear Leveling. Erase blocks "typically of size 128 KB or 256 KB" in the text, "128KB–2MB" in the summary. Explains the trim operation and write amplification.
2. [The Unwritten Contract of Solid State Drives](https://pages.cs.wisc.edu/~jhe/eurosys17-he.pdf), Jun He, Sudarsun Kannan, Andrea and Remzi Arpaci-Dusseau, EuroSys 2017. paper, primary: yes. Turns SSD internals into rules for the software above. Seen 2026-09-28: five rules in section 3: Request Scale, Locality, Aligned Sequentiality, Grouping By Death Time, Uniform Data Lifetime. Finds that locality is shaped most by the filesystem. Tool: WiscSee.
3. [Understanding the Robustness of SSDs under Power Fault](https://www.usenix.org/system/files/conference/fast13/fast13-final80.pdf), Mai Zheng, Joseph Tucek, Feng Qin, Mark Lillibridge, FAST 2013. paper, primary: yes. Real evidence of what cheap drives do when power is cut. Seen 2026-09-28: 15 SSDs from 5 vendors, over three thousand fault injection cycles; "13 out of the 15 devices" showed failures, including bit corruption, shorn writes, unserializable writes, metadata corruption and dead devices. Section 2 discusses supercapacitor-backed write-back caches. Old (2013): drives have changed, so use it for failure types, not current rates.
4. [NVM Express Base Specification, Revision 2.4](https://nvmexpress.org/wp-content/uploads/NVM-Express-Base-Specification-Revision-2.4-Ratified-2026.07.31.pdf), NVM Express, Inc., ratified 2026-07-31. spec, primary: yes. The contract for the volatile write cache and Flush. Seen 2026-09-28: Identify Controller field Volatile Write Cache (VWC) with the Volatile Write Cache Present (VWCP) bit; if present, the host turns it on or off with the Volatile Write Cache feature and uses the Flush command (section 7.2) "to request that the contents of a volatile write cache be made non-volatile". Huge (35,000+ lines of text); read only these parts.
5. [Writeback cache control](https://docs.kernel.org/block/writeback_cache_control.html), Linux kernel docs, no date. official docs, primary: yes. How Linux turns fsync into device flushes. Seen 2026-09-28: devices with a volatile write cache report completion before data is on stable storage; REQ_PREFLUSH flushes the cache before a request; REQ_FUA completes only after the data is "committed to non-volatile storage"; for devices without a volatile cache, the block layer drops both flags.
6. [Western Digital PC SN740 NVMe SSD product brief](https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/western-digital/product/internal-drives/pc-sn740-nvme-ssd/product-brief-pc-sn740-nvme-ssd.pdf), Western Digital (hosted on documents.sandisk.com), © 2024. vendor spec, primary: yes. The author's own drive. Seen 2026-09-28: PCIe Gen 4.0 x4, NVMe v1.4b, WD TLC 3D NAND, in-house controller; 256GB to 2048GB. Sequential read up to 4,000 / 5,000 / 5,150 / 5,150 MB/s, sequential write up to 2,000 / 4,000 / 4,900 / 4,850 MB/s, random read 240K / 460K / 740K / 650K IOPS, random write 470K / 800K / 800K / 800K IOPS (256GB / 512GB / 1TB / 2TB), measured with CrystalDiskMark 8.0.5 over a 1000MB LBA range. Endurance 200 / 300 / 400 / 500 TBW (JEDEC JESD219 client workload), MTTF up to 1.75M hours, 5-year warranty. **Does not state:** latency, queue depth for the IOPS figures, power-loss protection, whether it has DRAM or uses host memory, volatile write cache, SLC cache size, sector sizes, or atomic write units. Those have to be read off the drive itself (`nvme id-ctrl`, `/sys/block/.../queue/`).

#### `torn-writes` (short)

1. [pwritev2(2), RWF_ATOMIC](https://man7.org/linux/man-pages/man2/pwritev2.2.html), Linux man-pages project, man-pages 6.19 (2026-02-22). man page, primary: yes. The Linux API for untorn writes. Seen 2026-09-28: "RWF_ATOMIC (since Linux 6.11)"; torn-write protection means "all or none of the data from the write will be stored, but never a mix of old and new data". Only with O_DIRECT; length a power of two in [stx_atomic_write_unit_min, stx_atomic_write_unit_max]; naturally aligned; for durability O_SYNC or O_DSYNC still needed.
2. [NVM Express NVM Command Set Specification, Revision 1.3](https://nvmexpress.org/wp-content/uploads/NVM-Express-NVM-Command-Set-Specification-Revision-1.3-Ratified-2026.07.31.pdf), NVM Express, Inc., 2026-07-31. spec, primary: yes. What the drive actually promises. Seen 2026-09-28: section 2.1.4 Atomic Operation (Single vs Multiple Atomicity Mode, atomic boundaries NABSN/NABO/NABSPF); 2.1.4.2 AWUN/NAWUN. Identify Controller field text: AWUPF is the write size "guaranteed to be written atomically to the NVM across all namespaces ... during a power fail or error condition", in logical blocks, "a 0's based value" (so 0 means one block), and must be ≤ AWUN. Writes over AWUPF have "no guarantee of data returned on subsequent reads". (Revision 1.2, 2025-08-01, was also opened; same section, now superseded.)

**Disagreements and tensions**


- **Which kernel added atomic writes.** The pwritev2(2) man page says RWF_ATOMIC since Linux 6.11, and [LWN's 6.11 merge window](https://lwn.net/Articles/982034/) (Corbet, 2024-07-18) says the block subsystem gained atomic writes then. [LWN "Support for atomic block writes in 6.13"](https://lwn.net/Articles/1009298/) (Harjani and Mujoo, 2025-02-20) says the "vfs untorn writes" pull came in 6.13, and the [ext4 atomic writes doc](https://docs.kernel.org/6.17/filesystems/ext4/atomic_writes.html) says single-block ext4 support is 6.13+. My reading, to confirm while writing: 6.11 = raw block devices, 6.13 = ext4 and XFS, single fs block only; multi-block later (ext4 via bigalloc). Btrfs is not mentioned anywhere I opened.
- **16 KB tear boundary.** [LWN "Atomic writes without tears"](https://lwn.net/Articles/974578/) (Edge, 2024-05-24) reports a claim that NVMe has 16KB tear boundaries, with commenters saying it depends on AWUPF. The spec text makes it a per-device value, not a fixed 16 KB. Trust the spec plus the drive's own `nvme id-ctrl` output.
- **"physical_block_size is the atomic unit" vs AWUPF.** The sysfs ABI calls physical_block_size "the smallest unit a physical storage device can write atomically". NVMe reports atomicity separately (AWUPF). They may not match on a given drive; worth checking on the SN740.
- **Where the sysfs atomic files live.** The sysfs-block ABI lists `/sys/block/<disk>/atomic_write_*_bytes`; the ext4 doc says `/sys/block/<device>/queue/atomic_write_unit_min`. Check the real path on the author's machine before writing it down.
- **Journal vs copy-on-write.** ext4 and XFS protect metadata with a journal; btrfs never overwrites in place and commits by writing the superblock last. The filesystem article must present both, since the author's machine is btrfs.
- **Flush on encrypted disks.** dm-crypt (LUKS) ignores TRIM by default ([dm-crypt doc](https://docs.kernel.org/admin-guide/device-mapper/dm-crypt.html), opened 2026-09-28: "The default is to ignore discard requests", with a security warning if enabled). Affects the TRIM part of `ssd-internals` on the author's machine. The page says nothing about flush ordering through dm-crypt.

**Couldn't open**


- *BTRFS: The Linux B-Tree Filesystem*, Rodeh, Bacik, Mason, ACM TOS 9(3), 2013. ACM page (dl.acm.org/doi/10.1145/2501620.2501623) returned 403; IBM Research page (dominoweb.draco.res.ibm.com) refused the connection; direct PDF download timed out. This is the main btrfs paper. Try again or find an author copy.
- `docs.kernel.org/block/queue-sysfs.html` and `docs.kernel.org/ABI/stable/sysfs-block.html`: 404. Used the kernel.org plain-text ABI file instead.

**Rejected**


- [btrfs Introduction](https://btrfs.readthedocs.io/en/latest/Introduction.html): feature list only (COW, checksums crc32c/xxhash/sha256/blake2b, snapshots), no design detail. The design and on-disk-format pages cover it better.
- [XFS admin guide](https://docs.kernel.org/admin-guide/xfs.html): mostly mount options (logbufs, logbsize). Opened; says XFS is "a high performance journaling filesystem" but not how. The delayed logging design doc is the better XFS backup.
- LWN [974578](https://lwn.net/Articles/974578/), [982034](https://lwn.net/Articles/982034/), [1009298](https://lwn.net/Articles/1009298/) and the [ext4 atomic writes doc](https://docs.kernel.org/6.17/filesystems/ext4/atomic_writes.html): all opened and good, but `torn-writes` is short (1–2 sources). Kept above as backups for the version question.
- Scribd, manuals.plus, gzhls.at and retailer mirrors of the SN740 brief: copies; the vendor's own PDF was opened instead.
- ADATA "What is SSD PLP" page and the LinkedIn "Are SSD vendors cheating on FLUSH?" post: seen in search only, not opened; vendor marketing and a social post rank below the FAST paper and the NVMe spec.

**Gaps**


- **No SN740 latency, PLP, DRAM or write-cache facts from the vendor.** The brief is silent. Any of these must come from the drive (`nvme id-ctrl` for VWC and AWUPF, sysfs) and be written up as an experiment.
- **No current (2020s) primary study of consumer SSD behavior on power loss.** FAST 2013 is the best found; its drives are old.
- **No btrfs paper** (see Couldn't open). The btrfs docs cover the mechanism but not measured behavior.
- **No primary source on write amplification numbers** for real drives; OSTEP explains the idea only. A FAST paper measuring WAF would help if the article wants numbers.
- **file-descriptor**: no primary source on the kernel's per-process fd table itself (e.g. kernel docs or source). The man pages cover the user-visible split, which is enough for a short node.

### Page cache and durability
#### `page-cache` (deep)

1. [Documentation for /proc/sys/vm/](https://docs.kernel.org/admin-guide/sysctl/vm.html), Linux kernel docs, served as kernel 7.3.0-rc5 docs. Official docs, primary: yes. The reference for every writeback knob. Seen 2026-09-28: entries for `dirty_background_ratio`, `dirty_ratio`, `dirty_background_bytes`, `dirty_bytes`, `dirty_expire_centisecs`, `dirty_writeback_centisecs`, `drop_caches`. `dirty_background_ratio` is the point where background flusher threads start writing; `dirty_ratio` is the point where the writing process itself has to start writing out dirty data. Only one of each ratio/bytes pair is active at a time. `drop_caches` only drops clean pages. Caution: the page's own header still says it "is valid for Linux kernel version 2.6.29", and I didn't see default values stated for the dirty ratios, so defaults need another source or a measurement on my machine.
2. [Concepts overview](https://docs.kernel.org/admin-guide/mm/concepts.html), Linux kernel docs (7.x). Official docs, primary: yes. Short official definition of the page cache and how it fits with anonymous memory and reclaim. Seen 2026-09-28: sections "Page Cache", "Anonymous Memory", "Reclaim"; Page Cache section says file data read once is kept in the page cache to avoid disk access on later reads.
3. [Readahead: the documentation I wanted to read](https://lwn.net/Articles/888715/), Neil Brown, 2022-04-08. LWN, primary: yes (kernel developer). How readahead actually works in the kernel. Seen 2026-09-28: each readahead request is part synchronous read, part async readahead; the `PG_readahead` page flag triggers the next request; window size scales from the previous one; points at `mm/readahead.c` as where the real docs live.
4. [posix_fadvise(2)](https://man7.org/linux/man-pages/man2/posix_fadvise.2.html), man-pages 6.19, 2026-02-08. Man page, primary: yes. How a program hints the page cache about its access pattern. Seen 2026-09-28: `POSIX_FADV_SEQUENTIAL`, `RANDOM`, `WILLNEED`, `DONTNEED`; Linux notes say SEQUENTIAL doubles the readahead window and RANDOM disables readahead for the file.
5. [No-I/O dirty throttling](https://lwn.net/Articles/456904/), Jonathan Corbet, 2011-08-31. LWN, primary: no (reporting on a patch set). What happens to a process that dirties pages faster than they can be written: `balance_dirty_pages()` makes it sleep. Seen 2026-09-28: describes Fengguang Wu's patches; pause time computed from a rate limit and `pos_ratio`; maximum sleep 200 ms. Old (2011): check what merged and what changed since.
6. [Linux Page Cache for SRE](https://biriukov.dev/docs/page-cache/0-linux-page-cache-for-sre/) series, Viacheslav Biriukov, last updated October 2025. Secondary explainer, primary: no. The best hands-on walk-through: read and write paths, dirty pages, eviction, tools. Seen 2026-09-28 on chapter 2, [Essential page cache theory](https://biriukov.dev/docs/page-cache/2-essential-page-cache-theory/): reads check the cache, writes only dirty pages; a write smaller than a page makes the kernel read the whole page first. Chapter 4, [eviction and reclaim](https://biriukov.dev/docs/page-cache/4-page-cache-eviction-and-page-reclaim/): active and inactive LRU lists per cgroup, shadow entries and refault distance, `vm.swappiness` default 60 (range 0 to 200), cgroup v2 has no per-cgroup swappiness. Good for experiment ideas (vmtouch, /proc/meminfo) in later chapters, not opened.

Also opened, useful for eviction if the article goes that far: [Multi-Gen LRU](https://docs.kernel.org/admin-guide/mm/multigen_lru.html), kernel docs. Seen 2026-09-28: MGLRU is an alternative LRU for page reclaim, enabled with `CONFIG_LRU_GEN` and `CONFIG_LRU_GEN_ENABLED`.

#### `mmap` (short)

1. [Are You Sure You Want to Use MMAP in Your Database Management System?](https://www.cidrdb.org/cidr2022/papers/p13-crotty.pdf), Andrew Crotty, Viktor Leis, Andrew Pavlo, CIDR 2022 (January 2022). Paper, primary: yes. The case against mmap in a DBMS, with measurements. Seen 2026-09-28: Section 3 lists four problems: #1 Transactional Safety, #2 I/O Stalls, #3 Error Handling, #4 Performance Issues (page table contention, single-threaded eviction by kswapd, TLB shootdowns). Section 2.3 lists mmap users (MonetDB, MongoDB, LevelDB, LMDB, SQLite, SingleStore, QuestDB, RavenDB, InfluxDB, WiredTiger) and says MongoDB removed MMAPv1 in 2019. Section 4.1: random reads over 2 TB with a 100 GB page cache, 100 threads; fio with O_DIRECT reached close to 900K reads/s; mmap with MADV_RANDOM matched fio for 27 s, dropped to near zero for about 5 s when the page cache filled, then settled at about half of fio. Section 6 gives when mmap might be OK.
2. [Are You Sure You Want to Use MMAP in Your DBMS?](https://www.symas.com/post/are-you-sure-you-want-to-use-mmap-in-your-dbms), Howard Chu (LMDB author), 2024-02-09. Engineering blog from the builder, primary: yes (for LMDB's design). The counterpoint. Seen 2026-09-28: argues LMDB shows mmap can be used safely; LMDB uses a read-only mmap by default, which avoids stray-pointer corruption; I/O stalls happen in any design because the caller waits for I/O either way; calls the paper's problems easy to solve. Doesn't address TLB shootdowns in the part I read. Endorses the RavenDB reply below.

Backup counterpoint: [re: Are You Sure You Want to Use MMAP...](https://ravendb.net/articles/re-are-you-sure-you-want-to-use-mmap-in-your-database-management-system), Oren Eini (RavenDB), 2022-01-14. Seen 2026-09-28: argues a buffer pool has to solve the same problems (eviction, dirty tracking, concurrency) and the benchmark leaves out those costs; Voron modifies pages outside the map and copies them in on commit.

Reference for the mechanism: [mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html), man-pages 6.19, 2026-03-19. Seen 2026-09-28: `MAP_SHARED` carries updates through to the file, `MAP_PRIVATE` is copy-on-write; `MAP_POPULATE` prefaults and triggers readahead; SIGBUS when touching a page past the end of the file; msync(2) for control over when updates are written.

#### `direct-io` (short)

1. [open(2)](https://man7.org/linux/man-pages/man2/open.2.html), man-pages 6.19, 2026-02-08. Man page, primary: yes. The rules. Seen 2026-09-28: `O_DIRECT` tries to minimize cache effects by doing I/O straight to and from user buffers; alignment of buffer address, length and file offset may be required, and varies by filesystem and kernel (Linux 2.4: filesystem block size; 2.6.0 and later: usually logical block size); since Linux 6.1, `statx(2)` with `STATX_DIOALIGN` reports the rules and should be used when available; warns against mixing O_DIRECT with buffered I/O or mmap on the same file. The famous Linus quote is **not** on the current page (I grepped for it).
2. [Re: O_DIRECT performance impact on 2.4.18](https://static.lwn.net/2002/0516/a/lt-deranged-monkey.php3), Linus Torvalds, 2002-05-11. Mailing list post (LWN archive), primary: yes. The well-known criticism: the interface is badly designed; he'd rather split it into readahead plus mapping for reads and writes plus sync for writes. Seen 2026-09-28: opens with "The thing that has always disturbed me about O_DIRECT is that the whole interface is just stupid". 24 years old, so it's history, not current kernel advice.

Current context, for "Where it gets tricky": [PostgreSQL 18 and beyond: From AIO to Direct IO?](https://www.cybertec-postgresql.com/en/postgresql-18-and-beyond-from-aio-to-direct-io/), Hans-Jürgen Schönig, September 2025. Vendor blog, primary: no. Seen 2026-09-28: Postgres relies on the OS page cache on purpose; `debug_io_direct = 'data'` measured 6 GB/s vs 3.7 GB/s buffered in the author's test; says full direct I/O in Postgres is "many years" away. Pair with the official [developer options page](https://www.postgresql.org/docs/current/runtime-config-developer.html) (Postgres 18 docs), seen 2026-09-28: `debug_io_direct` takes `data`, `wal`, `wal_init`; uses `O_DIRECT`, `F_NOCACHE` on macOS, `FILE_FLAG_NO_BUFFERING` on Windows; "Currently this feature reduces performance, and is intended for developer testing only."

#### `fsync` (deep)

1. [fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html), man-pages 6.19, 2026-02-08. Man page, primary: yes. Seen 2026-09-28: fsync flushes data and all metadata; fdatasync skips metadata not needed to read the data back (e.g. atime) but includes size changes; fsync on a file doesn't guarantee the directory entry is on disk, "an explicit fsync() on a file descriptor for the directory is also needed"; EIO section says since Linux 4.13 writeback errors are reported to all descriptors that may have written the data; NOTES mention older kernels/filesystems that don't flush the drive cache (hdparm/sdparm to disable it).
2. [Ensuring data reaches disk](https://lwn.net/Articles/457667/), Jeff Moyer, 2011-09-07. LWN, primary: yes (kernel storage developer). The clearest picture of the layers. Seen 2026-09-28: four layers (application buffers, library buffers like `fwrite`, page cache, drive cache then stable media); errors from writes often only show up at fsync, msync or close; O_SYNC vs O_DSYNC; O_DIRECT still needs fsync because of the drive cache; fsync the parent directory for new files; the temp file, fsync, rename, fsync directory pattern. Old: check against current man pages.
3. [Explicit volatile write back cache control](https://docs.kernel.org/block/writeback_cache_control.html), Linux kernel docs. Official docs, primary: yes. Where "drives can lie" is handled. Seen 2026-09-28: devices with a volatile write cache report completion before data is on non-volatile storage; `REQ_PREFLUSH` flushes the cache before an I/O; `REQ_FUA` completes only once that I/O is on non-volatile storage; filesystems set the flags and the block layer copes with what the device supports; drivers advertise `BLK_FEAT_WRITE_CACHE` and `BLK_FEAT_FUA`.
4. [PostgreSQL's fsync() surprise](https://lwn.net/Articles/752063/), Jonathan Corbet, 2018-04-18. LWN, primary: no (reporting), high quality. The fsyncgate story. Seen 2026-09-28: after a failed buffered write, filesystems usually drop the data and mark the pages clean; Postgres's checkpointer reopens files before fsync, so it can miss errors; `errseq_t` in 4.13, more in 4.16; fixes discussed: direct I/O, a netlink error channel, syncfs polling. Primary backing: the original [pgsql-hackers post](https://www.postgresql.org/message-id/CAMsr+YHh+5Oq4xziwwoEfhoTZgr07vdGG+hu=1adXx59aTeaoQ@mail.gmail.com), Craig Ringer, 2018-03-28, seen 2026-09-28: "Pg should PANIC on fsync() EIO return"; a retried fsync succeeded because the first one cleared the error flag; XFS had no `errors=remount-ro`. And the [Fsync Errors](https://wiki.postgresql.org/wiki/Fsync_Errors) wiki page, last edited 2023-07-05, seen 2026-09-28: Postgres now PANICs on fsync failure (12, backported to 9.4 to 11); per-OS table (Linux before 4.13 loses errors; FreeBSD keeps buffers dirty; macOS, NetBSD, OpenBSD invalidate them).
5. [Can Applications Recover from fsync Failures?](https://www.usenix.org/conference/atc20/presentation/rebello), Rebello, Patel, Alagappan, A. Arpaci-Dusseau, R. Arpaci-Dusseau, USENIX ATC 2020. Paper, primary: yes, open access ([PDF](https://www.usenix.org/system/files/atc20-rebello.pdf)). Seen 2026-09-28: tests ext4, XFS, Btrfs, and PostgreSQL, LMDB, LevelDB, SQLite, Redis; abstract: all three filesystems mark pages clean after fsync fails, so retrying doesn't help; page content and error reporting differ between filesystems; no application's strategy was sufficient, with data loss and corruption as outcomes. Uses a fault-injection filesystem ("CuttleFS").
6. [SSDs, power loss protection and fsync latency](http://smalldatum.blogspot.com/2026/01/ssds-power-loss-protection-and-fsync.html), Mark Callaghan, 2026-01-07. Engineering blog (database performance engineer), primary: yes for his own measurements. Why fsync cost depends on the drive. Seen 2026-09-28: fio with O_DIRECT, 16 KB writes then fsync; consumer Samsung 990 Pro about 2,974 µs, Crucial T500 891 µs, enterprise Intel D7-P5520 12.4 µs, Samsung PM-9a3 1.6 µs; drives with power loss protection can ack a flush from protected cache. Also tests Google Cloud local NVMe and Hyperdisk.

Extra, for the "application side": [Atomic Commit In SQLite](https://www.sqlite.org/atomiccommit.html), SQLite docs. Official docs, primary: yes. Seen 2026-09-28: SQLite assumes sector writes are not atomic but "linear"; assumes fsync doesn't return until writes are done; warns that fsync was a no-op on some historical Linux filesystems and that IDE disks lied about data reaching the platter; section 5.2 syncs the directory holding the super-journal. Also a good source for `torn-writes` and `crash-consistency`.

Extra, readable overview: [Files are hard](https://danluu.com/file-consistency/), Dan Luu, December 2015. Secondary, primary: no. Seen 2026-09-28: summarizes Pillai et al. OSDI 2014 (bugs in LevelDB, git, SQLite from assuming syscalls are atomic or ordered), poor filesystem error handling, silent corruption rates. Newer follow-up: [Files are fraught with peril](https://danluu.com/deconstruct-files/), July 2019 talk transcript, seen 2026-09-28, walks through the `pwrite` "a foo" to "a bar" example with an undo log. Better suited to `crash-consistency` than to `fsync`.

**Disagreements and tensions**


- **mmap in databases.** Crotty/Leis/Pavlo say mmap has correctness and performance problems that make it unfit as a buffer pool replacement, with a measured throughput collapse once the page cache fills. Howard Chu (LMDB) and Oren Eini (RavenDB) reply that their systems work, that a buffer pool has the same problems to solve, and that the benchmark is narrow (random reads, larger than memory). Both sides are right about different workloads: the paper measures a larger-than-memory random-read case; LMDB is read-mostly with a read-only map. The article should say which workload each side is talking about.
- **Direct I/O.** Linus (2002) called the O_DIRECT interface badly designed and wanted page cache plus hints instead. Databases like Postgres rely on the page cache on purpose and say direct I/O is years away; Postgres's own docs say `debug_io_direct` currently reduces performance. The CIDR paper uses fio with O_DIRECT as the fast baseline. So "direct I/O is faster" depends on having your own caching and async I/O.
- **How much to trust fsync.** Tom Lane's first reply in the fsyncgate thread (seen via the Dan Luu archive of the thread) argued POSIX says a successful fsync means all prior writes are done; the kernel behavior was different. After 2018: Postgres PANICs; Linux 4.13+ reports the error to every fd, but the ATC 2020 paper shows pages are still marked clean on ext4, XFS and Btrfs, so a retry can't fix it. Behavior differs across OSes (wiki table).
- **Do drives lie?** Old sources (SQLite docs, fsync(2) NOTES) warn of drives acking before data is safe. The kernel doc says the block layer now sends FLUSH/FUA correctly. The 2022 consumer NVMe test (see Couldn't open) and Callaghan's numbers suggest the answer now depends on the drive and whether it has power loss protection. Nothing here is a current, systematic study.

**Couldn't open**


- Russ Bishop's 2022 tweet thread testing NVMe drives for lost FLUSHed data (`https://x.com/xenadu02/status/1495693475584557056`): x.com returned HTTP 402. Only the [Hacker News discussion](https://news.ycombinator.com/item?id=38371307) opened, which reports 2 of 4 drives lost data at first (SK Hynix Gold P31, Sabrent Rocket), later 2 of 12. Not citable second-hand.
- [LKML: Linus Torvalds, Re: O_DIRECT question](https://lkml.org/lkml/2007/1/12/133), 2007: lkml.org returned an "Access Denied" bot-check page.
- LMDB docs at `http://www.lmdb.tech/doc/`: TLS error. Opened the [Symas LMDB page](https://www.symas.com/lmdb) instead, which says LMDB uses memory-mapped files for zero-copy lookups and needs no crash recovery procedure. Marketing-level; use Chu's post instead.
- `https://danluu.com/disk-spec/` (a guess at the "Disk writes" post): 404. The index lists "Filesystem error handling" (10/17) but I didn't open it.

**Rejected**


- Medium, dev.to and Substack posts on fsync and durability found by search (for example "Your Filesystem Is Lying to You"): secondary, undated or unsourced claims, and the primary sources above cover them.
- [Percona: PostgreSQL fsync failure fixed](https://www.percona.com/blog/postgresql-fsync-failure-fixed-minor-versions-released-feb-14-2019/): found in search, not opened; the Postgres wiki covers the same facts from the builders.
- Other LWN writeback-throttling articles (2007, 2010, 2015): found in search, not opened; one (456904) is enough for a first pass.
- pganalyze, Better Stack, credativ, Neon, Aiven posts on Postgres 18 async I/O: found in search, not opened. Async I/O belongs to Phase 4 (`io_uring` material), not here.

**Gaps**


- **page-cache:** no source I opened states the current default values of `dirty_ratio` and `dirty_background_ratio`, and the vm.html page claims to describe 2.6.29. Either find a current source or read them from `/proc/sys/vm` on my machine and write it up as an experiment. No primary source for the writeback flusher threads as they work today (the LWN throttling piece is from 2011).
- **direct-io:** no current kernel-developer source on O_DIRECT's status in 2026 (the Linus mail is from 2002). io_uring context not researched; it fits Phase 4.
- **fsync:** no systematic, current study of which drives honor FLUSH. `sync_file_range` and `syncfs` not covered by any opened source except in passing (LWN 752063 mentions syncfs).
- **mmap:** no primary source from MongoDB on why MMAPv1 was dropped (the CIDR paper states it, citing their docs).

### Crash consistency, encoding and the log
#### `crash-consistency` (deep)

1. [All File Systems Are Not Created Equal: On the Complexity of Crafting Crash-Consistent Applications](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/pillai), Pillai, Chidambaram, Alagappan, Al-Kiswany, A. Arpaci-Dusseau, R. Arpaci-Dusseau, OSDI 2014 (2014-08-07). Paper, primary: yes. The central paper: it names "persistence properties" (atomicity and ordering of file system operations) and shows applications silently depend on them. Seen 2026-09-28: USENIX page has abstract, PDF, slides, video. The PDF introduces two tools, BOB (tests persistence properties on six Linux file systems) and ALICE (finds vulnerabilities in application update protocols); studies eleven applications (LevelDB, GDBM, LMDB, SQLite, PostgreSQL, HSQLDB, Git, Mercurial, HDFS, ZooKeeper, VMware Player); finds 60 vulnerabilities; defines "size-atomicity" and "content-atomicity"; Figure 1 is the Git update protocol. Figure worth redrawing: possible crash states for a small workload.
2. [Crash Consistency: FSCK and Journaling (OSTEP ch. 42)](https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf), Remzi and Andrea Arpaci-Dusseau, OSTEP v1.10 (book page says November 2023). Book chapter, primary: no (textbook), but written by the same group as #1. Best plain explanation of the file system side. Seen 2026-09-28: sections 42.1 A Detailed Example (the crash consistency problem), 42.2 Solution #1: The File System Checker, 42.3 Solution #2: Journaling (or Write-Ahead Logging), with a figure for metadata-only journaling, 42.4 Other Approaches, 42.5 Summary. Free PDF.
3. [Specifying and Checking File System Crash-Consistency Models](https://jamesbornholt.com/papers/ferrite-asplos16.pdf), Bornholt, Kaufmann, Li, Krishnamurthy, Torlak, Wang, ASPLOS 2016. Paper, primary: yes. Frames crash behavior like a memory consistency model, with litmus tests. Seen 2026-09-28: abstract says POSIX "do[es] not define the possible outcomes of a crash"; presents the FERRITE toolkit and an ext4 crash-consistency model; sections 1 Introduction, 2 Background, 3 Litmus tests, 4 Formal specifications, 5 Making specifications executable, 6 Experience, 7 Related work. Its first figure is the write-temp-then-rename example and the orders it can reach disk in. (Old URL cs.utexas.edu/~bornholt redirects here.)
4. [Files are hard](https://danluu.com/file-consistency/), Dan Luu, date not shown on the page. Secondary explainer, primary: no. Short tour of the research with links to the papers. Seen 2026-09-28: sections Crash Consistency, Filesystem Semantics, Filesystem Correctness, Error Recovery, Error Frequency, Conclusion, Appendix. Cites Pillai et al. OSDI '14, Prabhakaran SOSP '05, Gunawi FAST '08 and OSDI '08, Bairavasundaram SIGMETRICS '07. States that POSIX rename atomicity "only applies to normal operation, not to crashes."
5. [Can Applications Recover from fsync Failures?](https://www.usenix.org/conference/atc20/presentation/rebello), Rebello, Patel, Alagappan, A. Arpaci-Dusseau, R. Arpaci-Dusseau, USENIX ATC 2020. Paper, primary: yes. Covers what the other sources skip: fsync itself can fail. Seen 2026-09-28: USENIX page abstract: tested three Linux file systems and five applications (PostgreSQL, LMDB, LevelDB, SQLite, Redis); fsync failures "can cause catastrophic outcomes such as data loss and corruption"; no approach studied was fully adequate.
6. [PostgreSQL docs, 28.1 Reliability](https://www.postgresql.org/docs/current/wal-reliability.html), PostgreSQL Global Development Group, current docs. Official docs, primary: yes. A real database explaining torn pages and write caches. Seen 2026-09-28: sectors are 512 bytes but PostgreSQL writes 8192-byte pages, so power loss can leave partial pages; `full_page_writes` writes full page images to WAL first; every WAL record has a CRC-32C checked in crash recovery; guidance on disk write-back caches and `wal_sync_method`.

#### `atomic-rename` (short)

1. [rename(2), Linux manual page](https://man7.org/linux/man-pages/man2/rename.2.html), Linux man-pages 6.19 (2026-02-08). Man page, primary: yes. Seen 2026-09-28: "If newpath already exists, it will be atomically replaced, so that there is no point at which another process attempting to access newpath will find it missing." Says nothing about crashes, except an NFS note in BUGS (server renames, crashes, retransmitted RPC fails). That silence is the point of the node.
2. [Ensuring data reaches disk](https://lwn.net/Articles/457667/), Jeff Moyer, LWN, 2011-09-07. Explainer by a kernel developer, primary: no (but close). Seen 2026-09-28: lays out the temp file pattern step by step: write to a temp file, fsync() it, rename over the original, then "fsync() the containing directory."
3. [ext4 and data loss](https://lwn.net/Articles/322823/), Jonathan Corbet, LWN, 2009-03-11. News/explainer, primary: no. The history: why rename-without-fsync worked on ext3 and broke on ext4. Seen 2026-09-28: delayed allocation let metadata commit before data, leaving zero-length files after a crash; ext3's safety was "almost an accident" (Corbet's words; Ts'o is quoted saying POSIX never made such a guarantee); Ts'o's patches for 2.6.30 added a force-allocate ioctl, force-allocate on truncate-then-close, and force-allocate on rename-over-existing-file. (The page does not use the name `auto_da_alloc`; if the article names that mount option, a source that shows it is still needed.)

#### `checksums` (short)

1. [hash/crc32 package](https://pkg.go.dev/hash/crc32), Go authors, Go 1.27.1 docs. Official docs, primary: yes. The lab is in Go, so this is what gets called. Seen 2026-09-28: constants IEEE (0xedb88320, "used by ethernet, gzip, PNG, zip"), Castagnoli (0x82f63b78, iSCSI, better error detection), Koopman; `MakeTable`, `Checksum`, `Update`, `ChecksumIEEE`. The fetched summary did not mention hardware acceleration; check the source (`crc32_amd64.go`) before claiming it.
2. [More Than You Wanted to Know About Checksums](https://www.evanjones.ca/crc32c.html), Evan Jones, 2010-07-16. Secondary blog, primary: no. Why CRC32C over Adler-32 and the Internet checksum. Seen 2026-09-28: recommends CRC32C for new applications; with the SSE4.2 instruction it is "even cheaper than computing Adler-32"; Adler-32 weak on short messages. Dated: says AMD and Atom lack the instruction, which was true in 2010, not now.
- Real logs using CRC32C: see `append-only-log` #1 (LevelDB) and `crash-consistency` #6 (PostgreSQL WAL).

#### `binary-encoding` (short)

1. [Encoding (Protocol Buffers)](https://protobuf.dev/programming-guides/encoding/), Google, current docs. Spec, primary: yes. Seen 2026-09-28: base-128 varints with a continuation bit and 7-bit payloads; wire types VARINT, I64, LEN, I32; ZigZag for `sint32`/`sint64` (0→0, -1→1, 1→2); length-delimited fields as a varint length then bytes; packed repeated fields by default since Edition 2023.
2. [encoding/binary package](https://pkg.go.dev/encoding/binary), Go authors, Go 1.27.1 docs. Official docs, primary: yes. Seen 2026-09-28: `ByteOrder`, `LittleEndian`, `BigEndian`, `NativeEndian`; `PutUvarint`, `Uvarint`, `AppendUvarint`, `ReadUvarint`; `MaxVarintLen16/32/64`; varint text points to the protobuf encoding spec.

#### `append-only-log` (short)

1. [LevelDB log format](https://github.com/google/leveldb/blob/main/doc/log_format.md), LevelDB authors (Google), in-repo doc. Official doc, primary: yes. The model for the lab's record format. Seen 2026-09-28: file split into 32KB blocks; record = checksum (uint32, CRC32C over type and data), length (uint16), type (uint8), data; types FULL=1, FIRST=2, MIDDLE=3, LAST=4; "A record never starts within the last six bytes of a block"; benefits (resync by skipping to next block) and downsides (no packing of small records, no compression).
2. [SQLite file format, section 4 The Write-Ahead Log](https://www.sqlite.org/fileformat2.html), SQLite team. Spec, primary: yes. LAB.md compares the log's recovery rules with this. Seen 2026-09-28: 4.1 WAL File Format: 32-byte header (magic, version 3007000, page size, checkpoint sequence, salt-1, salt-2, two checksum words), 24-byte frame header (page number, commit size, salts, cumulative checksum); a frame is valid only if salts match the header and the cumulative checksum matches; a commit frame has non-zero db size. 4.2 gives the checksum algorithm (a Fletcher-like sum, not a CRC).
3. Extra for the lab comparison: [Write-Ahead Logging](https://www.sqlite.org/wal.html), SQLite team. Official docs, primary: yes. Seen 2026-09-28: commit = appending a commit record to the WAL; checkpointing, default auto-checkpoint at 1000 pages; with `synchronous=NORMAL` transactions are not durable after power loss until a checkpoint, `FULL` syncs the WAL on every commit.
4. Extra: [WAL Recovery Modes](https://github.com/facebook/rocksdb/wiki/WAL-Recovery-Modes), RocksDB wiki. Official docs, primary: yes. Four policies for a bad record: kTolerateCorruptedTailRecords, kAbsoluteConsistency, kPointInTimeRecovery (default since 6.6), kSkipAnyCorruptedRecords. Seen 2026-09-28: "the system cannot differentiate between corruption at the tail of the log and incomplete write." Directly shapes the lab's "drop the torn tail" rule. The sibling page [Write Ahead Log File Format](https://github.com/facebook/rocksdb/wiki/Write-Ahead-Log-File-Format) (opened 2026-09-28) shows the LevelDB format plus a "recyclable" variant with a 4-byte log number.

#### `crash-testing` (short)

1. [LazyFS](https://github.com/dsrhaslab/lazyfs), INESC TEC (dsrhaslab). Source repo, primary: yes. Seen 2026-09-28: "A FUSE file system with an internal dedicated page cache that only flushes data if explicitly requested"; faults `clear-cache`, `torn-seq`, `torn-op`, `crash` (by op, timing, path regex), controlled by writing commands to a FIFO; needs FUSE 3 (libfuse3), C++17, CMake ≥ 3.16.3, ext4 as backend; README badge "status: research prototype". Maintenance (GitHub API, 2026-09-28): latest release 0.3.1 on 2026-05-07 (before that 0.3.0 on 2024-03-08); last commit 2026-08-24; not archived; 4 open issues. Recent PRs come from an outside user (nurturenature).
2. [When Amnesia Strikes: Understanding and Reproducing Data Loss Bugs with Fault Injection](https://www.vldb.org/pvldb/vol17/p3017-ramos.pdf), Ramos, Azevedo, Kingsbury (Jepsen), Pereira, Esteves, Macedo, Paulo, PVLDB 17(11), 2024. Paper, primary: yes. The LazyFS paper. Seen 2026-09-28: studies PostgreSQL, etcd, ZooKeeper, Redis, LevelDB, PebblesDB, Lightning Network; reproduces 5 known bugs, 7 ambiguous ones, finds 8 new. Limitations section: LazyFS "does not allow assessing the durability of metadata (e.g., whether updates to inodes are flushed correctly to disk)". Says it is not a bug-exploration tool like ALICE or Jepsen.
3. [dm-log-writes](https://docs.kernel.org/admin-guide/device-mapper/log-writes.html), Linux kernel docs. Official docs, primary: yes. Seen 2026-09-28: a device-mapper target that logs every write to a second device; plain WRITEs are logged only when the next REQ_PREFLUSH arrives, so the log shows what reached the disk, not the cache; REQ_FUA logged on completion; DISCARD treated like WRITE; `dmsetup message ... mark <name>` inserts marks; replay with the userspace `replay-log` tool (github.com/josefbacik/log-writes), with example commands for an fsync test. Status: `drivers/md/dm-log-writes.c` is in mainline Linux (checked via GitHub API). The `replay-log` repo's last commit is 2024-07-09 (typo fix).

**Disagreements and tensions**


- **Is rename atomic?** The man page promises atomicity to other processes. Dan Luu, Moyer and the Ferrite paper say that says nothing about crashes: without fsync of the file and the directory, a crash can leave the old file, the new one, or (on ext4 in 2009) an empty one.
- **Whose job is safety: the app or the file system?** In the 2009 ext4 fight Ts'o said apps must fsync; ext4 still added rename heuristics because real apps didn't. The OSDI 2014 paper shows apps depending on properties that vary by file system. The ASPLOS 2016 paper argues the rules should be written down as a model.
- **Torn tail vs corruption.** RocksDB says a reader can't tell a torn tail from real corruption, and offers four policies. LevelDB skips to the next block. SQLite stops at the first frame whose salt or cumulative checksum fails. The lab has to pick one and say why.
- **CRC32C vs SQLite's checksum.** LevelDB, RocksDB and PostgreSQL use CRC32C. SQLite's WAL uses its own Fletcher-like sum. Worth a sentence in `checksums`.
- **fsync is not the end.** Most sources treat fsync as the durability point. Rebello et al. show fsync can fail and apps handle it badly; PostgreSQL docs warn about drive write caches that lie.

**Couldn't open**


- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, LinkedIn, 2013. HTTP 404 twice on 2026-09-28. Search turned up only mirrors and summaries (engineering.fyi, personal blogs); not used. It's also more about logs as a data-integration idea (phase 10-ish) than the file format this node covers.

**Rejected**


- [Finding Crash-Consistency Bugs with Bounded Black-Box Crash Testing](https://www.usenix.org/conference/osdi18/presentation/mohan) (CrashMonkey/Ace, OSDI 2018), opened 2026-09-28. Good paper (most file system crash bugs reproduce with three or fewer operations, often after fsync) but it tests file systems, not applications, and the CrashMonkey repo (utsaslab/crashmonkey) was last pushed 2022-10-01. Could come back as a `crash-consistency` extra.
- [TigerBeetle Safety](https://docs.tigerbeetle.com/concepts/safety/), opened 2026-09-28. Mentions the VOPR simulator, checksums and hash chaining, but the fetched page did not describe torn writes or how crashes are injected at the storage layer. Too general for `crash-testing`.
- [Intel community post on AVX-512 CRC32C in PostgreSQL](https://community.intel.com/t5/Blogs/Tech-Innovation/Data-Center/Intel-AVX-512-Accelerates-PostgreSQL-CRC32C-Checksums/post/1726023): only seen as a search snippet, not opened. Not a candidate.

**Gaps**


- **Hardware CRC32C in Go:** no opened page yet confirms that Go's `hash/crc32` uses SSE4.2/ARMv8 instructions for Castagnoli. Needs the Go source file or release notes.
- **`auto_da_alloc` by name:** the LWN 2009 article covers the heuristics but not the mount option's name. The ext4 kernel docs (docs.kernel.org/admin-guide/ext4.html) weren't opened.
- **xxHash:** not researched; a non-cryptographic hash with no error-detection guarantee, likely out of scope for a short node.
- **How etcd or FoundationDB test crashes:** nothing opened. The LazyFS paper covers etcd WAL bugs (bugs #9, #10), which may be enough.
- **Kreps "The Log"** couldn't be opened (see above). `append-only-log` has enough without it.


## Phase 2: Networking I, packets to transport

<!-- Not researched yet. -->

## Phase 3: Networking II, secure protocols and proxies

<!-- Not researched yet. -->

## Phase 4: Concurrency and I/O models

<!-- Not researched yet. -->

## Phase 5: APIs and contracts

<!-- Not researched yet. -->

## Phase 6: Databases I, using Postgres well

<!-- Not researched yet. -->

## Phase 7: Databases II, storage engines

<!-- Not researched yet. -->

## Phase 8: Databases III, transactions

<!-- Not researched yet. -->

## Phase 9: Caching and performance

<!-- Not researched yet. -->

## Phase 10: Messaging and streams

<!-- Not researched yet. -->

## Phase 11: Distributed systems I, replication and partitioning

<!-- Not researched yet. -->

## Phase 12: Distributed systems II, consensus and coordination

<!-- Not researched yet. -->

## Phase 13: Reliability engineering

<!-- Not researched yet. -->

## Phase 14: Running it: containers, deploys, observability

<!-- Not researched yet. -->

## Phase 15: Security, authentication and authorization

<!-- Not researched yet. -->

## Phase 16: Data systems

<!-- Not researched yet. -->

## Phase 17: Putting it together: system design and durable execution

<!-- Not researched yet. -->
