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
- *High Performance Browser Networking*, Grigorik: phases 2, 3. Chapter 1
  opened 2026-09-28 for phase 2 (`network-latency`); the rest not yet.
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

### Phase 2 (found 2026-09-28)

Done 2026-09-28: `dns` needs `tcp`, `bandwidth-delay-product` needs
`tcp-flow-control`, `tun-tap` needs `ethernet-and-arp`, `icmp` compared
with `mtu-and-fragmentation`. Still open: everything else below.

**Layers and addresses:**
- `ip-routing` should list `nat` or not? No: NAT needs `ip-addressing` already. No change.
- `anycast` could list `udp` and `tcp` as related: the main tricky part is TCP connections breaking when routes shift. Suggest `compare_with: []` stays, but `anycast` could add `tcp` to `needs` later. For now it links them in text.
- `ethernet-and-arp` has no `leads_to`. `packet-capture` or `tun-tap` (TAP carries Ethernet frames) might list it in `needs`. Suggest `tun-tap` needs `ethernet-and-arp`.
- `bgp` note is fine. Consider a future short node `route-leaks-and-rpki` if phase 13 (reliability) wants it; for now it fits in `bgp`'s tricky section.
- `network-layers` note is fine. Consider adding `compare_with: []` → no OSI node needed; OSI is covered inside.
- RFC 894 belongs with `mtu-and-fragmentation` (1500-octet Ethernet data field).
- `ethernet-and-arp` ended up citing 4 sources (RFC 826, arp(7), RFC 5227 for spoofing and gratuitous ARP, RFC 4861 for the IPv6 contrast), more than the 1-2 guideline for a short node; still 901 words.
- No source was opened for the OSI layer numbers (L3/L4/L7). `network-layers` only uses "Layer2" (from arp(7)); the planned phase 3 `l4-vs-l7` node will need its own source for the numbering.

**NAT, MTU, ICMP, latency and tools:**
- `icmp` and `mtu-and-fragmentation` overlap on path MTU discovery. Suggest: `mtu-and-fragmentation` owns PMTU, PMTUD and black holes; `icmp` owns the message types, ping and traceroute and links to it. Suggest adding `mtu-and-fragmentation` to `icmp`'s `leads_to` (or `compare_with`) so the link is in the graph, not only inline.
- `nat` should link to `tcp` (idle timeouts kill long-lived connections) and `udp` (mapping timers). Suggest `nat` `leads_to` nothing new, but mention these inline (done).
- `network-latency` could `leads_to` `tcp-handshake` (a handshake is a round trip) as well as `bandwidth-delay-product`. Optional.
- A future node `bufferbloat` / `active-queue-management` (short, phase 2 or 9) would take the queuing part of `network-latency` further; right now one section covers it.
- `packet-capture` is a natural `needs` for nothing yet, but the phase 2 lab will lean on it for debugging the TCP stack; LAB.md could say "capture every harness run on the TUN device".
- tun-tap: kernel docs (7.3-rc5) now document IFF_BACKPRESSURE; worth checking whether the lab's kernel (7.1.9) has it before relying on it.

**Transport, core:**
- `tcp-retransmission` might be `deep`: RTO estimation, Karn, fast retransmit, SACK and RACK-TLP are all interview material. As a short node it can only name SACK and RACK-TLP. Keep short for now; revisit if the article feels cramped.
- The accept queue / SYN queue (listen backlog) is explained in `tcp-handshake`, but it's also a phase 4 concept (servers that can't keep up). Consider a planned `listen-backlog` short node later, or link from phase 4 to tcp-handshake.
- TCP keepalives and `TCP_USER_TIMEOUT` (how a connection notices a dead peer) came up in three sources and is a real production problem. It fits nowhere now. Candidate new short node: `tcp-keepalive` (needs tcp, maybe in phase 13 near timeouts).
- `ports-and-sockets` should link `nat` (source port rewriting) in compare_with or leads_to; `time-wait` could link `nat` too (tcp_tw_recycle). Not changed, left for the lead.
- `udp` could lead_to `mtu-and-fragmentation`-aware topics, and to QUIC in phase 3; currently only leads to `dns`.

**Transport, performance:**
- `bandwidth-delay-product` needs `congestion-control` in the plan, but it leans as much on flow control (the receive window is what Cloudflare hit). Suggest adding `tcp-flow-control` to its `needs` (and `bandwidth-delay-product` to flow control's `leads_to`).
- `head-of-line-blocking` should link forward to phase 3 `quic` and HTTP/2 nodes when they exist (leads_to).
- Possible new short node: `bufferbloat` (queues in deep buffers; BBR's main motivation). Currently explained in one paragraph inside `congestion-control`.
- Possible new short node: `pacing` (fq qdisc, BBR's primary control). Mentioned in passing only.

**Names:**
- **`dns` needs `udp` and also leans on `tcp`, `mtu-and-fragmentation` and `anycast`.** The article links all three in the text. Suggest adding `tcp` to `dns`'s `needs` (the TC-bit fallback and RFC 7766), or leave as text links only.
- **Possible new short node `dnssec`** (phase 2 or 3): it drives bigger answers, TCP fallback and the Flag Day. Not needed for the current three articles.
- **Possible new short node `dns-over-https`** (or `encrypted-dns`) in phase 3, next to TLS: RFC 7858 and 8484 are ready candidates.
- **`service-discovery` (phase 3)** should link `dns-records`: SRV is the DNS form of it.
- `dns-caching` note wording changed to mention negative caching explicitly; `dns` and `dns-records` notes reworded slightly (id, links, depth unchanged).
- `dns-records` cites 5 sources, above the 1-2 guide for a short node, because the types are spread across RFCs (1035, 3596, 2782, 2181, 9460). Words stay under 1,000.

**Done 2026-09-29:** `tcp-retransmission` is deep; new short nodes
`tcp-keepalive`, `bufferbloat`, `pacing`; planned phase 3 nodes `dnssec` and
`encrypted-dns`; `nat` needs `ports-and-sockets`, `anycast` needs `tcp`,
`tcp-keepalive` needs `nat`. Phase 3 links (`quic` and `http2` from
`head-of-line-blocking`, `service-discovery` from `dns-records`) are in
`tentative-shape.md` until those nodes exist.

**Found 2026-09-29, retransmission and keepalive:**
- `tcp-keepalive` should list `nat` in `compare_with` or `needs` (NAT bindings dying is half the reason keepalives exist); `nat` could list `tcp-keepalive` in `leads_to`. Frontmatter not changed.
- `tcp-retransmission` could `compare_with: [tcp-keepalive]`? No, different jobs. Leave.
- Phase 3 HTTP/2 or gRPC nodes, when they exist, should link `tcp-keepalive` (PING-based keepalives).

**Found 2026-09-29, bufferbloat and pacing:**
- Both nodes are short but each cites 5 sources (the brief listed 1-2 for short). The topics span several algorithms and Linux mechanics; keep short but accept more sources, or split `active-queue-management` out of `bufferbloat` (CoDel/FQ-CoDel/PIE) if it grows.
- `pacing` could link `tcp-flow-control`? No. But `bufferbloat` and `pacing` could reasonably link each other (`compare_with` or `leads_to`); left frontmatter unchanged. Bufferbloat links [[pacing]] inline already.
- Possible future node: `tcp-small-queues` / host-side queuing (tcp_limit_output_bytes), not needed now.

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

Researched 2026-09-28 by five parallel passes, one per group below.

### Layers and addresses

All pages below were opened on 2026-09-28 (RFCs as plain text from
rfc-editor.org, with the rfc-editor.org info page checked for "updated by"
and "obsoleted by").

#### `network-layers` (deep)

1. [RFC 1122: Requirements for Internet Hosts -- Communication Layers](https://www.rfc-editor.org/rfc/rfc1122), R. Braden (ed.), IETF, 1989-10. Spec, primary: yes. The four Internet layers as the IETF defines them. Seen 2026-09-28: section 1.1.3 lists Application, Transport, Internet and Link layers; says the application layer "essentially combines the functions of the top two layers -- Presentation and Application -- of the OSI reference model"; IP is a datagram service where packets may arrive "damaged, duplicated, out of order, or not at all"; ICMP is "architecturally layered upon IP" though considered part of it; 1.1.2 architectural assumptions: gateways stateless, "Routing complexity should be in the gateways". Still in force, updated by 9 later RFCs (including RFC 9293 for TCP).
2. [The Design Philosophy of the DARPA Internet Protocols](http://ccr.sigcomm.org/archive/1995/jan95/ccr-9501-clark.pdf), David D. Clark, SIGCOMM 1988 (reprint CCR 1995). Paper, primary: yes (Clark was the Internet's chief protocol architect). Why the layers are split where they are. Seen 2026-09-28: TCP and IP "originally had been a single protocol in the architecture" and were separated so IP could be a basic datagram building block; XNET debugger and voice as the services that didn't want TCP; "fate-sharing" keeps connection state in hosts, so gateways are stateless.
3. [RFC 3439: Some Internet Architectural Guidelines and Philosophy](https://www.rfc-editor.org/rfc/rfc3439), R. Bush and D. Meyer, 2002-12. Informational RFC, primary: yes (IETF architecture guidance). The counter-view. Seen 2026-09-28: section 3 "Layering Considered Harmful": strict layering means "the optimization of each layer has to be done separately"; multiplexing and segmentation "hide vital information that lower layers may need"; layer N may need layer N-2 information.
4. [RFC 1958: Architectural Principles of the Internet](https://www.rfc-editor.org/rfc/rfc1958), B. Carpenter (ed.), IAB, 1996-06. Informational RFC, primary: yes. End-to-end argument and fate-sharing in two pages. Seen 2026-09-28: 2.3 "end-to-end functions can best be realised by end-to-end protocols"; state kept only in endpoints ("fate-sharing"), "datagrams are better than classical virtual circuits".
5. [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293), W. Eddy (ed.), 2022-08. Spec, primary: yes. One concrete layer violation. Seen 2026-09-28: 3.1 the TCP checksum covers a pseudo-header with IP source and destination addresses, "96 bits for IPv4 and 320 bits for IPv6", passed across the TCP/IP interface.
6. [RFC 8200: IPv6](https://www.rfc-editor.org/rfc/rfc8200), S. Deering and R. Hinden, 2017-07. Spec, primary: yes. Header sizes for the encapsulation figure. Seen 2026-09-28: 8.3: minimum IPv4 header 20 octets, minimum TCP header 20 octets, IPv6 header 20 octets more than IPv4.

Also used for the figure: RFC 826 (Ethernet header: 48-bit destination, 48-bit source, 16-bit type), see `ethernet-and-arp` #1.

#### `ethernet-and-arp` (short)

1. [RFC 826: An Ethernet Address Resolution Protocol](https://www.rfc-editor.org/rfc/rfc826), David C. Plummer, 1982-11. Spec, primary: yes. Seen 2026-09-28: packet format (hardware type, protocol type, lengths, opcode REQUEST=1/REPLY=2, sender and target addresses); request is broadcast; the receiver merges the sender's mapping before looking at the opcode, on the assumption that "if A has some reason to talk to B, then B will probably have some reason to talk to A"; no periodic broadcasting. Updated by RFC 5227 and 5494.
2. [arp(7)](https://man7.org/linux/man-pages/man7/arp.7.html), Linux man-pages 6.19, page dated 2026-02-08. Man page, primary: yes. How Linux does it. Seen 2026-09-28: neighbor cache with garbage collection (gc_thresh1/2/3 defaults 128/512/1024), entries go stale without positive feedback such as a TCP ACK, unicast re-probe before broadcast, base_reachable_time_ms default 30000, unres_qlen default 3 packets queued per unresolved address; Linux 2.2+ ARP uses the IPv6 neighbor discovery algorithms.

Also used: [RFC 5227: IPv4 Address Conflict Detection](https://www.rfc-editor.org/rfc/rfc5227), S. Cheshire, 2008-07 (security section: any host can answer every ARP request with its own address; "gratuitous ARP" is the ARP Announcement), and [RFC 4861: Neighbor Discovery for IPv6](https://www.rfc-editor.org/rfc/rfc4861), Narten et al., 2007-09 (3.1: ND combines ARP, ICMP Router Discovery and ICMP Redirect; unlike ARP it detects half-link failures).

#### `ip-addressing` (deep)

1. [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), J. Postel, 1981-09. Spec, primary: yes. Seen 2026-09-28: "A name indicates what we seek. An address indicates where it is. A route indicates how to get there."; addresses are four octets; the original class A/B/C split; a host may have several interfaces and several addresses. Updated by RFC 1349, 2474, 6864.
2. [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632), V. Fuller and T. Li, 2006-08. BCP, primary: yes. Seen 2026-09-28: history of the class system and the 1992 ROAD problems; slash notation; table of every prefix length from /32 ("host route") to /0 ("default route"); CIDR expected to last "approximately three to five years" but "has far outlasted its anticipated lifespan"; 5.1 "Forwarding in the Internet is done on a longest-match basis."
3. [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918), Rekhter et al., 1996-02. BCP, primary: yes. Seen 2026-09-28: 10/8, 172.16/12, 192.168/16; usable "without any coordination with IANA"; routes must not leak across enterprise links.
4. [RFC 4291: IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc4291), R. Hinden and S. Deering, 2006-02. Spec, primary: yes. Seen 2026-09-28: 128-bit addresses; unicast, anycast, multicast, no broadcast; text form and "::" rule; prefix notation; global unicast = routing prefix + subnet ID + 64-bit interface ID; link-local fe80::/10; addresses belong to interfaces, not nodes. Updated by 6 RFCs (5952 text form, 7136, 8064, ...).
5. [RFC 6890: Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890), Cotton et al., 2013-04. BCP, primary: yes. Seen 2026-09-28: tables for 127.0.0.0/8 loopback, 169.254.0.0/16 link local, 100.64.0.0/10 shared address space, 192.0.2.0/24 etc. documentation, ::1, fc00::/7 unique-local, fe80::/10, 2001:db8::/32 documentation. (The live registry is at IANA; not opened.)
6. [Free Pool of IPv4 Address Space Depleted](https://www.nro.net/ipv4-free-pool-depleted/), Number Resource Organization, 2011-02-03. Press release, primary: yes. Seen 2026-09-28: IANA's pool ran out on 2011-02-03 when the last five /8s went one to each RIR; each /8 is 1/256 of the IPv4 space.

Also: RFC 8200 (see `network-layers` #6) for the 40-byte IPv6 header.

#### `ip-routing` (deep)

1. [RFC 1812: Requirements for IP Version 4 Routers](https://www.rfc-editor.org/rfc/rfc1812), F. Baker (ed.), 1995-06. Spec, primary: yes. Seen 2026-09-28: 5.2.1 forwarding algorithm order; 5.2.4.3 next-hop selection as pruning rules over the FIB: Basic Match then Longest Match, with worked examples (10.144.2.5 vs 10.144.2.0/24, 10.144.0.0/16, 10.0.0.0/8); 5.3.1 TTL: every router MUST decrement by at least one, at zero discard and send ICMP Time Exceeded; TTL "effectively a hop count limit".
2. See `network-layers` #1 (RFC 1122 3.3.1.1): the host's local/remote decision: mask the destination; if it matches the local network, send directly, else to a gateway.
3. See `ip-addressing` #2 (RFC 4632 5.1-5.2): longest match; aggregate routes need a discard route to avoid loops; 0.0.0.0/0 is the default route.
4. [ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html), iproute2, rendered 2026-09-09 from iproute2 git of 2026-08-04. Man page, primary: yes. Seen 2026-09-28: route types (unicast, unreachable, blackhole, prohibit, local, ...); main table ID 254, local table ID 255 kept by the kernel; `default` = 0/0 or ::/0; `ip route get` "is equivalent to sending a packet along this path"; metric: lower preferred; proto kernel/boot/redirect.
5. [ip-rule(8)](https://man7.org/linux/man-pages/man8/ip-rule.8.html), iproute2. Man page, primary: yes. Seen 2026-09-28: the routing policy database; default rules at priority 0 (local), 32766 (main), 32767 (default); policy routing on source, fwmark, etc.
6. [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), kernel docs (7.3.0-rc5 tree). Official docs, primary: yes. Seen 2026-09-28: ip_forward default 0; ip_default_ttl default 64; rp_filter strict/loose modes, default 0 though some distributions enable it.

Also: RFC 8200 Hop Limit (IPv6 TTL), RFC 791 TTL definition.

#### `bgp` (short)

1. [RFC 4271: A Border Gateway Protocol 4 (BGP-4)](https://www.rfc-editor.org/rfc/rfc4271), Rekhter, Li, Hares (eds.), 2006-01. Spec, primary: yes. Seen 2026-09-28: AS definition; runs over TCP port 179; incremental updates, no periodic refresh; KEEPALIVE; AS_PATH loop detection; route choice starts from locally configured preference, shortest AS_PATH is a tie-breaker; security section covers only TCP MD5 on the session. Updated by 12 RFCs, including RFC 6793 (4-byte AS numbers) and RFC 8212 (no policy, no routes on EBGP).
2. [Understanding how Facebook disappeared from the Internet](https://blog.cloudflare.com/october-2021-facebook-outage/), Celso Martinho and Tom Strickx, Cloudflare, 2021-10-04. Blog, primary: yes (their own BGP data). Seen 2026-09-28: at 15:58 UTC Facebook stopped announcing routes to its DNS prefixes; peak of UPDATEs around 15:40 UTC; resolvers returned SERVFAIL; facebook.com unavailable on 1.1.1.1 from about 15:50 to 21:20 UTC. (The page's summary metadata says 1651 UTC; the body says 15:51 UTC.)
3. [How Verizon and a BGP Optimizer Knocked Large Parts of the Internet Offline Today](https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/), Tom Strickx, Cloudflare, 2019-06-24. Blog, primary: yes. Seen 2026-09-28: a route leak: an optimizer split 104.20.0.0/20 into two /21s, DQE (AS33154) passed them to a customer, which passed them to Verizon (AS701), which announced them to everyone; more-specifics win; Cloudflare lost about 15% of global traffic at the worst point; fixes: prefix limits, IRR filtering, RPKI origin validation.

#### `anycast` (short)

1. [RFC 4786: Operation of Anycast Services](https://www.rfc-editor.org/rfc/rfc4786), J. Abley and K. Lindqvist, 2006-12. BCP 126, primary: yes (IETF best current practice). Seen 2026-09-28: definition; goals (load, DoS containment, latency); "Topological nearness within the routing system does not, in general, correlate to round-trip performance"; routing must be stable longer than a transaction; advertise when healthy, withdraw when not; a covering prefix (often /24 for IPv4) because host routes don't propagate; monitoring must happen from many places.
2. [RFC 7094: Architectural Considerations of IP Anycast](https://www.rfc-editor.org/rfc/rfc7094), McPherson et al., IAB, 2014-01. Informational, primary: yes. Seen 2026-09-28: "UDP is the 'lingua franca' for anycast today"; TCP over anycast can break when routes change mid-connection; says TCP anycast is not "safe" architecturally yet CDNs deploy it widely.
3. [root-servers.org](https://root-servers.org/), root server operators. Live site, primary: yes. Seen 2026-09-28: 13 root server identifiers, 12 operators, 2045 operational instances at 2026-09-28T17:46Z; FAQ: each identifier operates at one IPv4 and one IPv6 address.

Also opened, not cited: [A Brief Primer on Anycast](https://blog.cloudflare.com/a-brief-anycast-primer/), Matthew Prince, Cloudflare, 2011-10-21: CDN view (same IPs from 12 data centers in 2011, take a data center offline and traffic flows to the next closest, DDoS absorbed across sites). Good but dated; RFC 4786 covers the same points.

**Disagreements and tensions**

- **Is layering good?** RFC 1122 and Clark present the layers as the Internet's design. RFC 3439 argues strict layering hides information and adds complexity; TCP's pseudo-header already reaches into IP. The article should teach the layers and then show where real stacks cross them.
- **Four layers or seven?** RFC 1122 has four and folds OSI's presentation and application into one. Industry talk uses OSI numbers ("L4", "L7"). No opened source explains that habit; the Cloudflare OSI page (which might) returned 403.
- **TCP over anycast.** RFC 7094 calls it architecturally unsafe; RFC 7094 itself notes CDNs deploy it anyway, and RFC 4786 leaves it to operators to judge by routing stability vs transaction length.
- **Nearest is not fastest.** Anycast "nearest" means nearest by routing policy (BGP), and RFC 4786 says this doesn't in general match round-trip time.
- **TTL: time or hops?** RFC 791 defines it in seconds; RFC 1812 says in practice it's a hop count.

**Couldn't open**

- [What is the OSI model? (Cloudflare Learning)](https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/): HTTP 403 to WebFetch and a bot challenge to curl on 2026-09-28. Not used.

**Rejected**

- [struct sk_buff (kernel docs)](https://docs.kernel.org/networking/skbuff.html): opened 2026-09-28; describes buffer geometry, not layering. Might serve `packet-capture` or `tun-tap`.
- RFC 894 (IP over Ethernet, 1984): opened; has the 1500-octet maximum data field and type 0x0800, but MTU belongs to `mtu-and-fragmentation`. Pass it to that group.

**Gaps**

- No source opened for current IPv6 adoption share (Google's IPv6 statistics page is a chart). The article says nothing about adoption numbers.
- No source opened for why industry uses OSI layer numbers (L4/L7).
- No source for the size of the global BGP table today (RIPE RIS / CIDR report not opened).
- RFC 6890's tables are a 2013 snapshot; the live IANA registries weren't opened.

### Layers and addresses (continued)

#### `nat` (short)

1. [RFC 3022: Traditional IP Network Address Translator (Traditional NAT)](https://www.rfc-editor.org/rfc/rfc3022), P. Srisuresh and K. Egevang, January 2001. Spec (Informational), primary: yes. The definition of Basic NAT and NAPT, with a worked example. Seen 2026-09-28: abstract defines NAPT as many addresses and their TCP/UDP ports translated "into a single network address and its TCP/UDP ports"; section 2 says sessions "are uni-directional, outbound from the private network"; Figure 3 shows 10.0.0.10:3017 rewritten to 138.76.28.4:1024; section 3.1 says the binding is made on the first outgoing packet; section 4.1 covers IP/TCP/UDP checksum rewriting; section 6.3 says outbound fragments in NAPT "are doomed to fail"; section 5.2 lists the RFC 1918 private blocks.
2. [RFC 5382: NAT Behavioral Requirements for TCP](https://www.rfc-editor.org/rfc/rfc5382), S. Guha (ed.) et al., October 2008 (BCP 142). Spec, primary: yes. The TCP idle timeouts backend engineers run into. Seen 2026-09-28: REQ-5 says the "established connection idle-timeout" MUST NOT be less than 2 hours 4 minutes, and the transitory one not less than 4 minutes; explains the 2 h figure comes from default TCP keepalive interval (RFC 1122); REQ-1 endpoint-independent mapping; REQ-4 unsolicited inbound SYN handling.
3. [RFC 4787: NAT Behavioral Requirements for Unicast UDP](https://www.rfc-editor.org/rfc/rfc4787), F. Audet and C. Jennings (eds.), January 2007 (BCP 127). Spec, primary: yes. Names mapping and filtering behaviours precisely. Seen 2026-09-28: section 3 says the "Full Cone / Symmetric" terms have "been the source of much confusion"; section 4.1 defines endpoint-independent, address-dependent and address-and-port-dependent mapping; section 5 defines the same three for filtering; REQ-5 UDP mapping timer MUST NOT expire in less than two minutes, five minutes or more RECOMMENDED; REQ-9 hairpinning.

#### `mtu-and-fragmentation` (short)

1. [RFC 8900: IP Fragmentation Considered Fragile](https://www.rfc-editor.org/rfc/rfc8900), R. Bonica, F. Baker, G. Huston, R. Hinden, O. Troan, F. Gont, September 2020 (BCP 230). Spec, primary: yes. The single best modern reference: definitions of link MTU and PMTU, how fragmentation works in v4 and v6, and every way it breaks. Seen 2026-09-28: section 2.1 gives minimum link MTUs (68 for IPv4, 1280 for IPv6) and PMTU = smallest link MTU; section 2.2 says IPv6 packets may be fragmented only at the source; section 3 lists NAT, stateless firewalls, ECMP hashing, 16-bit ID wrap at high rates; section 3.9 cites studies where at least 28% of sampled paths dropped IPv6 fragments; section 6.1 "Developers SHOULD NOT develop new protocols or applications that rely on IP fragmentation."
2. [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), J. Postel, September 1981. Spec, primary: yes. Where the fields come from. Seen 2026-09-28: section 2.3 "Fragmentation" explains identification, fragment offset, more-fragments and don't-fragment; offset in units of 8 octets; reassembly at the destination keyed on identification, source, destination, protocol; section 3.2: every module must forward 68 octets, every destination must accept 576.
3. [RFC 894: A Standard for the Transmission of IP Datagrams over Ethernet Networks](https://www.rfc-editor.org/rfc/rfc894), C. Hornig, April 1984. Spec, primary: yes. Where 1500 comes from. Seen 2026-09-28: "the maximum length of an IP datagram sent over an Ethernet is 1500 octets" (the sentence before it has a typo, "minimum", in the original). Short; may be shared with `ethernet-and-arp`.

#### `icmp` (short)

1. [RFC 792: Internet Control Message Protocol](https://www.rfc-editor.org/rfc/rfc792), J. Postel, September 1981. Spec, primary: yes. Seen 2026-09-28: ICMP "is actually an integral part of IP"; its purpose is feedback, "not to make IP reliable"; no ICMP about ICMP; destination unreachable codes 0-5 incl. 3 port unreachable and 4 fragmentation needed and DF set; time exceeded code 0 when TTL hits zero; echo (8) / echo reply (0) with identifier and sequence number; error messages carry the original IP header plus 64 bits of data.
2. [RFC 4443: ICMPv6](https://www.rfc-editor.org/rfc/rfc4443), A. Conta, S. Deering, M. Gupta (ed.), March 2006. Spec, primary: yes. Seen 2026-09-28: types 0-127 are errors, 128-255 informational; Packet Too Big is type 2, MUST be sent by a router that can't forward a too-large packet; section 2.4(f) a node MUST rate-limit ICMPv6 errors, token bucket recommended, timer-based limits that break traceroute "are not recommended".
3. [RFC 1191: Path MTU Discovery](https://www.rfc-editor.org/rfc/rfc1191), J. Mogul and S. Deering, November 1990. Spec, primary: yes. Seen 2026-09-28: set DF on every packet, shrink on "Datagram Too Big", new Next-Hop MTU field; increases probed no sooner than 5 minutes after a Too Big (10 recommended). Also useful for `mtu-and-fragmentation`.
4. [traceroute(8)](https://man7.org/linux/man-pages/man8/traceroute.8.html), Traceroute for Linux, page dated 2006-10-11 on man7.org. Man page, primary: yes (the tool's own docs). Seen 2026-09-28: probes start with TTL 1 and go up until port unreachable or TCP reset, max 30 hops, three probes per TTL, "*" on timeout, !F for fragmentation needed; firewalls filter UDP and ICMP so TCP methods exist.
5. [tracepath(8)](https://man7.org/linux/man-pages/man8/tracepath.8.html), iputils. Man page, primary: yes. Seen 2026-09-28: traces the path "discovering MTU along this path", no root needed; example output shows pmtu 1500 then 1480. Not cited (traceroute was enough); good for the lab.

#### `network-latency` (deep)

1. [Primer on Latency and Bandwidth (High Performance Browser Networking, ch. 1)](https://hpbn.co/primer-on-latency-and-bandwidth/), Ilya Grigorik, O'Reilly 2013 (online edition). Book chapter, primary: no. The clearest single explanation. Seen 2026-09-28: the four delays (propagation, transmission, processing, queuing); fibre refractive index 1.4-1.6, rule of thumb 200,000,000 m/s; Table 1-1 (NY-London 5,585 km, 56 ms RTT in fibre; NY-Sydney 160 ms RTT, 200-300 ms in practice); last-mile latencies from FCC reports (fibre 10-20 ms, cable 15-40, DSL 30-65); bufferbloat sidebar says CoDel is in Linux 3.5+.
2. [The Internet at the Speed of Light](http://conferences.sigcomm.org/hotnets/2014/papers/hotnets-XIII-final111.pdf), Ankit Singla, Balakrishnan Chandrasekaran, P. Brighten Godfrey, Bruce Maggs, HotNets 2014. Paper, primary: yes (their own measurements). Seen 2026-09-28: HTML fetch from 400+ PlanetLab nodes to 28,000 sites is 34× c-latency in the median, 169× at p90; min ping 3.2×; router-path 2.3× of which 1.5× is fibre being ~2/3 c; fibre lengths usually 1.5-2× road distances; Akamai data: average RTT 1.9× minimum in the median (30 ms), bufferbloat a suspect but not the main cause on their paths.
3. [RFC 8289: Controlled Delay Active Queue Management](https://www.rfc-editor.org/rfc/rfc8289), K. Nichols, V. Jacobson, A. McGregor, J. Iyengar, January 2018. Spec (Experimental), primary: yes. Queuing delay from the people who built CoDel. Seen 2026-09-28: "good queue" vs "bad queue"; worked example of a 25-packet window over a 20-packet pipe giving a 5-packet standing queue; queues form at bottlenecks; buffer growth "fueled an exponential increase in buffer pool size"; target 5 ms, interval 100 ms.
4. [It's the Latency, Stupid](http://www.stuartcheshire.org/rants/latency.html), Stuart Cheshire, May 1996 (revised to 2001). Essay, primary: no (though Cheshire is a networking engineer, this is commentary). Seen 2026-09-28: bandwidth can be bought by adding links, latency can't; worked Stanford-Boston example: 4,320 km, fibre at ~66% of c, 43.2 ms ideal round trip vs 85 ms ping; a small packet on a modem pays 100 ms fixed latency plus 2.4 ms transmission.
5. [Azure network round-trip latency statistics](https://learn.microsoft.com/en-us/azure/networking/azure-network-latency), Microsoft Learn. See `latency-numbers` #6 (note exists: azure-network-latency). Directional latency, cross-region medians.
6. [napkin-math](https://github.com/sirupsen/napkin-math). See `latency-numbers` #4. Network rows (same region 250 µs, NA East-West 60 ms). Not cited in the article, the other sources cover it.

### Tools

#### `tun-tap` (short)

1. [Universal TUN/TAP device driver](https://docs.kernel.org/networking/tuntap.html), Maxim Krasnyansky et al., kernel docs (docs.kernel.org showed 7.3.0-rc5 on 2026-09-28). Official docs, primary: yes. Seen 2026-09-28: open /dev/net/tun and ioctl(TUNSETIFF) with IFF_TUN (IP packets) or IFF_TAP (Ethernet frames); IFF_NO_PI drops the 4-byte flags/proto prefix; closing the fd removes the device and its routes; CAP_NET_ADMIN needed to create devices; multiqueue since Linux 3.8; new IFF_BACKPRESSURE section (qdisc backpressure instead of TX drops when the ring is full); FAQ: "TUN works with IP frames. TAP works with Ethernet frames."
- Tried: man7.org ip-tuntap(8), 404 on 2026-09-28. Only one candidate found and opened; enough for a short node.

#### `packet-capture` (short)

1. [tcpdump(1)](https://www.tcpdump.org/manpages/tcpdump.1.html), The Tcpdump Group, page updated 2026-07-31, documents tcpdump 5.0.0-PRE-GIT (4.99.x is the release line). Man page, primary: yes. Seen 2026-09-28: -w / -r save and read pcap files; -s default snaplen 262144 bytes; "dropped by kernel" count; timestamps are when the kernel stamped the packet, not wire time; -K because checksum offload makes outgoing TCP checksums look bad; "[was 0, presumed TSO]" for offloaded sends; TCP output format Flags [S], [S.], [.]; capturing may need privileges, reading a file doesn't.
2. [The BSD Packet Filter: A New Architecture for User-level Packet Capture](https://www.tcpdump.org/papers/bpf-usenix93.pdf), Steven McCanne and Van Jacobson, Winter USENIX 1993. Paper, primary: yes. Seen 2026-09-28: tap + filter architecture; the driver calls BPF before the stack; filter decides whether and how many bytes to copy; copying across the kernel boundary is the cost, filtering early avoids it; register-based filter up to 20× faster than CSPF.
3. [Wireshark User's Guide, chapter 1](https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html), Wireshark project. Docs, primary: yes. Seen 2026-09-28: "Wireshark is a network packet analyzer"; opens tcpdump captures; protocol dissectors; doesn't send packets.
4. [pcap-filter(7)](https://www.tcpdump.org/manpages/pcap-filter.7.html), libpcap 1.11.1-PRE-GIT, updated 2026-09-16. Man page, primary: yes. Filter syntax: primitives with type/dir/proto qualifiers, compiled by pcap_compile. Not cited; tcpdump(1) examples were enough.

**Disagreements and tensions**
- **Is queuing or distance the big latency cost?** RFC 8289 (and the bufferbloat work behind it) treats oversized, always-full buffers at the consumer edge as a major source of delay. Singla et al. (2014) found that on well-connected PlanetLab paths bufferbloat couldn't explain most of the inflation; circuitous fibre, routing and protocol round trips did. Both can be true: it depends where you measure (home uplink vs datacenter).
- **Fragmentation: deprecate or tolerate?** RFC 8900 stops short of deprecating IP fragmentation because DNS, IPsec tunnel mode and IP-in-IP still need it, but tells new protocols not to rely on it.
- **NAT naming.** RFC 4787 drops "full cone / symmetric" (from STUN, RFC 3489) as confusing and defines mapping and filtering separately. Blogs still use the old words.
- **ICMP filtering.** Security guides often say to drop ICMP; RFC 8900 and RFC 4443 say Packet Too Big must get through and ICMPv6 errors should be rate-limited, not blocked.

**Couldn't open**
- ACM Queue "Bufferbloat: Dark Buffers in the Internet" (Gettys and Nichols, 2011), https://queue.acm.org/detail.cfm?id=2071893: Cloudflare block page with curl, HTTP 403 with WebFetch, 2026-09-28. The CACM reprint (cacm.acm.org/magazines/2012/1/144810) returned a JS challenge and 403 too. Replaced by RFC 8289 (same authors' circle, primary).
- man7.org ip-tuntap(8): 404.

**Rejected**
- tracepath(8) and pcap-filter(7): opened and fine, but not needed for short nodes. Keep for the lab.
- napkin-math for `network-latency`: its network rows are unlabelled estimates next to measured single-host numbers; the Azure page has method and dates.

**Gaps**
- No opened source gives a Linux default for PMTU probing (`net.ipv4.tcp_mtu_probing`) or the `ip-sysctl` docs; not needed yet, check docs.kernel.org networking/ip-sysctl if the lab needs it.
- No opened source measures processing delay in a modern router; the article says only that it's usually small.
- Carrier-grade NAT (RFC 6888) was only seen cited inside RFC 8900, not opened.
- Wi-Fi's own contribution to latency: only our experiment 0001 (router ping 1.7 ms best, 32.9 ms worst).

### Transport, core

#### `ports-and-sockets` (deep)

1. [socket(2)](https://man7.org/linux/man-pages/man2/socket.2.html), man-pages 6.19, 2025-10-29. Man page, primary: yes. Seen 2026-09-28: socket() returns the lowest free fd; SOCK_STREAM is "sequenced, reliable, two-way, connection-based byte streams" with no record boundaries; SOCK_DGRAM is "connectionless, unreliable messages of a fixed maximum length"; SOCK_NONBLOCK and SOCK_CLOEXEC flags since Linux 2.6.27; EMFILE/ENFILE; history 4.2BSD.
2. [listen(2)](https://man7.org/linux/man-pages/man2/listen.2.html), man-pages 6.19, 2026-02-11. Man page, primary: yes. Seen 2026-09-28: backlog is the queue of completely established sockets since Linux 2.2; SYN queue set by tcp_max_syn_backlog; backlog silently capped to somaxconn, default 4096 since Linux 5.4 (128 before); listen on an unbound socket picks an ephemeral port; EADDRINUSE when the range is used up.
3. [accept(2)](https://man7.org/linux/man-pages/man2/accept.2.html), man-pages 6.19, 2025-10-29. Man page, primary: yes. Seen 2026-09-28: takes the first connection off the queue and returns a new fd; the listening socket is unaffected; blocks or EAGAIN; accept4 flags; Linux does not inherit O_NONBLOCK from the listener; pending network errors come back from accept.
4. [connect(2)](https://man7.org/linux/man-pages/man2/connect.2.html), man-pages 6.19, 2026-02-08. Man page, primary: yes. Seen 2026-09-28: on a datagram socket connect only sets the default peer; ECONNREFUSED, ETIMEDOUT, EINPROGRESS for nonblocking connects (check SO_ERROR after writability); EADDRNOTAVAIL when no ephemeral port is free; after a failed connect, close and make a new socket. Not used in the article (ip(7) and Cloudflare cover the same points).
5. [ip(7)](https://man7.org/linux/man-pages/man7/ip.7.html), man-pages 6.19, 2026-02-08. Man page, primary: yes. Seen 2026-09-28: an IP socket address is an address plus a 16-bit port; ports are a transport concept, not IP; only one socket per (address, port) for receiving; INADDR_ANY binds all interfaces; listen/connect on an unbound socket auto-binds a random free port; ports below 1024 need CAP_NET_BIND_SERVICE; network byte order (htons); a closed TCP address stays unavailable for a while unless SO_REUSEADDR.
6. [How to stop running out of ephemeral ports and start to love long-lived connections](https://blog.cloudflare.com/how-to-stop-running-out-of-ephemeral-ports-and-start-to-love-long-lived-connections/), Marek Majkowski, Cloudflare, 2022-02-02. Engineering blog, primary: yes (runs it in production). Seen 2026-09-28: `ssh 127.0.0.1` failing with "Cannot assign requested address" from ephemeral port exhaustion; default range 32768-60999 (28,232 ports); a TCP connection is a 4-tuple, so plain connect() can reuse a source port toward different destinations; bind(src_ip, 0) before connect locks a port per connection (EADDRINUSE); IP_BIND_ADDRESS_NO_PORT (2015) fixes it; connected UDP sockets are limited by the range.
7. [RFC 6335](https://www.rfc-editor.org/rfc/rfc6335), Cotton, Eggert, Touch, Westerlund, Cheshire, August 2011, BCP 165. Spec, primary: yes. Seen 2026-09-28: section 6, three ranges: System 0-1023, User 1024-49151, Dynamic/Ephemeral 49152-65535 (never assigned).

Extra: [RFC 6056](https://www.rfc-editor.org/rfc/rfc6056), Larsen and Gont, January 2011, BCP 156. Seen 2026-09-28: a transport instance is a five-tuple; sequential ephemeral ports are guessable and leak connection counts; recommends randomizing and using the whole 1024-65535 range, excluding ports used by local services. Good for "Where it gets tricky", not used this time.

Extra: [socket(7)](https://man7.org/linux/man-pages/man7/socket.7.html), man-pages 6.19, 2026-06-05. Seen 2026-09-28: SO_REUSEADDR semantics; SO_REUSEPORT since Linux 3.9, one listener per thread for accept load spreading, same effective UID required. Not used.

#### `udp` (short)

1. [RFC 768](https://www.rfc-editor.org/rfc/rfc768), Jon Postel, 1980-08-28. Spec, primary: yes. Seen 2026-09-28: three pages; 8-byte header (source port, destination port, length, checksum); source port optional (0 if unused); length minimum 8; checksum over a pseudo-header, all-zero means "no checksum"; delivery and duplicate protection "not guaranteed"; protocol number 17; early users were the name server and TFTP.
2. [RFC 8085](https://www.rfc-editor.org/rfc/rfc8085), Eggert, Fairhurst, Shepherd, March 2017, BCP 145. Spec (best current practice), primary: yes. Seen 2026-09-28: UDP has no congestion control, apps must add it; max payload 65,507 (IPv4) / 65,527 (IPv6) bytes; avoid IP fragmentation, stay under path MTU, fall back to 576 (IPv4) / 1280 (IPv6); no retransmit, no dedup, no ordering, apps must do their own; delayed duplicates within 2 minutes; checksums weak; NAT state times out, keep-alives no more than every 15 s; NATs must keep state at least 2 minutes (RFC 4787) but many use shorter.

Extra: [udp(7)](https://man7.org/linux/man-pages/man7/udp.7.html), man-pages 6.19, 2026-02-08. Seen 2026-09-28: each receive returns one packet, truncated with MSG_TRUNC if the buffer is small; connect sets a default destination; Linux does PMTU discovery for UDP and returns EMSGSIZE; UDP_SEGMENT (GSO) since 4.18. Not used (kept to 2 sources).

Extra: [Everything you ever wanted to know about UDP sockets but were afraid to ask, part 1](https://blog.cloudflare.com/everything-you-ever-wanted-to-know-about-udp-sockets-but-were-afraid-to-ask-part-1/), Marek Majkowski, Cloudflare, 2021-11-25. Seen 2026-09-28: connected vs unconnected UDP sockets; prefer connected sockets for outbound; echo servers are a reflection risk. Good follow-up for phase 4 (servers).

#### `tcp` (deep)

1. [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293), Wesley Eddy (ed.), August 2022, STD 7. Spec, primary: yes. Obsoletes RFC 793. Seen 2026-09-28: section 2.2 key concepts (reliable, in-order byte stream; segments in IP datagrams; loss detection by sequence numbers, errors by checksum; no built-in liveness); 3.1 header (figure 1); 3.3.2 eleven states and the state diagram (figure 5); 3.4 every byte has a sequence number, ACKs are cumulative, 32-bit space, SYN and FIN take a sequence number; 3.4.1 connection = pair of sockets, ISN = 4 µs clock + keyed hash, three-way handshake; 3.6 close is "no more data to send", half-close, TIME-WAIT 2 MSL; 3.7 segment boundaries don't match write() boundaries; 3.8.1 RTO per RFC 6298; 3.8.3 R1 >= 3 retransmissions, R2 >= 100 s; 3.8.4 keep-alives off by default, 2 h interval minimum; 7 no encryption.
2. [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html), man-pages 6.19, 2026-04-19. Man page, primary: yes. Seen 2026-09-28: Linux TCP is RFC 793/1122/2001 with NewReno and SACK; doesn't preserve record boundaries; RFC 1323 extensions (timestamps, window scaling, PAWS); socket buffer sizes; tcp_retries2 default 15, "approximately between 13 to 30 minutes"; TCP_USER_TIMEOUT since 2.6.37; tcp_tw_reuse listed as "default: disabled" (out of date, see tensions).
3. [socket(2)](https://man7.org/linux/man-pages/man2/socket.2.html). See ports-and-sockets #1. SOCK_STREAM semantics; SIGPIPE on writing to a broken stream.
4. [When TCP sockets refuse to die](https://blog.cloudflare.com/when-tcp-sockets-refuse-to-die/), Marek Majkowski, Cloudflare, 2019-09-20. Engineering blog, primary: yes (their own tests, Linux 5.2). Seen 2026-09-28: tcpdump plus ss timelines: SYN retried 6 times, ETIMEDOUT at about 130 s; SYN-ACK retried 5 times; idle ESTABLISHED has no timer and lives forever; keepalive probes; busy socket with unacked data retransmitted 15 times, died at about 940 s (tcp_retries2); TCP_USER_TIMEOUT overrides retries2 and changes keepalive; zero-window probing; recommendation: keepalives + TCP_USER_TIMEOUT.

Extra: [RFC 2018](https://www.rfc-editor.org/rfc/rfc2018), Mathis, Mahdavi, Floyd, Romanow, October 1996. Seen 2026-09-28: cumulative ACKs tell the sender about one lost packet per round trip; SACK lets the receiver report every block it has. Background for tcp-retransmission; not used (RFC 8985 covers SACK's role).

#### `tcp-handshake` (short)

1. [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293). See tcp #1. Section 3.4.1 (why three messages: steps 2 and 3 combine; the receiver of a SYN can't tell an old one from a new one), 3.5 figures 6-8 (basic handshake with SEQ=100/300, simultaneous open, old duplicate SYN reset), 3.8.3 (SYN retries at least 3 minutes, MUST-23), 7 (SYN flooding is a known attack; OSes carry mitigations).
2. [SYN packet handling in the wild](https://blog.cloudflare.com/syn-packet-handling-in-the-wild/), Marek Majkowski, Cloudflare, 2018-01-15. Engineering blog, primary: yes. Seen 2026-09-28: every listening socket has a SYN queue and an accept queue; SYN-ACK retries (tcp_synack_retries 5, final timeout 63 s); both queue sizes come from listen() backlog, capped by somaxconn; full accept queue drops SYNs and ACKs as push-back (ListenOverflows/ListenDrops); SYN flood fills the SYN queue; SYN cookies encode state in the sequence number (6 bits time, 2 bits MSS, 24 bits hash), losing options unless timestamps carry them; 256 bytes per request sock on 4.14; SYN cookies fast since Linux 4.4; Cloudflare sees floods over 200 million packets per second and drops them with BPF instead.

Extra: [RFC 4987](https://www.rfc-editor.org/rfc/rfc4987), Wesley Eddy, August 2007, informational. Seen 2026-09-28: SYN flooding known since 1994, public 1996; attacker spoofs addresses so SYN-ACKs are never answered; defenses: filtering, bigger backlog, shorter SYN-RECEIVED timer, recycling oldest, SYN cache, SYN cookies, hybrids, proxies; SYN cookies lose TCP options and break protocols where the server speaks first (SMTP) when the final ACK is lost. Primary for the attack; kept to 2 sources for the short node.

Extra: [TCP Fast Open, RFC 7413](https://www.rfc-editor.org/rfc/rfc7413), December 2014, experimental. Downloaded 2026-09-28, not read. Not used; Linux sysctl tcp_fastopen (kernel-ip-sysctl) shows client on, server off by default.

#### `time-wait` (short)

1. [Coping with the TCP TIME-WAIT state on busy Linux servers](https://vincent.bernat.ch/en/blog/2014-tcp-time-wait-state-linux), Vincent Bernat, 2014-02-24, updated 2017-09. Blog (network engineer), primary: no, high quality. Seen 2026-09-28: only the side that closes first gets TIME-WAIT; two purposes (old duplicates, remote stuck in LAST-ACK); Linux TIME-WAIT is fixed at 60 s (TCP_TIMEWAIT_LEN) and not tunable; a server with a fixed peer gets about 30,000 ports per minute, about 500 connections per second; memory cost is small (tcp_timewait_sock 168 bytes); fixes: more quadruplets, SO_LINGER, tcp_tw_reuse (outgoing only, needs timestamps, reuse after 1 s); tcp_tw_recycle broke NAT users and was removed in Linux 4.12; "do not let clients close first" advice.
2. [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293). See tcp #1. Section 3.6 figure 12 (normal close), MUST-13 2xMSL, MSL 2 minutes (glossary), TIME-WAIT state definition, SHLD-4 timestamp-based reduction (RFC 6191).
3. [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel docs, read 2026-09-28. Official docs, primary: yes. tcp_tw_reuse default 2 (loopback only), tcp_tw_reuse_delay default 1000 ms, tcp_max_tw_buckets (don't lower it), tcp_fin_timeout 60 s is for orphaned FIN_WAIT_2 (not TIME_WAIT), ip_local_port_range default 32768-60999.

Extra: [RFC 6191](https://www.rfc-editor.org/rfc/rfc6191), downloaded 2026-09-28, not read. RFC 9293 cites it as [40], "Reducing the TIME-WAIT State Using TCP Timestamps" (Gont, BCP 159, April 2011).

#### `tcp-retransmission` (deep)

1. [RFC 6298](https://www.rfc-editor.org/rfc/rfc6298), Paxson, Allman, Chu, Sargent, June 2011. Spec, primary: yes. Re-opened 2026-09-29: SRTT/RTTVAR update rules with alpha 1/8 and beta 1/4, RTO = SRTT + max(G, 4*RTTVAR), initial RTO 1 s, SHOULD round up to 1 s, max at least 60 s, Karn's rule, timestamps remove the ambiguity, back off by doubling. Note exists.
2. [RFC 8985](https://www.rfc-editor.org/rfc/rfc8985), Cheng, Cardwell, Dukkipati, Jha (Google), February 2021. Spec, primary: yes. Re-opened 2026-09-29: the three failure cases of DupAck counting; RACK time-based inference; TLP after about 2 RTTs; reordering window starts at min_RTT/4, grows by min_RTT/4 per round trip with DSACK, bounded by SRTT, reset after 16 recoveries; 9.1 disadvantages (per-packet send times, clock granularity in data centers, reordering timer can fire early); 9.2 RACK-TLP does not detect spurious RTOs, works with F-RTO and Eifel. Note exists; appended.
3. [RFC 2018](https://www.rfc-editor.org/rfc/rfc2018), Mathis, Mahdavi, Floyd, Romanow, October 1996. Spec, primary: yes. Opened 2026-09-29: SACK-permitted on the SYN; SACK option lists blocks by left/right edge; max 4 blocks, 3 with timestamps; first block must be the newest; blocks repeated so each is reported at least three times; SACK is advisory, receiver may renege, sender must keep data until cumulatively ACKed and ignore SACK info after an RTO; section 7 worked examples (500-byte segments from 5000). New note `rfc-2018`.
4. [RFC 5681](https://www.rfc-editor.org/rfc/rfc5681), Allman, Paxson, Blanton, September 2009. Spec, primary: yes. Fast retransmit on 3 duplicate ACKs; RTO sets cwnd to 1 segment. Note exists, unchanged.
5. [RFC 5682](https://www.rfc-editor.org/rfc/rfc5682), Sarolahti, Kojo, Yamamoto, Hata, September 2009. Spec, primary: yes (authors of F-RTO). Opened 2026-09-29: spurious RTOs from delay spikes (mobile handoffs, path change, competing traffic, link-layer retries); after a spurious RTO the late ACKs trigger resending a whole window; F-RTO sends new data after the RTO retransmit and declares the timeout spurious if the next two ACKs advance the window; Eifel uses timestamps, DSACK lets the receiver report duplicates. New note `rfc-5682`.
6. [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel docs (7.3.0-rc5 build). Docs, primary: yes. Re-opened 2026-09-29: tcp_rto_min_us 200000 with socket/route overrides and "recommended practice" of ≤ 200 ms; tcp_rto_max_ms 120000; tcp_recovery (RACK only; 0x2 makes the reordering window static min_rtt/4); tcp_early_retrans 3 (TLP); tcp_sack 1; tcp_dsack 1; tcp_frto on; tcp_timestamps 1; tcp_retries2 15 (924.6 s lower bound; RFC 1122's 100 s). Note exists; appended.

Extra: [RFC 2883](https://www.rfc-editor.org/rfc/rfc2883), Floyd, Mahdavi, Mathis and others, July 2000. Opened 2026-09-29 (abstract only): D-SACK reports duplicate segments in the first SACK block so the sender can infer it retransmitted unnecessarily. Not given a note; RFC 5682 and RFC 8985 cover what the article needs about DSACK.
Extra: [RFC 3522](https://www.rfc-editor.org/rfc/rfc3522) (Eifel detection) and [RFC 4653](https://www.rfc-editor.org/rfc/rfc4653) (TCP-NCR), downloaded 2026-09-29, not read. Not used.

#### `tcp-keepalive` (short)

1. [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html), man-pages 6.19, 2026-04-19. Docs, primary: yes. Opened 2026-09-29: tcp_keepalive_time 7200 s, tcp_keepalive_intvl 75 s, tcp_keepalive_probes 9 (about 11 more minutes); keepalives only with SO_KEEPALIVE; TCP_KEEPIDLE/KEEPINTVL/KEEPCNT per socket (Linux 2.4, not portable); TCP_USER_TIMEOUT (2.6.37) overrides keepalive's give-up decision, doesn't change when probes or retransmits are sent, is inherited from a listening socket. Note exists; appended.
2. [When TCP sockets refuse to die](https://blog.cloudflare.com/when-tcp-sockets-refuse-to-die/), Majkowski, Cloudflare, 2019-09-20. Blog, primary: yes. Opened 2026-09-29: idle ESTABLISHED has no timer; keepalive trace with KEEPIDLE 5/INTVL 3/CNT 3 dying at about 14 s with RST; keepalives need an empty send buffer; with TCP_USER_TIMEOUT set, KEEPCNT is ignored (6 probes seen with 30 s user timeout); busy and zero-window sockets ignore keepalives; application timeout bug; recommendation. Note exists; appended.
3. [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122), Braden, October 1989. Spec, primary: yes. Opened 2026-09-29: section 4.2.3.6 keep-alives MAY, off by default, interval at least 2 hours, a missing reply to one probe isn't a dead connection, why the TCP spec left them out, probe is SEG.SEQ = SND.NXT-1, a crashed peer answers with RST; 4.2.3.5 R1/R2 thresholds (R2 at least 100 s). Note exists; appended.
4. [RFC 5382](https://www.rfc-editor.org/rfc/rfc5382), BCP 142, October 2008. Spec, primary: yes. NAT established idle timeout at least 2 h 4 min; some NATs reap idle sessions early. Note exists, unchanged.
5. [Network Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/network-load-balancers.html), AWS docs. Docs, primary: yes. Opened 2026-09-29: NLB idle timeout for TCP 350 s by default, configurable 60-6000 s; after it the client gets an RST if it sends; TCP keepalives reset the idle timer. New note `aws-nlb-docs`.
6. [Keepalive (gRPC guide)](https://grpc.io/docs/guides/keepalive/), gRPC authors, last modified 2025-11-10. Docs, primary: yes. Opened 2026-09-29: HTTP/2 PING-based keepalive; KEEPALIVE_TIME client default disabled, server 2 h; KEEPALIVE_TIMEOUT 20 s; server enforces PERMIT_KEEPALIVE_TIME 5 min and answers with GOAWAY too_many_pings; don't set client keepalive much below one minute; TCP_USER_TIMEOUT behind a TCP load balancer only watches the hop to the balancer, PINGs go end to end. New note `grpc-keepalive`.

Extra: [RFC 5482](https://www.rfc-editor.org/rfc/rfc5482), Eggert, Gont, March 2009. Spec, primary: yes. Opened 2026-09-29: the user timeout is a local per-connection parameter from RFC 793 (default 5 minutes); the UTO option advertises it to the peer as advice; stateful firewalls may drop idle state regardless; if used with UTO, the keep-alive timer MUST be larger than the user timeout. Not cited: Linux's TCP_USER_TIMEOUT socket option is the local parameter only, and no source opened says whether Linux sends the UTO option, so the article would have to leave the option dangling. Kept out to stay near the short-node source count.
Extra: socket(7) (https://man7.org/linux/man-pages/man7/socket.7.html), opened 2026-09-29: SO_KEEPALIVE "Enable sending of keep-alive messages on connection-oriented sockets." Not given a note (id man7-socket is taken by socket(2)); tcp(7) says the same thing.

**Disagreements and tensions**

- **tcp_tw_reuse default.** tcp(7) (man-pages 6.19, 2026-04-19) still lists it as "default: disabled" and a Boolean. The kernel's ip-sysctl doc lists values 0/1/2 with default 2 (loopback only). Bernat (2014) describes the old 0 default. The man page is behind the kernel.
- **Which knob sizes the SYN queue.** listen(2) says tcp_max_syn_backlog sets the queue of incomplete sockets; Cloudflare (2018, kernel 4.x) says both queues come from the listen() backlog capped by somaxconn and tcp_max_syn_backlog no longer does it; ip-sysctl today calls tcp_max_syn_backlog a "per-listener limit". The exact rule has changed across kernel versions; the article says only that the backlog and somaxconn cap the accept queue, and that the SYN queue has its own limit.
- **Minimum RTO.** RFC 6298 says the RTO SHOULD be rounded up to 1 s. Linux's tcp_rto_min_us defaults to 200 ms. Cloudflare's trace (Linux 5.2) shows retransmits after about 200 ms. Linux departs from the RFC's SHOULD on purpose (the RFC itself says research may show a smaller minimum is fine).
- **SYN cookies.** ip-sysctl and tcp(7) call them a last-resort that "seriously violate TCP protocol"; Cloudflare says keep the default (on when the queue overflows) and that they solve small floods; RFC 4987 says they lose options and can break server-speaks-first protocols. They agree on the facts; they disagree on tone.
- **Ephemeral port range.** IANA/RFC 6335 dynamic range is 49152-65535; RFC 6056 says use 1024-65535; Linux defaults to 32768-60999.
- **Connection timeout numbers.** tcp(7) says tcp_retries2=15 means "approximately between 13 to 30 minutes"; ip-sysctl says a hypothetical 924.6 s lower bound; Cloudflare measured about 940 s. The man page range is loose.

**Couldn't open**

- `https://blog.cloudflare.com/cloudflare-now-supports-bind-before-connect/` (a guess at the 2014 "bind before connect" post): returned "Page Not Found". Not needed; the 2022 ephemeral ports post covers it.

**Rejected**

- RFC 7413 (TCP Fast Open): out of scope for a short handshake article; can come back for phase 3 (TLS 1.3 0-RTT) if needed.

**Gaps**

- No source yet for how Linux actually picks the ephemeral port (the RFC 6056 algorithm it uses, and the even/odd split between connect and bind). ip-sysctl hints at it ("different parity") without explaining.
- No primary source for the Linux 60 s TIME_WAIT constant other than Bernat's quote of `include/net/tcp.h`. Could open the kernel source on git.kernel.org next time.
- No measured numbers of our own: handshake cost, TIME_WAIT counts, retransmission timelines. A small phase 2 lab run could produce all three.

### Transport, performance

#### `tcp-flow-control` (short)

1. [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), W. Eddy (ed.), August 2022. Spec, primary: yes (STD 7, obsoletes RFC 793). Seen 2026-09-28: the 16-bit Window field is "The number of data octets beginning with the one indicated in the acknowledgment field that the sender of this segment is willing to accept" (3.1); 3.8.6 "Managing the Window" (shrinking the window is "strongly discouraged"); 3.8.6.1 zero-window probing (first probe after one RTO, exponential backoff, a receiver MAY keep its window closed indefinitely); 3.8.6.2 silly window syndrome, the usable window U = SND.UNA + SND.WND - SND.NXT, receiver splits RCV.BUFF into unread data, advertised window and "reduction". Also serves `nagle-and-delayed-ack` and `congestion-control` (3.8.2).
2. [RFC 7323: TCP Extensions for High Performance](https://www.rfc-editor.org/rfc/rfc7323), Borman, Braden, Jacobson, Scheffenegger (ed.), September 2014. Spec, primary: yes (obsoletes RFC 1323). Seen 2026-09-28: 1.1 "long, fat network" (LFN), 16-bit window caps at 2^16 = 64 KiB; 2.1/2.2 Window Scale option, sent only on SYN, shift count max 14, window up to 1 GiB (2^(14+16)). Also serves `bandwidth-delay-product`.
3. [ip-sysctl (Linux kernel docs)](https://docs.kernel.org/networking/ip-sysctl.html), kernel docs, page built from 7.3.0-rc5. Docs, primary: yes. Seen 2026-09-28: tcp_rmem min/default/max (default 131072 bytes, "results in initial window of 65535", max between 131072 and 32MB by RAM; SO_RCVBUF disables autotuning), tcp_moderate_rcvbuf default 1, tcp_window_scaling default 1, tcp_adv_win_scale obsolete since 6.6, tcp_shrink_window. Also serves `congestion-control` (tcp_congestion_control) and `bandwidth-delay-product`.
4. [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html), man-pages 6.19, page dated 2026-04-19. Man page, primary: yes. Seen 2026-09-28: tcp_rmem, tcp_window_scaling ("Normally, the 16 bit window length field in the TCP header limits the window size to less than 64 kB"), TCP_WINDOW_CLAMP; note its tcp_rmem default (87380) is older than the kernel doc's (131072). Mainly for `nagle-and-delayed-ack`.

#### `congestion-control` (deep)

1. [Congestion Avoidance and Control](https://ee.lbl.gov/papers/congavoid.pdf), Van Jacobson and Michael J. Karels, November 1988 (revised version of the SIGCOMM '88 paper). Paper, primary: yes. Seen 2026-09-28: October 1986 collapse, LBL to UC Berkeley throughput "dropped from 32 Kbps to 40 bps"; "conservation of packets"; self-clocking figure 1 (redrawable); slow-start in four bullets, takes R log2 W; loss as the congestion signal; AIMD ("On any timeout, set cwnd to half the current window size").
2. [RFC 5681: TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681), Allman, Paxson, Blanton, September 2009. Spec, primary: yes. Seen 2026-09-28: cwnd, rwnd, "The minimum of cwnd and rwnd governs data transmission"; slow start, congestion avoidance (+1 SMSS per RTT), ssthresh = max(FlightSize/2, 2*SMSS), timeout sets cwnd to 1 segment, fast retransmit on 3 duplicate ACKs, fast recovery; 4.1 restart after idle; 4.2 delayed ACK within 500 ms.
3. [RFC 9438: CUBIC for Fast and Long-Distance Networks](https://www.rfc-editor.org/rfc/rfc9438), Xu, Ha, Rhee, Goel, Eggert (ed.), August 2023. Spec, primary: yes (obsoletes RFC 8312, now Standards Track). Seen 2026-09-28: default in Linux, Windows and Apple stacks; W_cubic(t) = C(t-K)^3 + W_max; concave then convex growth around W_max; beta_cubic 0.7 vs Reno 0.5; C = 0.4; Reno-friendly region; HyStart++ for slow start.
4. [BBR: Congestion-Based Congestion Control](https://web.stanford.edu/class/cs244/papers/bbr.pdf), Cardwell, Cheng, Gunn, Hassas Yeganeh, Jacobson, ACM Queue vol. 14 no. 5, Sept-Oct 2016 (copy hosted by Stanford CS244; queue.acm.org blocked us). Article, primary: yes. Seen 2026-09-28: figure 1 delivery rate and RTT vs inflight, optimum at BDP, loss-based operates at the buffer edge; BtlBw, RTprop; Startup gain 2/ln2, Drain, ProbeBW gain cycle 1.25/0.75, ProbeRTT; B4 "2 to 25 times greater than CUBIC's"; YouTube median RTT down 53% globally; CUBIC stalls above 1% random loss on a 100-Mbps/100-ms link; competes unfairly against loss-based flows when buffers are many BDPs.
5. [BBR Congestion Control (draft-ietf-ccwg-bbr-06)](https://datatracker.ietf.org/doc/draft-ietf-ccwg-bbr/), Cardwell, Swett, Beshay (eds.), 2026-07-06, expires 2027-01-07. Internet-Draft, Experimental, primary: yes. Seen 2026-09-28: specifies BBRv3; uses delivery rate, RTT and loss rate; loss threshold 2% per round trip; CUBIC needs loss below 0.000003% for 10 Gbps over 100 ms; Linux TCP BBRv3 lives in github.com/google/bbr v3 branch (last updated 2023-11-22).
6. [ip-sysctl](https://docs.kernel.org/networking/ip-sysctl.html), see `tcp-flow-control` #3: tcp_congestion_control, tcp_available_congestion_control, tcp_slow_start_after_idle (default 1).
7. [RFC 6928: Increasing TCP's Initial Window](https://www.rfc-editor.org/rfc/rfc6928), Chu, Dukkipati, Cheng, Mathis, April 2013. Spec (Experimental), primary: yes. Seen 2026-09-28: IW = min(10*MSS, max(2*MSS, 14600)). Linux `include/net/tcp.h` (7.3-rc5) has TCP_INIT_CWND 10 "as per rfc6928".
8. Linux source `net/ipv4/tcp_bbr.c` and `tcp_cubic.c` (torvalds master, 7.3-rc5), code, primary: yes. Seen 2026-09-28: mainline tcp_bbr.c header describes STARTUP/DRAIN/PROBE_BW/PROBE_RTT, cites the 2016 ACM Queue paper, "does not react directly to packet losses or delays"; tcp_cubic.c beta = 717/1024. Used only as a check, not cited.

#### `bandwidth-delay-product` (short)

1. [RFC 7323](https://www.rfc-editor.org/rfc/rfc7323), see `tcp-flow-control` #2: LFN definition and the 64 KiB cap.
2. [Optimizing TCP for high WAN throughput while preserving low latency](https://blog.cloudflare.com/optimizing-tcp-for-high-throughput-and-low-latency/), Mike Freemon, Cloudflare, 2022-07-01. Engineering blog, primary: yes (they run and patched the stack). Seen 2026-09-28: max RTT 300 ms (Zurich-Sydney) and 3500 Mbps target give "a BDP of 131MB", rounded to 128 MiB; "It is this receive window that often limits throughput over high-latency networks"; old tcp_rmem 4 MiB to avoid collapse latency spikes; new tcp_rmem 8192 262144 536870912; Iowa to Marseille (121 ms) 276 to 6600 Mbps, Melbourne to Marseille (282 ms) 120 to 3800 Mbps, kernel 5.15.32, iperf3 3.9. Their tcp_collapse_max_bytes is their own patch.
3. BBR paper, see `congestion-control` #4: BDP = BtlBw x RTprop, and B4 connections limited by an 8 MB receive buffer.

#### `nagle-and-delayed-ack` (short)

1. [RFC 896: Congestion Control in IP/TCP Internetworks](https://www.rfc-editor.org/rfc/rfc896), John Nagle, 1984-01-06. Memo, primary: yes. Seen 2026-09-28: 41-byte packets for one byte of data, "4000% overhead"; the rule: hold new segments while earlier data is unacknowledged, no timers; also coins "congestion collapse".
2. [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293), see `tcp-flow-control` #1: 3.7.4 Nagle (SHLD-7, MUST-17 a way to disable it), 3.8.6.3 delayed ACK (delay MUST be under 0.5 s, ACK at least every second full-sized segment), Appendix A.3 "the combination of the Nagle algorithm and delayed acknowledgments can result in poor application performance".
3. [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html): TCP_NODELAY, TCP_QUICKACK (not permanent), TCP_CORK (200 ms ceiling), tcp_autocorking.
4. [include/net/tcp.h](https://github.com/torvalds/linux/blob/master/include/net/tcp.h), Linux source, 7.3-rc5. Code, primary: yes. Seen 2026-09-28: TCP_DELACK_MIN = HZ/25 (40 ms), TCP_DELACK_MAX = HZ/5 (200 ms), TCP_INIT_CWND 10.
5. [It's always TCP_NODELAY. Every damn time.](https://brooker.co.za/blog/2024/05/09/nagle.html), Marc Brooker, 2024-05-09. Blog, primary: no. Seen 2026-09-28: argues TCP_NODELAY should be the default; quotes Nagle's HN comment blaming the fixed delayed-ACK timer; doesn't reach for TCP_QUICKACK (not portable, odd semantics).
6. [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122), October 1989. Spec, primary: yes. Seen 2026-09-28: 4.2.3.2 delayed ACK rationale (can cut server segments by a factor of 3 in remote login), 4.2.3.4 Nagle. RFC 9293 restates both; not cited.

#### `head-of-line-blocking` (short)

1. [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), M. Bishop (ed.), June 2022. Spec, primary: yes. Seen 2026-09-28: 1.1 HTTP/2 multiplexing "is not visible to TCP's loss recovery mechanisms, a lost or reordered packet causes all active transactions to experience a stall"; 1.2 QUIC gives per-stream reliability.
2. [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000), Iyengar and Thomson (eds.), May 2021. Spec, primary: yes. Seen 2026-09-28: section 13, only streams with data in the lost packet are blocked; a packet carrying frames from several streams blocks all of them.
3. [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), Thomson and Benfield (eds.), June 2022. Spec, primary: yes. Seen 2026-09-28: HTTP/1.1 pipelining "still suffers from application-layer head-of-line blocking"; "TCP head-of-line blocking is not addressed by this protocol".

#### `bufferbloat` (short)

1. [RFC 7567: IETF Recommendations Regarding Active Queue Management](https://www.rfc-editor.org/rfc/rfc7567), F. Baker and G. Fairhurst (eds.), 2015-07 (BCP 197, obsoletes RFC 2309). Spec, primary: yes. Why tail drop keeps queues full and what AQM fixes. Seen 2026-09-29: sections 1.2 "Active Queue Management to Manage Latency", 2 "The Need for Active Queue Management" (four drawbacks of tail drop: full queues, lock-out, bursts, synchronization), 2.3 "AQM and Buffer Size", 4.1 "Operational Deployments SHOULD Use AQM Procedures"; says RED "has not been enabled by default"; drops the RFC 2309 advice to use RED by default.
2. [RFC 8289: Controlled Delay Active Queue Management](https://www.rfc-editor.org/rfc/rfc8289), Nichols, Jacobson et al., 2018-01. Spec, primary: yes. Note already existed (rfc-8289); good/bad queue, 25-vs-20 packet standing queue example, 5 ms / 100 ms.
3. [RFC 8290: The Flow Queue CoDel Packet Scheduler and AQM Algorithm](https://www.rfc-editor.org/rfc/rfc8290), Hoeiland-Joergensen, McKenney, Taht, Gettys, Dumazet, 2018-01. Spec (Experimental), primary: yes. Seen 2026-09-29: 1024 queues by default, DRR plus CoDel per queue, new vs old flows, section 7 "shipped as part of the Linux kernel since version 3.5 (released on the 21st of July, 2012)", default qdisc in OpenWRT, Arch, Fedora as of 2018.
4. [RFC 8033: PIE](https://www.rfc-editor.org/rfc/rfc8033), Pan, Natarajan, Baker, White, 2017-02. Spec (Experimental), primary: yes. Seen 2026-09-29: abstract defines bufferbloat; section 1 on why buffers grew; QDELAY_REF 15 ms (4.2); DOCSIS 3.1 mandated a PIE variant (October 2013).
5. [BBR: Congestion-Based Congestion Control](https://web.stanford.edu/class/cs244/papers/bbr.pdf), Cardwell et al., 2016. See `congestion-control`. Loss-based control fills deep buffers; loss-based competitors take more than their share in unmanaged deep buffers.
6. [Bufferbloat.net: What can I do about bufferbloat?](https://www.bufferbloat.net/projects/bloat/wiki/What_can_I_do_about_Bufferbloat/), Bufferbloat project, undated. Wiki, primary: yes-ish (the project that made fq_codel/cake). Seen 2026-09-29: measure latency idle and under load (Waveform, Cloudflare speed tests); "latency below 15-25 msec" means under control; enable SQM (cake, fq_codel, PIE) and set shaper to measured speeds. Not used (short node already had 5 sources); good for a "measure it at home" section later.

#### `pacing` (short)

1. [BBR: Congestion-Based Congestion Control](https://web.stanford.edu/class/cs244/papers/bbr.pdf), Cardwell et al., 2016. Paper, primary: yes. Seen 2026-09-29 (re-read PDF): "BBR paces every data packet"; send() pseudocode with nextSendTime; "In Linux, sending uses the efficient FQ/pacing queuing discipline"; BDP/2 bursts give BDP/4 average queue (p. 6); B4 shallow-buffered switch losses from coincident bursts; "CUBIC (even with pacing) sends a burst".
2. [BBR Congestion Control (draft-ietf-ccwg-bbr-06)](https://www.ietf.org/archive/id/draft-ietf-ccwg-bbr-06.txt), IETF CCWG, 2026-07-06. Spec draft, primary: yes. Seen 2026-09-29: 3.1 rate vs volume mismatch; 5.4.2 slow start after idle vs "BDP-scale line-rate burst"; 5.6.2 PacingMarginPercent = 1; 5.6.3 send quantum = pacing_rate × 1 ms, clamped 2 SMSS to 64 KB.
3. [tc-fq(8)](https://man7.org/linux/man-pages/man8/tc-fq.8.html), iproute2 (FQ by Eric Dumazet), page dated 2015-09-10, man7 copy from git 2026-08-04. Man page, primary: yes. Seen 2026-09-29: per-flow pacing, SO_MAX_PACING_RATE, EDT after 4.20, non-work-conserving, pacing on by default, initial_quantum 10 MTU for IW10, maxrate.
4. [tcp: internal implementation for pacing (commit 218af599fa63)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=218af599fa635b107cfe10acf3249c4dfe5e4123), Eric Dumazet, 2017-05-16. Commit, primary: yes. Seen 2026-09-29: fallback pacing in TCP when fq isn't on the egress path; requested by BBR or SO_MAX_PACING_RATE. Version 4.13 from https://kernelnewbies.org/Linux_4.13 (lists "Internal implementation for pacing").
5. [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), kernel docs (7.3.0-rc5 build). Docs, primary: yes. Seen 2026-09-29: tcp_pacing_ss_ratio 200, tcp_pacing_ca_ratio 120, sk_pacing_rate = ratio × cwnd × mss / srtt; tcp_limit_output_bytes (TSQ, 4 MB) "reduce bufferbloat".

**Disagreements and tensions**
- **Loss as the congestion signal.** Jacobson 1988 and RFC 5681 treat loss as the signal; the BBR paper calls that choice the main cause of bufferbloat and low throughput on shallow buffers. RFC 9438 still calls CUBIC the most widely deployed standard. BBR's own paper admits loss-based flows grab more than their share when buffers exceed several BDPs.
- **BBR versions.** The 2016 paper is BBRv1; the IETF draft (-06, July 2026) specifies BBRv3, still Experimental. Mainline Linux `tcp_bbr.c` still carries the v1 description; BBRv3 for Linux is in Google's out-of-tree repo.
- **Nagle default.** RFC 9293 still says SHOULD implement Nagle; Brooker (2024) argues TCP_NODELAY should be the default. RFC 9293 Appendix A.3 notes the Nagle/delayed-ACK problem but didn't update the standard.
- **tcp_rmem default.** tcp(7) (man-pages 6.19) says 87380 bytes; the kernel doc (7.3-rc5) says 131072. The kernel doc is the newer.

**Couldn't open**
- queue.acm.org/detail.cfm?id=3022184 and cacm.acm.org (Cloudflare block page "Sorry, you have been blocked"). Used the Stanford-hosted PDF of the same ACM Queue article instead.

**Rejected**
- RFC 1122 for Nagle/delayed ACK: RFC 9293 carries the same text and is current.
- Secondary tuning blogs from search (oneuptime.com): no primary data.

**Gaps**
- No source found with a measured Nagle + delayed ACK stall on a modern Linux box; the 40 ms figure comes from the kernel constant, not a run. A lab experiment could show it.
- No primary source on which congestion control big providers use by default today beyond RFC 9438's "default in Linux, Windows and Apple".

### Names

#### `dns` (deep)

1. [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), P. Mockapetris, 1987-11. Spec, primary: yes. The design. Seen 2026-09-28: 2.4 "three major components" (name space and RRs, name servers, resolvers); 3.1 labels 0-63 octets, absolute names end in a dot; 3.6 TTL "how long a RR can be cached", lower it before a planned change, 1987 advice "on the order of days"; 3.6.2 no other data at a CNAME; 4.3.1 recursive vs non-recursive, RD/RA, "All name servers must implement non-recursive queries"; 4.3.4 optional negative caching; 5.3.1 stub resolvers; 5.3.3 SBELT/root servers. Note: `rfc-1034`.
2. [RFC 1035: Domain Names, Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035), P. Mockapetris, 1987-11. Spec, primary: yes. Seen 2026-09-28: 2.3.4 size limits (63, 255, UDP 512); 3.2.2 type numbers; 4.1 five-section message; 4.1.1 header ID, AA, TC, RD, RA; 4.2 port 53 UDP and TCP; 4.2.1 512-byte cap, TC bit, retransmit 2-5 s; 4.2.2 two-byte length prefix over TCP. Note: `rfc-1035`.
3. [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499), P. Hoffman, K. Fujiwara, 2024-03 (BCP 219, obsoletes 8499). Spec, primary: yes. Seen 2026-09-28: definitions of stub resolver, iterative/recursive mode, recursive resolver ("expected to cache"), priming/root hints, authoritative and authoritative-only server, referral (AA=0), forwarder, open resolver, TLD ("nothing special"), delegation, glue, NXDOMAIN/NODATA, split DNS/views ("not a standardized part of the DNS"), "full resolver" has no consensus meaning. Note: `rfc-9499`.
4. [RFC 7766: DNS Transport over TCP - Implementation Requirements](https://www.rfc-editor.org/rfc/rfc7766), J. Dickinson et al., 2016-03. Spec, primary: yes. Seen 2026-09-28: 1 most DNS over UDP, DNSSEC/IPv6 raised sizes, TCP resists spoofing; RFC 1123's SHOULD read as optional; 5 "All general-purpose DNS implementations MUST support both UDP and TCP transport", stubs included. Note: `rfc-7766`.
5. [DNS Flag Day 2020](https://www.dnsflagday.net/2020/), DNS vendors and operators, 2020 (redirects to dns-violations.github.io). Docs, primary: yes. Seen 2026-09-28: date 2020-10-01, IP fragmentation unreliable and spoofable, default EDNS buffer 1232 = 1280 IPv6 MTU minus 48, TCP fallback required, some firewalls block TCP/53. Note: `dnsflagday-2020`.
6. [root-servers.org](https://root-servers.org/), root server operators. Docs, primary: yes. Seen 2026-09-28: "The 13 root name servers are operated by 12 independent organisations."; live count "As of 2026-09-28T17:45:42Z ... 2045 operational instances". Note: `root-servers-org`.
7. [resolv.conf(5)](https://man7.org/linux/man-pages/man5/resolv.conf.5.html), man-pages 6.19 (page dated 2026-08-22). Docs, primary: yes. Seen 2026-09-28: MAXNS 3, try-in-order retry loop, search/ndots (default 1), timeout default 5 s (cap 30), attempts default 2 (cap 5), parallel A/AAAA since glibc 2.9, use-vc forces TCP, edns0. Nothing about caching. Note: `man7-resolv-conf`.
8. [What happens when you update your DNS?](https://jvns.ca/blog/how-updating-dns-works/), Julia Evans, 2020-06-17. Blog, primary: no (secondary, but she ran the dig commands). Seen 2026-09-28: root -> .com -> github.com walk with dig and real IPs, authority/additional sections, `dig +trace`, TTL demo against 8.8.8.8 (299 s, 144 s), ISP resolvers ignoring TTLs, NS TTL 172800 s, JVM caching forever. Note: `evans-updating-dns-2020`. Also serves `dns-caching`.
9. [IANA Root Servers](https://www.iana.org/domains/root/servers), IANA. Docs, primary: yes. Seen 2026-09-28: "a network of hundreds of servers in many countries" configured "as 13 named authorities", the a-m.root-servers.net hostnames and operators. Not cited (root-servers.org covers the same facts with a count); mentioned in that note.
10. [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891), J. Damas, M. Graff, P. Vixie, 2013-04. Spec, primary: yes. Seen 2026-09-28: 6.2.3 requestor's payload size in the OPT CLASS field, values under 512 treated as 512; 6.2.5 suggests 4096 as a starting point, fallback 1280-1410, then 512. Not cited (kept dns at 8 sources); worth a note if EDNS gets more than a paragraph.

#### `dns-records` (short)

1. See `dns` #2 (RFC 1035): 3.2.1 RR layout, 3.2.2 type numbers, 3.3.1 CNAME, 3.3.9 MX preference, 3.3.11 NS, 3.3.13 SOA fields, 3.3.14 TXT, 3.5 IN-ADDR.ARPA.
2. [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181), R. Elz, R. Bush, 1997-07. Spec, primary: yes. Seen 2026-09-28: 5.2 one TTL per RRset; 10.1 an alias has one canonical name and no other data (DNSSEC RRs aside); 10.2 multiple PTRs fine; 10.3 MX/NS values must not be aliases. Note: `rfc-2181`.
3. [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596), S. Thomson et al., 2003-10. Spec, primary: yes. Seen 2026-09-28: AAAA type 28, one 128-bit address in network byte order, IP6.ARPA. Note: `rfc-3596`.
4. [RFC 2782: DNS SRV](https://www.rfc-editor.org/rfc/rfc2782), A. Gulbrandsen, P. Vixie, L. Esibov, 2000-02. Spec, primary: yes. Seen 2026-09-28: type 33, `_Service._Proto.Name`, priority (lowest first), weight, port, target must not be an alias, "." means no service, use only when the protocol spec says so. Note: `rfc-2782`.
5. [RFC 9460: SVCB and HTTPS Resource Records](https://www.rfc-editor.org/rfc/rfc9460), B. Schwartz, M. Bishop, E. Nygren, 2023-11. Spec, primary: yes. Seen 2026-09-28: abstract "enable aliasing of apex domains, which is not possible with CNAME"; 1 CNAME can't carry configuration; 1.1 goals. Note: `rfc-9460`.
6. [CNAME flattening](https://developers.cloudflare.com/dns/cname-flattening/), Cloudflare docs (modified 2026-06-24). Docs, primary: yes (for Cloudflare's behavior). Seen 2026-09-28: flattening lets a CNAME be used at the zone apex by returning the final IP instead of the CNAME; dangling CNAME returns NODATA. Not cited; a vendor-specific workaround. Candidate if the article names the workaround.

#### `dns-caching` (short)

1. See `dns` #1 (RFC 1034): 3.6 TTL meaning and "lower it before a change"; 4.3.1 concentrating the cache; 6.2.1 cached TTLs age.
2. [RFC 2308: Negative Caching of DNS Queries (DNS NCACHE)](https://www.rfc-editor.org/rfc/rfc2308), M. Andrews, 1998-03. Spec, primary: yes. Seen 2026-09-28: abstract "should no longer be seen as an optional part"; 2.2 NODATA = NOERROR + empty answer; 3 SOA in authority, negative TTL = min(SOA TTL, MINIMUM); 4 MINIMUM's three meanings, $TTL; 5 NXDOMAIN keyed by name, NODATA by name+type; 7.1 SERVFAIL cache at most 5 minutes; 7.2 dead server after 120 s. Note: `rfc-2308`.
3. [RFC 8767: Serving Stale Data to Improve DNS Resiliency](https://www.rfc-editor.org/rfc/rfc8767), D. Lawrence, W. Kumari, P. Sood, 2020-03. Spec, primary: yes. Seen 2026-09-28: 4 new TTL definition, 7-day cap (604,800 s), stale TTL 30 s, only NOERROR/NXDOMAIN with AA refresh; 3 BIND, Knot, OpenDNS, Unbound already serve stale; 5 client response timer 1.8 s. Note: `rfc-8767`.
4. See `dns` #8 (Julia Evans 2020).
5. [systemd-resolved.service(8)](https://man7.org/linux/man-pages/man8/systemd-resolved.service.8.html), systemd 262~devel (upstream as of 2026-08-03). Docs, primary: yes. Seen 2026-09-28: "caching and validating DNS/DNSSEC stub resolver", stub on 127.0.0.53/54, nss-resolve, no ndots (names with a dot are FQDNs), caches /etc/hosts (highest priority), flushes on network change, `resolvectl flush-caches`. Note: `man7-systemd-resolved`.

**Disagreements and tensions**
- **What a TTL means.** RFC 1034/1035 (1987): how long a record may be cached before it "should be discarded". RFC 8767 (2020): how long before the source "MUST again be consulted", and a record may be used past it if refresh fails. Julia Evans (2020): some ISP resolvers keep records past the TTL anyway. So "the TTL is a hard expiry" is wrong in practice twice over.
- **How big a UDP answer can be.** RFC 1035: 512 bytes. RFC 6891 (2013): start at 4096, fall back to 1280-1410. DNS Flag Day 2020: default 1232. The advice got smaller, not bigger, because of fragmentation.
- **Is TCP optional?** RFC 1123's SHOULD was read as optional by some implementers; RFC 7766 (2016) made it MUST for everyone.
- **Search lists.** glibc (resolv.conf) tries short names with search domains using ndots; systemd-resolved ignores ndots and treats any dotted name as complete. Same name, different queries on different hosts.
- **Words.** "Resolver", "recursive server", "full resolver", "forwarder" and "lame delegation" are used loosely; RFC 9499 says so and discourages some terms.

**Couldn't open**
- Cloudflare Learning Center pages (https://www.cloudflare.com/learning/dns/what-is-dns/, .../dns-records/, .../dns-records/dns-cname-record/ and others): HTTP 403 to both WebFetch and curl on 2026-09-28. Not cited.

**Rejected**
- RFC 8020 (NXDOMAIN means nothing underneath) and RFC 8198 (aggressive use of DNSSEC-validated cache): downloaded 2026-09-28 but not read; too detailed for a short caching node. Revisit if `dns-caching` grows.
- RFC 9156 (QNAME minimisation, 2021-11): abstract and example tables seen (a root server no longer sees the full name). A privacy topic; left out to keep `dns` one concept.
- RFC 7858 (DNS over TLS, 2016-05, TCP port 853) and RFC 8484 (DNS over HTTPS, 2018-10): abstracts seen. Better in phase 3 next to TLS and HTTP.

**Gaps**
- No measured numbers for DNS lookup latency (cold vs warm cache). A small experiment (dig timings against a local stub, a public resolver, and +trace) would give `dns` and `dns-caching` real numbers. Not run.
- No primary source for how common TTL-ignoring resolvers are; only Julia Evans's anecdote and estimate.
- Nothing opened on glibc's own caching behavior (resolv.conf(5) is silent), nor on the JVM's DNS cache settings (Julia Evans links an AWS doc; not opened).
- DNSSEC isn't covered anywhere in phase 2.

### Added 2026-09-29: retransmission (deep), keepalive, bufferbloat, pacing

**Disagreements and tensions**
- Minimum RTO: RFC 6298 SHOULD 1 s; Linux 200 ms, and the kernel doc now calls ≤ 200 ms the recommended practice.
- Counting vs time: RFC 8985 replaces DupAck counting with a time window, at the cost of per-packet send times; it names ultra-low-RTT data centers (RTT below the clock granularity) as a case where the SACK-scoreboard approach (RFC 6675) needs less state.
- RACK accepts spurious retransmissions on short flows (reordering window zero or small) to recover faster; F-RTO/Eifel/DSACK exist to detect spurious retransmissions after the fact.
- Keepalive vs user timeout: Cloudflare's post says both "set TCP_USER_TIMEOUT to KEEPIDLE + KEEPINTVL * KEEPCNT" and "slightly lower than" that sum. RFC 5482 says with the UTO option the keep-alive timer must be larger than the user timeout. gRPC sets TCP_USER_TIMEOUT to its PING timeout.
- RFC 1122 says keepalives are "not universally accepted" and a failed probe must not mean death; every modern system that sits behind NAT or LBs needs them anyway.

**Couldn't open**
None.

**Rejected**
- RFC 5482 for tcp-keepalive (see above). socket(7) (duplicate of tcp(7)).

**Gaps**
- No source opened on what Linux does with the UTO option on the wire.
- No source on common cloud NAT gateway idle timeouts other than AWS NLB. The article uses NLB's 350 s as one example, dated.
- No measured number for how often RTOs are spurious on real paths.

**Disagreements and tensions**
- Endpoint fix (BBR) vs network fix (AQM). BBR keeps its own queue low, but loss-based flows in an unmanaged deep buffer still fill it (Cardwell 2016); RFC 7567 says endpoints alone can't control enough.
- Which AQM: RFC 7567 (BCP) recommends AQM but no algorithm; CoDel, FQ-CoDel and PIE are all Experimental.
- Pacing vs CPU: offload batching saves CPU but creates bursts (draft 5.6.3).

**Couldn't open**
- Gettys and Nichols, "Bufferbloat: Dark Buffers in the Internet" at queue.acm.org/detail.cfm?id=2071893 and cacm.acm.org/research/bufferbloat/: both HTTP 403 on 2026-09-29.
- socket(7) on man7.org does not document SO_MAX_PACING_RATE (checked 2026-09-29); used tc-fq(8) instead.

**Rejected**
- patchwork.ozlabs.org/patch/762784 (v1 of the internal pacing patch, "Superseded"): used the merged commit instead.
- Wikipedia "TCP pacing", martinuke0 blog on BBR, oneuptime qdisc blog: secondary, not needed.

**Gaps**
- No Google/Cloudflare/Fastly engineering post on pacing found in the time spent; the kernel commit and BBR paper stand in.
- Which distributions default to fq_codel or fq today (2026) wasn't checked; RFC 8290's list is from 2018. systemd's default qdisc setting not checked.
- Linux 4.13 and 4.20 release years not from a source (commit date 2017-05-16 is).

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
