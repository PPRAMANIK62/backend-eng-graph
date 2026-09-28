# The lab: what gets built

This is the backend version of ai-eng-graph's
`GUIDE.md`: what gets built in each phase, how it's checked, and when the
phase is done.

The lab is **one system built from its parts**. Every phase builds one
component from scratch in `lab/`, and later phases run on earlier ones.
The storage engine uses the phase 1 log. Replication ships the engine's
log. Raft runs the replicated store. The phase 17 capstone, a durable
execution engine, runs on all of it, behind my own proxy, inside my own
container runtime, traced end to end.

Two things make this worth building instead of another CRUD app:

- **Every component is proven, not just demoed.** Each has a harness
  that attacks it: crash injection, fuzzing, history checking, network
  faults. A component isn't done until it survives its harness.
- **Every component is measured against the real thing.** My proxy
  against nginx, my engine against RocksDB and SQLite, my broker against
  Kafka, my Raft against etcd. Same machine, setup written down. Losing
  is fine. Not knowing why isn't.

## How each phase runs

Every phase goes through the same steps. The details are in `CLAUDE.md`.

1. Start the phase.
2. Check its part of `tentative-shape.md`.
3. Suggest changes, based on what the written nodes already cover and what
   the build needs.
4. Check the sources in `content/sources/_candidates.md` for the phase.
5. Build the planned nodes, with links.
6. Write them.
7. Build the phase's piece of the lab, harness first, then measure it.

The phase is done when its "done when" line below is true, with evidence.

## Rules for every build

- **Write what "correct" and "good" mean first.** Each build below has a
  harness and targets. Before building, turn them into checks and numbers
  I can measure. The targets are starting points, not promises; they get
  fixed in a decision record once there's a baseline.
- **Harness first.** The harness is built before the feature, or with it.
  It has to catch a bug planted on purpose before I trust it to say the
  real code is fine.
- **Reproducible or it didn't happen.** Every benchmark and harness run
  is a script in `lab/<component>/`, and its write-up in
  `content/experiments/` names the machine, kernel, filesystem, versions
  and the exact command. Raw numbers are kept.
- **Percentiles, not averages.** Latency is reported as p50, p99 and
  p99.9, from a load generator that avoids coordinated omission (built in
  phase 9; before that, say which tool was used and its limits).
- **Never claim a run that didn't happen.** No estimated numbers written
  as measured ones.
- **Real choices get a decision record.** Language, file formats,
  algorithms, libraries: `content/decisions/`, with what was measured.
- **Write up the best bug.** Each build ends with at least one bug traced
  from symptom to cause, across layers if that's where it went. These
  become interview stories.
- **Scope honestly.** Each build lists what it leaves out. A small thing
  that's correct beats a big thing that isn't.

## Layout

```
lab/
  <component>/        one directory per build, named below
    README.md         what it is, what it leaves out, how to run it
    bench/            benchmark scripts and their configs
    harness/          the correctness harness, if it's specific to this build
```

Shared tools (the crash harness, the fault injector, the history checker,
the load generator) get their own directories because later builds reuse
them. The repo layout (one Go module or several) is part of decision 0001.

The tools named below (LazyFS, dm-log-writes, netem, toxiproxy, Porcupine,
Elle, YCSB, memtier, Pebble and the rest) are the plan when this was written.
Check each one still exists and fits when its phase starts.

## Phase 1: the log and the crash harness

**What gets built**
- `lab/crashtest`: a harness that runs a program, cuts the power at a
  random point (LazyFS or dm-log-writes, decided in a record), remounts,
  and runs a checker on what's left. Every storage build after this uses it.
- `lab/wal`: an append-only log of checksummed, length-prefixed records.
  Append, sync, read back, recover after a crash by dropping torn records.
- `lab/fsyncbench`: what `fsync`, `fdatasync`, `O_DSYNC` and
  `O_DIRECT` cost on my SSD, by write size.

**Harness:** the checker says every record acknowledged as durable is
present, and no corrupted record is accepted.

**Compared with:** the fsync latencies against the SSD's spec sheet, and
the log's recovery rules against SQLite's WAL documentation.

**Decisions to record:** Go, chosen over Rust (0001, with
repo layout), which crash simulator (0002), record format (0003).

**On this machine:** one WD PC SN740 512 GB NVMe
SSD, root on btrfs over LUKS (dm-crypt), kernel 7.1.9. There's no spare
disk, so crash tests and the ext4 runs use loop devices backed by files.
`dmsetup`, `losetup` and `mkfs.ext4` are installed; LazyFS, `mkfs.xfs`,
`fio` and `strace` aren't, so decision 0002 has to weigh installing
LazyFS against using dm-log-writes with what's here. fsyncbench runs
on the real btrfs-over-LUKS root and on ext4 in a loop device, and says
which layers each number went through. The SN740 is an OEM drive; if
WD publishes no latency figures for it, the spec-sheet comparison says
so.

**Done when:** the harness catches planted bugs (skipping the fsync,
skipping the directory fsync after creating the file, trusting a length
without a checksum), the real log survives 1,000 crash runs, and the fsync
benchmark is published as an experiment.

## Phase 2: a TCP stack and a DNS resolver

**What gets built**
- `lab/tcp`: TCP in user space over a TUN device. The handshake, sequence
  numbers, retransmission with a timer, the receive window, and teardown.
  Congestion control (Reno first, then CUBIC) if time allows.
- `lab/resolver`: a recursive DNS resolver that starts at the root
  servers, follows referrals, and caches by TTL.

**Harness:** `tc netem` adds loss, reordering, duplication and delay to
the TUN link. Files are sent through the stack and checked by hash. The
resolver's answers are compared with a real resolver's for the same list
of names.

**Compared with:** Linux's own TCP (throughput and transfer time at 0%,
1% and 5% loss), and a production resolver (answers, and cold vs warm
lookup time).

**Decisions to record:** retransmission timeout rules, how far to go
with congestion control.

**Done when:** `curl` fetches a page over my stack from a real server at
5% loss with the right hash; the resolver agrees with the reference on at
least 1,000 names; both comparisons are published.

## Phase 3: an L7 proxy and load balancer

**What gets built**
- `lab/proxy`: a reverse proxy with its own HTTP/1.1 parser, TLS
  termination, keep-alive connection pools to backends, round robin,
  least connections and power-of-two-choices balancing, active and
  passive health checks, retries on idempotent requests, and config
  reload without dropping connections. HTTP/2 to clients if time allows.

**Harness:** differential fuzzing of the parser against Go's `net/http`
and a second reference, with known request smuggling cases as seeds.
Backends that get killed, slowed down and made to return errors during
load runs.

**Compared with:** nginx and HAProxy or Envoy, same backends, same
machine: throughput, p50/p99/p99.9, and memory per connection. The three
balancing algorithms compared with one slow backend in the pool.

**Decisions to record:** parser design, the balancing algorithm used by
default, retry rules.

**Done when:** a fuzzing run of at least 24 hours finds no disagreement
left unexplained; the proxy survives backend kills with the error rate
recorded; the comparison with nginx and the algorithm comparison are
published.

## Phase 4: one server, four I/O models

**What gets built**
- `lab/ioserver`: one server speaking a small subset of the Redis
  protocol, written four ways: a goroutine per connection, a fixed worker
  pool, an epoll event loop on raw system calls, and io_uring.

**Harness:** Go's race detector on every test run, plus a client that
checks every reply while load is running.

**Compared with:** each other, and Redis as a reference point. From 1k to
100k connections: throughput, p99, memory per connection, CPU use and
context switches.

**Decisions to record:** the io_uring library or raw bindings.

**Done when:** the four-way comparison is published with an explanation
for each difference, backed by a profile or a count of system calls and
context switches.

## Phase 5: a webhook delivery service

**What gets built**
- `lab/webhooks`: an ingest API that takes events with idempotency keys,
  stores them in the phase 1 log, and delivers them to subscriber
  endpoints. HMAC signatures, retries with exponential backoff and
  jitter, ordering per endpoint, a per-endpoint rate limit, a dead-letter
  queue after the last retry, and replay from it.

**Harness:** an endpoint simulator that fails, times out, answers slowly
and goes away for hours. The service gets killed with `kill -9` at random
during load. A checker reads the ingest log and every endpoint's received
log and verifies the written guarantees: every event delivered at least
once or dead-lettered, never out of order per endpoint, duplicates
detectable by ID.

**Compared with:** the delivery guarantees that established webhook
providers document, written down side by side with mine.

**Decisions to record:** ordering vs throughput per endpoint, retry
schedule, rate limiting algorithm.

**Done when:** the guarantees are written down and the checker passes
across 500 crash runs; delivery latency percentiles are published under
healthy and failing endpoints.

## Phase 6: an online schema change tool for Postgres

**What gets built**
- `lab/migrate`: change a large Postgres table's schema while the app
  keeps writing. A shadow table, change capture (triggers first, logical
  replication as a comparison), batched backfill, and a cutover with a
  lock timeout and retry.
- Planner experiments along the way: the same queries with and without
  each index type, stale vs fresh statistics, N+1 vs one join, all with
  EXPLAIN ANALYZE output kept.

**Harness:** a write load runs during every migration. A checker compares
row checksums between the old and new table at cutover and after.

**Compared with:** a plain `ALTER TABLE` on the same table (lock time,
p99 of the app's queries), and an existing tool such as pgroll or
pg-osc.

**Decisions to record:** triggers vs logical replication for capture,
batch size, cutover strategy.

**Done when:** a 10-million-row table is migrated under write load with
no lost or changed rows, and the p99 impact compared with the plain
`ALTER TABLE` is published.

## Phase 7: an LSM storage engine

**What gets built**
- `lab/engine`: a key-value engine with the phase 1 log as its WAL, a
  skip-list memtable, SSTables with block indexes and bloom filters,
  leveled compaction, and crash recovery. A B+tree variant if time
  allows, for the comparison.

**Harness:** the phase 1 crash harness, plus a randomized test that runs
the same operations against the engine and an in-memory map and compares
them.

**Compared with:** Pebble or RocksDB, and SQLite, on YCSB workloads A to
F: throughput, p99, and measured read, write and space amplification.

**Decisions to record:** SSTable format, compaction strategy, bloom
filter bits per key.

**Done when:** the engine survives 1,000 crash runs and the randomized
test; the YCSB comparison and amplification numbers are published.

## Phase 8: transactions in the engine, and a history checker

**What gets built**
- `lab/histcheck`: a history checker in the spirit of Jepsen's Elle. Run
  concurrent transactions with a list-append workload, record the
  history, and find anomalies by looking for cycles in the dependency
  graph.
- `lab/engine`: MVCC with snapshot isolation, then serializable snapshot
  isolation.

**Harness:** the checker, run against my engine and against real
Postgres at each isolation level.

**Compared with:** Postgres. Each anomaly in the graph (dirty read,
non-repeatable read, phantom, lost update, write skew) is reproduced on
Postgres at the level that allows it, and shown to be prevented at the
level that doesn't.

**Decisions to record:** version storage layout, how garbage versions are
cleaned up, conflict detection for SSI.

**Done when:** every anomaly node has a real history from Postgres
attached; my engine passes the checker at serializable on 10,000 runs;
the throughput cost of serializable vs snapshot isolation is published.

## Phase 9: a cache server and a load generator

**What gets built**
- `lab/loadgen`: an open-model load generator that corrects for
  coordinated omission and records full latency histograms. Every build
  after this uses it.
- `lab/cache`: a cache server compatible with a subset of the Redis
  protocol, with pluggable eviction: LRU, W-TinyLFU and S3-FIFO.
- Profiling of both with pprof, flame graphs and eBPF tools.

**Harness:** the protocol checked against real Redis with the same
command sequences; eviction policies checked against a slow reference
implementation on small traces.

**Compared with:** Redis on throughput and p99 with memtier or
redis-benchmark; the eviction policies against each other on public
cache traces, by hit ratio at several cache sizes.

**Decisions to record:** the default eviction policy, histogram format.

**Done when:** my load generator and a naive closed-loop one are shown
giving different p99s for the same server, with the reason; the hit
ratio curves and the Redis comparison are published.

## Phase 10: a log broker and change data capture

**What gets built**
- `lab/broker`: topics split into partitions, stored as segment files
  with an offset index, consumer groups with committed offsets,
  retention by time and by key (log compaction), and producers made
  idempotent with sequence numbers.
- `lab/cdc`: Postgres logical replication into the broker, and an outbox
  relay, so a database write and its event can't drift apart.

**Harness:** the crash harness on the broker. A checker that reads what
consumers saw and verifies no gaps and no duplicates per partition with
idempotent producers, across broker restarts.

**Compared with:** Kafka or Redpanda on the same machine: throughput and
end-to-end latency percentiles.

**Decisions to record:** segment and index format, offset storage,
the outbox relay's polling vs logical replication.

**Done when:** the no-gaps, no-duplicates checker passes across 500
crash runs; CDC events match the database's changes in a checked run;
the comparison with Kafka is published.

## Phase 11: replication and fault injection

**What gets built**
- `lab/faults`: a fault injector that partitions nodes, drops and delays
  packets, pauses and kills processes, and skews clocks, on a local
  cluster of processes or containers.
- `lab/replica`: the phase 7 engine replicated. Leader-follower with log
  shipping (sync and async), then a leaderless mode with quorums and read
  repair.

**Harness:** Porcupine checks every recorded history for linearizability
while faults are running.

**Compared with:** the claims each mode makes. The expected results are
written down before each run: which modes should pass and which should
fail. Then the runs show what really happens.

**Decisions to record:** the replication protocol details, failover
rules, quorum settings.

**Done when:** for each mode, published runs show whether it stayed
linearizable under faults, with the failing histories for any mode that
didn't.

## Phase 12: Raft

**What gets built**
- `lab/raft`: Raft from scratch: elections, log replication, snapshots,
  ReadIndex reads, and membership changes if time allows.
- The replicated engine rebuilt on Raft as a replicated state machine.

**Harness:** tests modeled on the MIT 6.5840 Raft lab, a deterministic
simulation of the cluster with a seeded random scheduler for network and
node faults, and Porcupine on the full key-value store under the phase 11
fault injector.

**Compared with:** etcd on the same machine: write throughput and
latency percentiles for a three-node and a five-node cluster.

**Decisions to record:** timeout ranges, batching, snapshot format.

**Done when:** the store passes Porcupine under faults on 1,000 seeded
simulation runs and on real fault-injection runs; the etcd comparison is
published.

## Phase 13: breaking the system on purpose

**What gets built**
- Resilience in the proxy and services: deadline propagation, retry
  budgets, circuit breakers, load shedding and admission control.
- SLOs for the system so far, with error budgets.
- `lab/chaos`: repeatable experiments. A retry storm that drives the
  system into a metastable failure, then the same storm with the fixes.
  Backups and a restore drill.

**Harness:** each experiment has a written hypothesis, a steady-state
measurement, and a stop condition.

**Compared with:** the system without the fixes. Goodput vs offered load,
past overload and back.

**Decisions to record:** shedding policy, retry budget size, SLO targets.

**Done when:** a metastable failure is reproduced on purpose and shown to
recover with the fixes (goodput curves before and after); a restore drill
has a measured RPO and RTO; one experiment is written up as a blameless
postmortem.

## Phase 14: a container runtime, and running the system on it

**What gets built**
- `lab/runtime`: a minimal container runtime with namespaces, cgroups v2,
  overlayfs and OCI image unpacking.
- The system's services running in it, instrumented with OpenTelemetry:
  traces through the proxy into every service, metrics with histograms,
  structured logs, and burn-rate alerts on the phase 13 SLOs.
- A canary deploy through my proxy, with automatic rollback on SLO burn.

**Harness:** isolation checks (a process in the container can't see host
processes or go past its memory limit), and a bad canary that must get
rolled back.

**Compared with:** runc or crun on container start time and overhead.

**Decisions to record:** the metrics and tracing backend, sampling rate,
canary steps.

**Done when:** one request can be followed in a trace from the proxy to
the storage engine; the bad canary gets rolled back by the alert without
a hand on it; the runtime comparison is published.

## Phase 15: an authorization service

**What gets built**
- `lab/authz`: a Zanzibar-style service: relation tuples, a schema of
  relations, check and expand APIs, and consistency tokens (zookies)
  from the store's snapshot timestamps.
- Authentication for the system: sessions and passkeys.
- A threat model of the whole system, and attack tests (BOLA, SSRF,
  request smuggling through my proxy).

**Harness:** a randomized test comparing check results with a brute-force
evaluator; a test for the new-enemy problem that must fail without
zookies and pass with them.

**Compared with:** SpiceDB or OpenFGA on the same schema and data: check
latency percentiles.

**Decisions to record:** tuple storage, caching of check results, session
vs token design.

**Done when:** the randomized and new-enemy tests pass; the threat model
and the attack results are published; the comparison is published.

## Phase 16: a stream processor

**What gets built**
- `lab/stream`: a stream processor that reads from the phase 10 broker,
  groups events into event-time windows, tracks watermarks, handles late
  data, checkpoints its state, and writes results as Parquet to object
  storage (a local S3-compatible store).

**Harness:** kill the processor during a run, restore from the
checkpoint, and check the output is the same as a clean run. DuckDB
recomputes the same aggregates in batch as the reference answer.

**Compared with:** the batch recomputation for correctness, and Flink or
another stream processor on throughput if it fits on the machine.

**Decisions to record:** checkpoint design, watermark strategy, output
commit protocol.

**Done when:** outputs after crash and restore match the batch answer on
every checked run; the late-data policy is shown working on a crafted
input.

## Phase 17: a durable execution engine

**What gets built**
- `lab/durable`: workflows written as ordinary code that survive crashes.
  Every step's result is recorded in the broker and the Raft store;
  after a crash the workflow replays its history and carries on.
  Activities with retries and idempotency keys, durable timers, task
  queues for workers.
- It runs on the rest of the lab: behind the proxy, inside the container
  runtime, with authorization, traced end to end.
- Two system design write-ups on real problems, using the lab's own
  numbers for the estimates.

**Harness:** kill workers and nodes at random, then verify every workflow
finished and every activity's effect was applied exactly once. A
determinism checker flags workflow code that makes different choices on
replay.

**Compared with:** Temporal's dev server running the same workflows:
latency per step and throughput.

**Decisions to record:** history format, how timers are stored, how
workers poll.

**Done when:** the kill test passes on 500 runs; the Temporal comparison
is published; the system can be run from the README by someone else.
