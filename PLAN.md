# The plan

The skills list below was checked against real backend job postings
(listed under "Where the skills come
from").

## Why I'm doing this

I want to be a strong backend engineer, the kind who can say why a system
is fast or slow, where it loses data, and what happens when a machine dies.
I'm a full-stack engineer. I've built plenty of HTTP servers and CRUD APIs.
What I haven't done is learn what sits underneath them: the kernel, the
network, the storage engine, the replication protocol.

Three things come out of this project:

1. **A learning resource.** Every concept gets a research article built
   from the best published engineering writing: how it really works, where
   the sources disagree, with citations. I learn by reviewing the articles.
2. **Things I built from scratch, measured.** Each phase builds one real
   component: a TCP stack, a proxy, a storage engine, a broker, Raft. Each
   comes with a harness that proves it's correct under failure, and numbers
   against the production system it imitates. What gets built is in
   `LAB.md`.
3. **Stories for interviews.** Every build choice and every experiment is
   written down with the evidence. "My LSM engine lost acknowledged writes
   under power loss until I fsynced the directory after the rename; here's
   the harness that caught it" is the kind of answer I want to have.

Books are linear, but knowledge is a graph. The site is a graph of full
articles, the same metro map as ai-eng-graph. Every node is a real research
article, not a one-line glossary entry.

## Backend only

This folder is backend and distributed systems. AI engineering lives in
`ai-eng-graph`, not here.

A backend engineer owns the data, the services that serve it, and the
systems those run on. The job overlaps with platform engineering, SRE and
data engineering, and this project goes into each of those as far as a
backend engineer needs to. Frontend, mobile and ML are out of scope.
Framework-specific knowledge is out of scope too: frameworks change, and
the concepts under them don't.

## Where the skills come from

Postings opened:

- **Stripe, Backend Engineer, Core Technology**
  (stripe.com/jobs/listing/backend-engineer-core-technology/6042172).
  Asks for "hands-on experience contributing to or building large-scale
  distributed systems", code in Go, Java or C/C++, optimizing performance
  across distributed system components, and debugging "production issues
  across services and several levels of the stack".
- **Cloudflare, Senior Software Engineer, Storage Infrastructure**
  (builtinseattle.com/job/senior-software-engineer-storage-infrastructure/8656551).
  Asks for distributed systems concepts ("consistency, consensus, data
  replication, fault tolerance, and partition tolerance"), storage
  fundamentals (block devices, filesystems, SSDs), high-throughput and
  low-latency systems, benchmarking hardware, observability and runbooks,
  infrastructure as code, Rust, Go or Python, and explaining technical
  decisions clearly.
- **Reddit, Staff Software Engineer, Ingestion Platform**
  (job-boards.greenhouse.io/reddit/jobs/8205402). Asks for high-throughput,
  fault-tolerant data pipelines, Kafka, S3, Iceberg and Flink, API and
  platform design, Kubernetes, observability, and Go, Python, Java or
  Scala.

These are senior and staff roles at infrastructure-heavy companies, on
purpose: they show where the bar is. Search results for other postings
(Grafana Labs, Supabase, Temporal) mentioned Postgres, Kafka, Kubernetes,
observability and on-call, but I didn't open those pages, so they're not
used here. Re-check this list against a fresh batch of postings before
phase 9.

## What a backend engineer job asks for

1. **How the machine runs your code.** Processes, threads, virtual memory,
   the page cache, system calls, filesystems, SSDs, and what `fsync`
   really promises.
2. **Networking.** IP, TCP and UDP in depth, DNS, TLS, HTTP/1.1 to
   HTTP/3, proxies and load balancing.
3. **Concurrency and fast servers.** Races, locks and memory models, I/O
   models from threads to io_uring, backpressure, high throughput and low
   latency.
4. **API design and contracts.** REST, gRPC, GraphQL, idempotency,
   retries, schema evolution, rate limiting, webhooks.
5. **Relational databases, used well.** SQL, modeling, indexes, the query
   planner, migrations without downtime. Postgres in depth.
6. **Database internals.** Storage engines (B+trees, LSM trees, the WAL,
   crash recovery) and transactions (isolation levels, anomalies, locking,
   MVCC).
7. **Caching and performance engineering.** Cache patterns and eviction,
   Redis, profiling, eBPF, load testing, tail latency, queueing theory.
8. **Messaging and pipelines.** Queues and logs, Kafka, delivery
   guarantees, the outbox pattern, change data capture, background jobs.
9. **Distributed systems.** Replication, partitioning, consistency models,
   CAP, clocks, fault injection.
10. **Consensus and coordination.** Failure detection, Raft, Paxos,
    leases and fencing, distributed locks, two-phase commit, sagas.
11. **Reliability.** SLOs, timeouts, retry budgets, circuit breakers,
    load shedding, metastable failures, incidents, on-call, disaster
    recovery.
12. **Operating what you build.** Containers from the kernel up,
    Kubernetes, infrastructure as code, deploy strategies, logs, metrics,
    traces, alerting.
13. **Security.** Authentication (sessions, JWT, OAuth2, passkeys),
    authorization models, multi-tenancy, the OWASP API Top 10.
14. **Data systems.** OLTP vs OLAP, columnar storage, object storage and
    table formats, batch and stream processing.
15. **System design, and explaining it.** Putting the parts together
    under real constraints, and writing down why.

Across all of them: **debugging across layers.** Every build has at least
one bug worth writing up, traced from the symptom down to the layer where
it really lived.

## Rules for every phase

- **One loop per phase.** Plan the phase's nodes, write them, then build
  the phase's piece of the lab. The steps are in `CLAUDE.md`.
- **Read before building.** I'm new to most of this. The articles for a
  phase come before its build, so I understand what I'm building.
- **Harness before feature.** Each build's correctness harness (crash
  injection, fuzzing, history checking, fault injection) is built first,
  or at the same time. A component isn't done until the harness passes.
- **Measure against the real thing.** Every build is compared with the
  production system it imitates, on the same machine, with the setup
  written down. Losing to RocksDB by 5× is a fine result if I can explain
  why.
- **Decide with evidence.** Every build choice with real alternatives gets
  a decision record in `content/decisions/`. Every measurement gets an
  experiment write-up in `content/experiments/`.
- **Articles about what I built.** The concepts a phase's build uses get
  articles in that phase. The lab explains the concepts, and the concepts
  explain the lab.

## The phases

Seventeen phases, each on one subject. Each has concepts to write about,
listed roughly here and node by node in `tentative-shape.md`, and a build
in `LAB.md` with its own "done when" line.

### Phase 1: The machine under the backend
Skill 1.

Concepts, roughly:
- what a backend engineer owns, and latency numbers every design sits on
- processes, threads, system calls, the scheduler, context switches,
  signals
- the memory hierarchy, CPU caches, virtual memory, page faults, the heap
  and the stack, garbage collection
- file descriptors, block devices, filesystems, SSD internals
- the page cache, mmap vs direct I/O, fsync, torn writes, crash
  consistency, atomic rename, checksums, binary encoding
- the append-only log and crash testing, because the phase 1 build is
  both

### Phase 2: Networking I, packets to transport
Skill 2.

Concepts, roughly:
- the layer model, Ethernet and ARP, IP addressing, routing, BGP,
  anycast, NAT, MTU, ICMP
- where network latency comes from
- sockets, UDP, TCP in depth: the handshake, TIME_WAIT, retransmission,
  keepalive, flow control, congestion control, bufferbloat, pacing, the
  bandwidth-delay product, Nagle, head-of-line blocking
- DNS: resolution, record types, caching
- tools: TUN/TAP devices, packet capture

### Phase 3: Networking II, secure protocols and proxies
Skill 2.

Concepts, roughly:
- hashes, symmetric and public-key crypto, HMAC, at concept level
- TLS 1.3, certificates and PKI, resumption, mTLS
- DNSSEC, encrypted DNS (DoT and DoH)
- HTTP semantics, HTTP caching, HTTP/1.1, HTTP/2, QUIC, HTTP/3,
  WebSockets, SSE
- protobuf and gRPC, connection pooling
- reverse proxies, request smuggling, client IP forwarding, zero-downtime
  reloads, load balancing and its algorithms, health checks, service
  discovery, CDNs, fuzzing

### Phase 4: Concurrency and I/O models
Skill 3.

Concepts, roughly:
- race conditions, mutexes, deadlocks, memory models, lock-free
  structures, message passing
- blocking vs non-blocking I/O, epoll, io_uring
- thread-per-connection, thread pools, event loops, async/await, green
  threads, C10K
- CPU-bound vs I/O-bound, latency percentiles, backpressure, bounded
  queues, graceful shutdown
- race detectors and the Redis protocol, because the phase 4 build uses
  both

### Phase 5: APIs and contracts
Skill 4.

Concepts, roughly:
- API design, REST, GraphQL, OpenAPI, pagination, versioning, schema
  evolution, backwards compatibility, error design, validation,
  conditional requests, long-running operations, long polling
- timeouts, idempotency and idempotency keys, retries with backoff,
  delivery guarantees, dead-letter queues, request signing, webhooks
- rate limiting and its algorithms, API gateways

### Phase 6: Databases I, using Postgres well
Skill 5.

Concepts, roughly:
- the relational model, SQL, joins, normalization, keys, constraints,
  CTEs, window functions, other data models, JSONB
- indexes and their types, composite, covering and partial indexes, the
  query planner, statistics, EXPLAIN, N+1, ORMs, full-text search
- Postgres architecture at a glance, SQLite, database connection pooling
- migrations, DDL locks, zero-downtime migrations, triggers, online
  schema change

### Phase 7: Databases II, storage engines
Skill 6.

Concepts, roughly:
- storage engines, pages, heap files, the buffer pool, B+trees
- the write-ahead log, group commit, checkpoints, full-page writes,
  crash recovery
- log-structured hash tables, skip lists, LSM trees, SSTables,
  compaction, bloom filters, compression
- read, write and space amplification, storage benchmarks, and
  model-based testing, because the phase 7 harness is one

### Phase 8: Databases III, transactions
Skill 6.

Concepts, roughly:
- transactions, ACID, isolation levels, serializability
- anomalies: dirty reads, non-repeatable reads, phantoms, lost updates,
  write skew
- two-phase locking, lock granularity, predicate locks, deadlock
  detection, explicit and advisory locks, optimistic concurrency
- MVCC, snapshot isolation, serializable snapshot isolation, vacuum,
  long-running transactions
- checking histories for anomalies

### Phase 9: Caching and performance
Skill 7.

Concepts, roughly:
- caching, caching patterns (cache-aside, write-through, write-behind),
  invalidation, stampedes, eviction policies and the count-min sketch
- Redis internals and its persistence (HTTP caching moved to phase 3,
  Redis's protocol to phase 4)
- the USE and RED methods, profiling, flame graphs, eBPF
- Little's law, queueing theory, Amdahl's law, capacity planning
- tail latency, latency histograms, load testing, coordinated omission,
  benchmarking pitfalls

### Phase 10: Messaging and streams
Skill 8.

Concepts, roughly:
- message queues, pub/sub, logs vs queues, Kafka's architecture,
  ordering
- inside a log broker: segment files and retention, log compaction,
  zero-copy, idempotent producers
- consumer groups, offsets, lag, exactly-once processing, poison
  messages, message schemas
- dual writes, the transactional outbox, logical replication, change data
  capture
- event sourcing, CQRS, background jobs, job scheduling

### Phase 11: Distributed systems I, replication and partitioning
Skill 9.

Concepts, roughly:
- what makes distributed systems hard, the fallacies, failure models,
  network partitions, process pauses, fault injection
- replication: leader-follower, sync vs async, in-sync replicas, lag,
  failover, multi-leader, leaderless, quorums, read repair and
  anti-entropy, conflict resolution, CRDTs
- partitioning: range vs hash, consistent hashing, rebalancing, hot
  spots, secondary indexes
- consistency models, eventual and causal consistency, linearizability
  and checking it, CAP, PACELC
- clocks: skew, Lamport, vector and hybrid logical clocks

### Phase 12: Distributed systems II, consensus and coordination
Skill 10.

Concepts, roughly:
- failure detection, gossip, consensus, FLP, replicated state machines
- Raft (elections, log replication, snapshots, membership changes,
  linearizable reads), Paxos, chain replication, Byzantine fault
  tolerance
- leases, fencing tokens, coordination services, leader election,
  distributed locks
- two-phase commit, sagas, distributed transactions
- deterministic simulation testing

### Phase 13: Reliability engineering
Skill 11.

Concepts, roughly:
- SLIs, SLOs and SLAs, error budgets, availability math, failure domains
- deadline propagation, retry budgets, circuit breakers, bulkheads
- goodput, load shedding, admission control, graceful degradation,
  thundering herds, cascading and metastable failures, cell-based
  architecture
- chaos engineering, backups, disaster recovery
- incident response, on-call, postmortems

### Phase 14: Running it: containers, deploys, observability
Skill 12.

Concepts, roughly:
- namespaces, cgroups, overlayfs, containers, images, container
  runtimes, VMs
- control loops, Kubernetes and its networking
- observability, structured logs, metrics, cardinality,
  distributed tracing, trace sampling, OpenTelemetry, continuous
  profiling, alerting
- infrastructure as code, configuration, CI/CD, deploy strategies,
  canary analysis, feature flags, autoscaling

### Phase 15: Security, authentication and authorization
Skill 13.

Concepts, roughly:
- threat modeling, password hashing, cookies, sessions, JWT, API keys,
  OAuth2, OIDC, passkeys, MFA
- authorization models, Zanzibar and the new-enemy problem,
  multi-tenancy, row-level security, audit logs
- the OWASP API Top 10, BOLA, SQL injection, SSRF, the same-origin
  policy, CSRF, CORS
- secrets management, envelope encryption, zero trust, supply chain
  security

### Phase 16: Data systems
Skill 14.

Concepts, roughly:
- OLTP vs OLAP, column storage, vectorized execution, Parquet,
  warehouses, ETL vs ELT
- object storage, and open table formats (what a lakehouse is built on)
- batch processing, shuffles, backfills
- stream processing, event time, windows, watermarks, late data, the
  Dataflow model, lambda vs kappa
- state inside a stream job, distributed snapshots, and exactly-once
  output through transactional sinks, because the phase 16 build does
  all three

### Phase 17: Putting it together: system design and durable execution
Skill 15.

Concepts, roughly:
- back-of-the-envelope estimates, a method for system design
- monoliths vs microservices, service meshes, ID generation, feed
  fan-out, distributed rate limiting, real-time sync,
  search, multi-region
- orchestration vs choreography, durable execution, workflow
  determinism, durable timers

## Stack

- **Go for the lab.** Chosen over Rust (both are in the
  postings above). Decision 0001 records it, with the repo layout, when
  the phase 1 build starts. Go fits proxies, brokers and consensus, and
  has good profiling built in.
- **Linux on my own machine** (Arch), and only that machine, with the
  hardware it has: no cloud boxes, no spare disks. Several builds need
  Linux features directly: TUN devices, io_uring, namespaces, cgroups,
  eBPF, `tc netem`.
- **Postgres** from phase 6, as the thing I study and the thing I
  compare against.
- **The site** reuses ai-eng-graph's Next.js app and metro map, copied
  over when the first node is written (a decision record then). Until
  then, `bun run check` is the only tooling.
- **Python** for analysis and plots of experiment data, where it's the
  better tool.

## What I walk into an interview with

- A public repo with a system built from its parts: a user-space TCP
  stack, an L7 proxy, a storage engine with MVCC, a broker, Raft, a
  container runtime, an authorization service, and a durable execution
  engine running on all of it.
- For each part, a correctness harness and benchmark numbers against the
  real thing, on hardware I name.
- Research articles that show I understand how things work.
- Experiment write-ups like "snapshot isolation in my engine let write
  skew through, here's the history Elle-style checking found, here's the
  fix and the throughput it cost".
- Postmortems of failures I caused and fixed in my own system.

## How the work gets done

- What gets built: `LAB.md`.
- Articles: `WRITING.md`.
- The agent workflow: `CLAUDE.md`.
- Decision records: `content/templates/decision.md`.
- Experiments: `content/templates/experiment.md`.
