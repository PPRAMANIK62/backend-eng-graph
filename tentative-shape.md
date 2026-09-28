# Tentative shape of the map

Written 2026-09-28. **Not final.** This is a first guess at every node across
all 17 phases, so I can see where the project is going. Each phase still
gets planned properly at its start (see `CLAUDE.md`), and these lists will
change as I learn. Once a phase's nodes exist as files in `content/nodes/`,
the files are the source of truth, not the tables here.

How to read the tables:
- **needs** lists what to read first. `leads_to` is the mirror of `needs`,
  so it isn't listed separately. A node only needs nodes from its own phase
  or an earlier one.
- **compare** lists what the node gets confused with or weighed against.
- Nodes marked `*` aren't in `PLAN.md`'s concept lists. I added them
  because other nodes or a lab build lean on them.

## Totals

| Phase | Theme | Deep | Short | Total |
|---|---|---|---|---|
| 1 | The machine under the backend | 12 | 20 | 32 |
| 2 | Networking I, packets to transport | 9 | 20 | 29 |
| 3 | Networking II, secure protocols and proxies | 11 | 18 | 29 |
| 4 | Concurrency and I/O models | 8 | 14 | 22 |
| 5 | APIs and contracts | 11 | 10 | 21 |
| 6 | Databases I, using Postgres well | 12 | 17 | 29 |
| 7 | Databases II, storage engines | 8 | 11 | 19 |
| 8 | Databases III, transactions | 10 | 10 | 20 |
| 9 | Caching and performance | 10 | 13 | 23 |
| 10 | Messaging and streams | 8 | 12 | 20 |
| 11 | Distributed systems I, replication and partitioning | 15 | 17 | 32 |
| 12 | Distributed systems II, consensus and coordination | 11 | 10 | 21 |
| 13 | Reliability engineering | 9 | 13 | 22 |
| 14 | Running it: containers, deploys, observability | 10 | 14 | 24 |
| 15 | Security, authentication and authorization | 11 | 14 | 25 |
| 16 | Data systems | 8 | 12 | 20 |
| 17 | Putting it together: system design and durable execution | 6 | 8 | 14 |
| | | **169** | **233** | **402** |

That's a lot of writing: roughly 169 × 2,000 + 233 × 700 words, about
501,000 words, three times ai-eng-graph. It's meant to take a long time.
Phases 1 to 8 stand on their own if I stop there.

## The spine

The shortest path through the graph, from the machine up to the capstone.
If I only wrote these, the site would still hold together:

```
process → virtual-memory → page-cache → fsync → crash-consistency
  → tcp → tls → http-1-1 → event-loop → idempotency
  → sql → indexes → b-plus-tree → write-ahead-log → lsm-tree
  → transaction → isolation-levels → mvcc → caching → tail-latency
  → log-based-messaging → replication → linearizability → consensus → raft
  → load-shedding → observability → durable-execution
```

## Phase 1: The machine under the backend (skill 1)

**Who and why**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `backend-engineer` | short | Owns the data, the services and the systems they run on. Where it overlaps with platform, SRE and data engineering. | | |
| `latency-numbers` | deep | Rough times for a cache hit, a RAM read, an SSD read, a round trip across a region and across the world, measured on my own machine. The numbers every design sits on. | backend-engineer, memory-hierarchy | |

**Processes and the CPU**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `process` | deep | A running program: its own address space, open files and state, managed by the kernel. | | thread |
| `thread` | deep | Several lines of execution sharing one process's memory. | process | process |
| `system-call` | deep | How a program asks the kernel to do something, and what crossing into the kernel costs. | process | |
| `cpu-scheduler` | short | How the kernel picks which thread runs next on each core. EEVDF, which replaced CFS in Linux 6.6. | thread | |
| `context-switch` | short | The kernel swapping one thread off a core for another, and why many of them hurt. | cpu-scheduler | |
| `signals` | short | Messages the kernel delivers to a process: SIGTERM, SIGKILL, SIGPIPE. Where graceful shutdown starts. | process | |
| `strace`* | short | Watching every system call a program makes. The first tool for "what is it actually doing?" | system-call | |

**Memory**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `memory-hierarchy` | deep | Registers, L1 to L3 caches, RAM, disk: each level bigger and slower. Why locality decides speed. | | |
| `cpu-cache` | short | Cache lines, hits and misses, and false sharing between cores. | memory-hierarchy | |
| `virtual-memory` | deep | Each process sees its own address space, mapped page by page onto physical RAM. | process | |
| `huge-pages`* | short | 2 MiB and 1 GiB pages instead of 4 KiB: fewer TLB misses, and the trouble transparent huge pages cause databases. | virtual-memory | |
| `page-faults` | short | What happens when a program touches a page that isn't in RAM yet. Minor vs major faults. | virtual-memory | |
| `heap-and-stack` | short | The two places a program's memory lives, and what an allocation costs. | virtual-memory | |
| `garbage-collection` | deep | How Go and the JVM free memory for you, and what the pauses cost a server's latency. | heap-and-stack | |

**Files and storage**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `file-descriptor` | short | A small integer that stands for anything you can read or write: a file, a socket, a pipe. | system-call | |
| `block-device` | short | A disk as the kernel sees it: a numbered list of fixed-size blocks. | | |
| `filesystem` | deep | How files, directories and inodes are laid onto blocks. ext4, XFS, and journaling. | file-descriptor, block-device | |
| `ssd-internals` | deep | Flash pages and erase blocks, the flash translation layer, garbage collection and write amplification inside the drive. | block-device | |
| `page-cache` | deep | The kernel keeps file data in RAM. Reads and writes hit it first, not the disk. | virtual-memory, filesystem | |
| `mmap` | short | Mapping a file into memory, and why database people argue about using it. | virtual-memory, page-cache | direct-io |
| `direct-io` | short | Skipping the page cache to control I/O yourself, like some databases do. | page-cache | mmap |
| `fsync` | deep | Forcing data from the page cache to stable storage. What "durable" really means, and where drives and filesystems lie. | page-cache | |
| `fsync-errors`* | short | What happens when fsync fails: the kernel may drop the data and mark it clean, so retrying lies. Postgres's 2018 fsyncgate. | fsync | |
| `torn-writes`* | short | A write only partly on disk after power loss: what the drive promises is atomic (a sector) and what it doesn't. | block-device | |
| `crash-consistency` | deep | What state files are in after power loss, and how to design so that state is always recoverable. | fsync, torn-writes | |
| `atomic-rename`* | short | Write a temp file, fsync it, rename it, fsync the directory: the classic safe update. | crash-consistency | |
| `checksums`* | short | CRC32 and friends: catching data that was torn or corrupted on the way to or from disk. | | |
| `binary-encoding`* | short | How numbers and strings are laid out as bytes: endianness, fixed width, varints, length prefixes. | | |
| `append-only-log`* | short | A file you only ever add to: length-prefixed, checksummed records, and recovery that drops a torn tail. The phase 1 build. | binary-encoding, checksums, crash-consistency | |
| `crash-testing`* | short | Simulating power loss to test storage code: cut writes at a random point, remount, check what survived. LazyFS, dm-log-writes. The phase 1 harness. | crash-consistency | |

## Phase 2: Networking I, packets to transport (skill 2)

**Layers and addresses**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `network-layers` | deep | Link, network, transport, application: the layer model and where it's a simplification. | | |
| `ethernet-and-arp` | short | How a frame reaches the next machine on the same network, and how an IP address is matched to a MAC. | network-layers | |
| `ip-addressing` | deep | IPv4 and IPv6 addresses, subnets and CIDR notation. | network-layers | |
| `ip-routing` | deep | How a packet finds its way hop by hop using routing tables. | ip-addressing | |
| `bgp` | short | How networks on the internet announce which addresses they can reach. | ip-routing | |
| `anycast` | short | One address announced from many places, so you reach the nearest. How DNS roots and CDNs work. | bgp, tcp | |
| `nat` | short | Many private addresses sharing one public one, and why it breaks incoming connections. | ip-addressing, ports-and-sockets | |
| `mtu-and-fragmentation` | short | The largest packet a link carries, and what happens to bigger ones. | ip-routing | |
| `icmp` | short | Ping, traceroute and path MTU discovery. | ip-routing | mtu-and-fragmentation |
| `network-latency` | deep | Propagation, transmission, queuing and processing delay. Round-trip time, and why the speed of light is a real limit. | network-layers, latency-numbers | |

**Transport**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `ports-and-sockets` | deep | The sockets API (bind, listen, accept, connect), and a connection as a four-part address. | file-descriptor, ip-addressing | |
| `udp` | short | Send a datagram and hope. No connection, no ordering, no retransmission. | ports-and-sockets | tcp |
| `tcp` | deep | A reliable, ordered byte stream built on a network that drops and reorders packets. | ports-and-sockets | udp |
| `tcp-handshake` | short | SYN, SYN-ACK, ACK: what opening a connection costs, and SYN floods. | tcp | |
| `time-wait` | short | Why a closed connection lingers, and how that runs a busy client out of ports. | tcp-handshake | |
| `tcp-retransmission` | deep | ACKs, retransmission timeouts and fast retransmit. | tcp | |
| `tcp-flow-control` | short | The receiver's window: don't send more than the other side can hold. | tcp | congestion-control |
| `congestion-control` | deep | Slow start, backing off on loss, and CUBIC vs BBR: don't send more than the network can carry. | tcp-retransmission | tcp-flow-control |
| `bandwidth-delay-product` | short | How much data must be in flight to fill a link. Why long fat pipes need big windows. | congestion-control, network-latency, tcp-flow-control | |
| `nagle-and-delayed-ack` | short | Two sensible TCP features that together add 40 ms stalls. TCP_NODELAY. | tcp | |
| `head-of-line-blocking` | short | One lost packet holds up everything behind it in the stream. | tcp-retransmission | |
| `tcp-keepalive`* | short | How a connection notices the other side is gone: keepalive probes and TCP_USER_TIMEOUT. | tcp, nat | |
| `bufferbloat`* | short | Oversized buffers that fill up and add delay, and the queue management that fixes it. | network-latency, congestion-control | |
| `pacing`* | short | Spacing packets out over the round trip instead of sending them in bursts. | congestion-control | |
| `tun-tap`* | short | Virtual network devices that hand raw packets to a program. The phase 2 build runs on one. | ip-routing, ethernet-and-arp | |
| `packet-capture` | short | tcpdump and Wireshark: seeing what's really on the wire. | network-layers | |

**Names**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `dns` | deep | Turning names into addresses: stub and recursive resolvers, root, TLD and authoritative servers. | udp, tcp | |
| `dns-records` | short | A, AAAA, CNAME, NS, MX, TXT, SRV: what each record type is for. | dns | |
| `dns-caching` | short | TTLs, negative caching, and why a DNS change takes a while to reach everyone. | dns | |

## Phase 3: Networking II, secure protocols and proxies (skill 2)

**Crypto you need for TLS**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `cryptographic-hashes` | short | SHA-256 and friends: one-way fingerprints of data. | | checksums |
| `symmetric-encryption` | short | One shared key to encrypt and decrypt. AES-GCM and ChaCha20-Poly1305 at concept level. | | public-key-crypto |
| `public-key-crypto` | short | Key pairs, signatures and key exchange, at concept level. | cryptographic-hashes | symmetric-encryption |
| `hmac` | short | Proving a message came from someone who holds a shared secret. | cryptographic-hashes | |

**TLS**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `tls` | deep | Encryption and server identity on top of TCP. The TLS 1.3 handshake step by step. | tcp, public-key-crypto, symmetric-encryption | |
| `certificates-and-pki` | deep | How a chain of certificates proves a server is who it claims. CAs, ACME, revocation, certificate transparency. | public-key-crypto | |
| `tls-resumption` | short | Skipping most of the handshake on a repeat visit, and the replay risk of 0-RTT. | tls | |
| `mtls` | short | Both sides show a certificate. How services prove who they are to each other. | certificates-and-pki, tls | |

**HTTP**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `http-semantics` | deep | Methods, status codes and headers as HTTP defines them, including which methods are safe and idempotent. | tcp | |
| `http-1-1` | deep | Text framing, keep-alive, chunked encoding, and why pipelining failed. | http-semantics | |
| `http2` | deep | Binary frames, many streams on one connection, header compression, and TCP head-of-line blocking. | http-1-1, head-of-line-blocking | |
| `quic` | deep | A transport on UDP with streams, built-in TLS and connection migration. | udp, tls, head-of-line-blocking | tcp |
| `http3` | short | HTTP on QUIC, and what changes from HTTP/2. | quic, http2 | |
| `websockets` | short | A two-way channel upgraded from an HTTP request. | http-1-1 | server-sent-events |
| `server-sent-events` | short | A one-way stream of events from server to client over plain HTTP. | http-1-1 | websockets |
| `protobuf` | short | A binary format with a schema and numbered fields. | binary-encoding | |
| `grpc` | deep | Remote calls over HTTP/2 with protobuf: unary and streaming calls, deadlines, status codes. | http2, protobuf | |
| `dnssec`* | short | Signatures on DNS answers, so a resolver can check an answer came from the zone's owner. | dns, public-key-crypto | |
| `encrypted-dns`* | short | DNS over TLS and DNS over HTTPS: hiding lookups from the network. | dns, tls | |
| `connection-pooling` | short | Keeping connections open to reuse them, and how big the pool should be. | tcp-handshake, tls | |
| `fuzzing`* | short | Feeding generated input to a parser to find crashes and disagreements. The phase 3 build's harness. | | fault-injection |

**Proxies and load balancing**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `reverse-proxy` | deep | A server that takes client requests and forwards them to backends. What it can add: TLS, retries, caching, limits. | http-1-1 | |
| `request-smuggling` | short | When a proxy and a backend disagree about where one request ends and the next begins. | http-1-1, reverse-proxy | |
| `load-balancing` | deep | Spreading requests across backends so none is overloaded and dead ones get skipped. | reverse-proxy | |
| `l4-vs-l7` | short | Balancing connections vs balancing requests. What each can see and do. | load-balancing | |
| `load-balancing-algorithms` | deep | Round robin, least connections, power of two choices, and how each behaves under uneven load. | load-balancing | |
| `health-checks` | short | Active probes vs watching real traffic, and taking bad backends out. | load-balancing | |
| `service-discovery` | short | How a client finds the current list of backend addresses. | dns, dns-records, load-balancing | |
| `cdn` | deep | Caches at the edge, near users. What they can and can't serve. | anycast, reverse-proxy | |

## Phase 4: Concurrency and I/O models (skill 3)

**Shared memory**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `concurrency-vs-parallelism` | short | Dealing with many things at once vs doing many things at once. | thread | |
| `race-condition` | deep | Two threads touch the same data, and the result depends on timing. | thread | |
| `mutex` | short | A lock only one thread can hold at a time. | race-condition | message-passing |
| `deadlock` | short | Threads each waiting on a lock another holds, forever. | mutex | |
| `memory-model` | deep | When one thread's writes become visible to another. Atomics and happens-before. | race-condition, cpu-cache | |
| `lock-free-structures` | short | Data structures built on atomic compare-and-swap instead of locks, and their traps. | memory-model | |
| `message-passing` | short | Threads share data by sending it over channels instead of locking it. | thread | mutex |

**I/O models**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `blocking-io` | short | A read that waits until data arrives, holding its thread the whole time. | system-call | non-blocking-io |
| `non-blocking-io` | short | A read that returns right away with "nothing yet". | blocking-io | blocking-io |
| `io-multiplexing` | deep | select, poll, epoll, kqueue: one thread watching thousands of sockets. | non-blocking-io, file-descriptor | |
| `io-uring` | deep | Queues shared with the kernel: submit I/O, collect results, few system calls. | io-multiplexing | io-multiplexing |
| `thread-per-connection` | short | One thread for each client. Simple, until there are many clients. | thread, ports-and-sockets | event-loop |
| `thread-pool` | short | A fixed set of threads taking work from a queue. | thread | |
| `event-loop` | deep | One thread running handlers when I/O is ready. How nginx, Node and Redis serve many clients. | io-multiplexing | thread-per-connection |
| `async-await` | deep | How languages turn callbacks back into straight-line code: futures, state machines, colored functions. | event-loop | green-threads |
| `green-threads` | deep | Cheap user-space threads run on a few OS threads. Go's scheduler. | thread, io-multiplexing | async-await |
| `c10k` | short | The problem that moved servers from threads to event loops. | thread-per-connection, event-loop | |

**Load on a server**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `cpu-bound-vs-io-bound` | short | Whether work waits on the CPU or on I/O, and why it changes the right design. | thread | |
| `latency-percentiles` | short | p50, p99, p99.9: why the average hides the requests people complain about. | | |
| `backpressure` | deep | Making a fast producer slow down to what the consumer can handle, instead of piling up. | event-loop | |
| `bounded-queues` | short | A queue with a limit, and what to do when it's full. | backpressure | |
| `graceful-shutdown` | short | Stop taking new work, finish what's in flight, then exit. | signals, event-loop | |

## Phase 5: APIs and contracts (skill 4)

**Design**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `api-design` | deep | Resources vs actions, naming, consistency. An API is a promise you can't easily take back. | http-semantics | |
| `rest` | deep | What Fielding defined, and what "REST API" means in practice. | http-semantics | grpc, graphql |
| `graphql` | deep | The client picks the fields. Resolvers, the N+1 problem, and why caching gets harder. | api-design | rest |
| `openapi` | short | Machine-readable API contracts, and generating clients and servers from them. | rest | |
| `pagination` | short | Offset vs cursor, and why offsets break on changing data. | api-design | |
| `api-versioning` | short | URL, header or never: ways to change an API without breaking clients. | api-design | |
| `schema-evolution` | deep | Changing message shapes without breaking old readers or writers: forward and backward compatibility. | protobuf | |
| `error-design` | short | Status codes and error bodies a client can act on. Problem details. | http-semantics | |
| `validation-at-boundary`* | short | Parse and check outside data once, where it enters, and trust it inside. | api-design | |
| `conditional-requests` | short | ETags and If-Match: stopping two clients from overwriting each other over HTTP. | http-semantics | |
| `long-running-operations` | short | Accept now, finish later: 202 with a status URL, or a callback. | api-design | |

**Doing it once, even when it's retried**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `timeouts` | short | Every network call needs a limit, and picking one is harder than it looks. | network-latency | |
| `idempotency` | deep | Running an operation twice has the same effect as running it once. Why retries need it. | http-semantics | |
| `idempotency-keys` | deep | The client sends a unique key, and the server stores the result under it. | idempotency | |
| `retries-with-backoff` | deep | Retrying with exponential backoff and jitter so retries don't pile on. | idempotency, timeouts | |
| `delivery-guarantees` | deep | At most once, at least once, and what "exactly once" can really mean. | idempotency, retries-with-backoff | |
| `dead-letter-queue` | short | Where a message or delivery goes after its last retry fails. | retries-with-backoff | |
| `webhooks` | deep | The server calls the client: signing, retries, ordering, and endpoints that are down for days. | delivery-guarantees, hmac | |

**Protecting the API**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `rate-limiting` | deep | Capping how much each client can send, and where to enforce it. | api-design | |
| `rate-limiting-algorithms` | deep | Token bucket, leaky bucket, fixed and sliding windows, GCRA: what each allows through. | rate-limiting | |
| `api-gateway` | short | One front door for many services: auth, limits, routing. | reverse-proxy, rate-limiting | |

## Phase 6: Databases I, using Postgres well (skill 5)

**The model**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `relational-model` | deep | Data as tables of rows linked by keys, and why it has lasted fifty years. | | data-models |
| `sql` | deep | Say what you want, not how to get it. What the database does with a query. | relational-model | |
| `joins` | deep | Combining tables, and the three ways a database runs a join: nested loop, hash, merge. | sql | |
| `normalization` | deep | Storing each fact once so it can't disagree with itself. | relational-model | denormalization |
| `denormalization` | short | Copying data on purpose to make reads faster, and paying for it on writes. | normalization | normalization |
| `primary-keys` | short | Natural vs surrogate keys, sequences vs UUIDv4 vs UUIDv7, and why key order affects the index. | relational-model | |
| `constraints` | short | Foreign keys, unique and check constraints: rules the database enforces for you. | relational-model | |
| `ctes` | short | Named subqueries with WITH, including recursive ones. | sql | |
| `window-functions` | short | Running totals, rankings and "previous row" without collapsing rows. | sql | |
| `data-models` | deep | Document, key-value, wide-column and graph databases: what each is good at. | relational-model | relational-model |
| `jsonb` | short | JSON columns in Postgres, and when a document column is the right call. | data-models | |

**Making queries fast**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `indexes` | deep | An extra structure that finds rows without reading the whole table, and what it costs every write. | sql | |
| `index-types` | short | B-tree, hash, GIN, GiST, BRIN: what each is for in Postgres. | indexes | |
| `composite-indexes` | short | Indexes on several columns, and why column order decides which queries use them. | indexes | |
| `covering-indexes` | short | Answering a query from the index alone, with no trip to the table. | indexes | |
| `partial-indexes` | short | Indexing only the rows a query cares about. | indexes | |
| `query-planner` | deep | How the database picks a plan from many, using statistics and a cost model. | indexes, joins | |
| `table-statistics` | short | What the planner knows about your data, and how stale statistics produce bad plans. | query-planner | |
| `explain` | deep | Reading EXPLAIN ANALYZE: estimated vs actual rows, where the time went. | query-planner | |
| `n-plus-one` | short | One query for the list, then one more per item. | sql | |
| `orm` | short | What an ORM hides, and when that hurts. | n-plus-one | |
| `full-text-search` | short | tsvector, GIN indexes and ranking in Postgres. Where it runs out. | index-types | |

**Running it**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `postgres-architecture` | deep | One process per connection, shared buffers, the WAL writer, autovacuum: the moving parts at a glance. | process | sqlite |
| `sqlite` | short | A database in a file inside your process. When that's enough. | relational-model | postgres-architecture |
| `db-connection-pooling` | short | Why Postgres connections are expensive, and what PgBouncer's pooling modes break. | connection-pooling, postgres-architecture | |
| `schema-migrations` | deep | Versioned, ordered changes to the schema, run the same way everywhere. | constraints | |
| `ddl-locks`* | short | Which ALTER TABLE statements lock the table, for how long, and the lock queue behind them. | schema-migrations | |
| `zero-downtime-migrations` | deep | Expand, migrate, contract: changing a schema while the app keeps running. | schema-migrations, ddl-locks | |
| `online-schema-change` | deep | Shadow-table tools: copy the table, capture changes, then swap. How gh-ost, pt-osc and pgroll differ. | zero-downtime-migrations | |

## Phase 7: Databases II, storage engines (skill 6)

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `storage-engine` | deep | The part of a database that lays data on disk and finds it again. | filesystem, page-cache | |
| `database-pages` | short | Fixed-size pages and the slotted layout that holds rows inside them. | storage-engine | |
| `heap-files` | short | Rows stored in no particular order, found through indexes. | database-pages | |
| `buffer-pool` | deep | The database's own cache of pages, its eviction policy, and why it doesn't just trust the OS. | page-cache, database-pages | mmap |
| `b-plus-tree` | deep | The on-disk tree behind most indexes: high fanout, splits and merges. | database-pages | lsm-tree |
| `write-ahead-log` | deep | Write the change to a log before touching the data, so a crash can be undone or redone. | fsync, append-only-log | |
| `group-commit` | short | Many transactions sharing one fsync. | write-ahead-log | |
| `checkpoints` | short | Flushing pages so recovery doesn't replay the whole log. | write-ahead-log | |
| `crash-recovery` | deep | Redo and undo after a crash. The ideas behind ARIES. | write-ahead-log, checkpoints | |
| `full-page-writes` | short | How databases survive a page only half written at power loss: Postgres full-page writes, the InnoDB double-write buffer. | torn-writes, database-pages | |
| `log-structured-hash-table` | short | Append every write to a log, keep an in-memory map of offsets. Bitcask. | append-only-log | lsm-tree |
| `skip-list` | short | A sorted structure built from layered linked lists. Common in memtables. | | b-plus-tree |
| `lsm-tree` | deep | Buffer writes in memory, flush sorted files, merge them later. | write-ahead-log | b-plus-tree |
| `sstable` | short | An immutable sorted file with an index and filter blocks. | lsm-tree, bloom-filter | |
| `compaction` | deep | Merging sorted files: leveled vs tiered, and what each costs. | sstable | |
| `bloom-filter` | short | A small structure that says "definitely not here" or "maybe here". | | |
| `block-compression` | short | Compressing pages or blocks: trading CPU for less I/O. | | |
| `amplification` | deep | Read, write and space amplification: the three costs every storage engine trades between. | b-plus-tree, lsm-tree | |
| `storage-benchmarks` | short | YCSB workloads, and what a fair engine benchmark has to control. | storage-engine | |

## Phase 8: Databases III, transactions (skill 6)

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `transaction` | deep | A group of reads and writes that succeeds or fails as one. | sql | |
| `acid` | deep | What each letter really promises, and why C is mostly your job. | transaction | |
| `isolation-levels` | deep | Read committed, repeatable read, serializable: what each lets concurrent transactions see. | transaction | |
| `dirty-read` | short | Seeing another transaction's uncommitted writes. | isolation-levels | |
| `non-repeatable-read` | short | Reading the same row twice and getting different values. | isolation-levels | |
| `phantom-read` | short | Running the same query twice and getting new rows. | isolation-levels | |
| `lost-update` | deep | Two read-modify-write cycles run at once and one write disappears. | isolation-levels | |
| `write-skew` | deep | Two transactions each check a rule, both pass, and together they break it. | isolation-levels | lost-update |
| `two-phase-locking` | deep | Take locks as you go, release them only at the end. How it gives serializability. | isolation-levels | mvcc |
| `lock-granularity` | short | Row, page and table locks, and intention locks between them. | two-phase-locking | |
| `deadlock-detection` | short | The database finds a cycle of waiting transactions and kills one. | deadlock, two-phase-locking | |
| `explicit-locking` | short | SELECT FOR UPDATE, NOWAIT and SKIP LOCKED. | two-phase-locking | |
| `advisory-locks` | short | Locks on numbers you choose, for coordinating app code through Postgres. | explicit-locking | |
| `optimistic-concurrency` | short | Don't lock, check a version at commit, retry on conflict. | transaction | two-phase-locking |
| `mvcc` | deep | Keep several versions of each row so readers don't block writers. | isolation-levels | two-phase-locking |
| `snapshot-isolation` | deep | Every transaction reads from one consistent snapshot. What it prevents and what it lets through. | mvcc | |
| `serializable-snapshot-isolation` | deep | Snapshot isolation plus tracking dangerous read-write patterns. Postgres's SERIALIZABLE. | snapshot-isolation, write-skew | two-phase-locking |
| `vacuum` | short | Cleaning dead row versions in Postgres: bloat and transaction ID wraparound. | mvcc | |
| `long-running-transactions` | short | What one open transaction holds back for everyone else. | mvcc | |
| `history-checking` | deep | Record every operation, then check the history for anomalies. How Jepsen's Elle finds isolation bugs. | isolation-levels | |

## Phase 9: Caching and performance (skill 7)

**Caching**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `caching` | deep | Keeping a copy closer to where it's needed. Hit ratios and what a miss costs. | memory-hierarchy | |
| `cache-aside` | short | The app checks the cache, and on a miss reads the database and fills the cache. | caching | write-through-cache |
| `write-through-cache` | short | Every write goes to the cache and the database together. | caching | write-behind-cache |
| `write-behind-cache` | short | Writes go to the cache and reach the database later. Fast, and risky. | caching | write-through-cache |
| `cache-invalidation` | deep | Keeping cached data from going stale: TTLs, deletes on write, and their races. | cache-aside | |
| `cache-stampede` | short | A popular key expires and every request hits the database at once. | cache-invalidation | thundering-herd |
| `eviction-policies` | deep | LRU, LFU, ARC, W-TinyLFU, S3-FIFO: deciding what to drop when the cache is full. | caching | |
| `redis-internals` | deep | One thread on an event loop, its data structures, and persistence with RDB and AOF. | event-loop | |
| `resp-protocol` | short | The simple text protocol Redis clients speak. | redis-internals | |
| `http-caching` | deep | Cache-Control, validation with ETags, and shared vs private caches. | http-semantics, cdn | |

**Performance method**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `use-method` | short | Utilization, saturation, errors for every resource: a checklist for finding bottlenecks. | | red-method |
| `red-method` | short | Rate, errors, duration for every service. | latency-percentiles | use-method |
| `profiling` | deep | Sampling where the CPU spends time, and where threads wait (on-CPU vs off-CPU). | system-call | |
| `flame-graphs` | short | Reading a profile as stacked bars. | profiling | |
| `ebpf` | deep | Small safe programs running inside the kernel, for seeing almost anything as it happens. | system-call | |
| `tail-latency` | deep | Why the slowest 1% matter most at scale, and how fan-out multiplies them. | latency-percentiles | |
| `littles-law` | short | Items in the system = arrival rate × time in the system. | | |
| `queueing-theory` | deep | Why wait time shoots up as a server gets busy, and why 80% utilization can already feel slow. | littles-law | |
| `amdahls-law` | short | The part you can't parallelize caps your speedup. | concurrency-vs-parallelism | |
| `load-testing` | deep | Open vs closed workload models, and designing a test that finds the real limit. | latency-percentiles | |
| `coordinated-omission` | short | How most load generators hide the worst latency, and how to measure it correctly. | load-testing | |
| `benchmarking-pitfalls` | short | Warmup, noise, CPU frequency scaling, and comparing numbers that aren't comparable. | load-testing | |
| `capacity-planning` | short | Working out how much hardware a load needs, with headroom. | queueing-theory | |

## Phase 10: Messaging and streams (skill 8)

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `message-queue` | deep | A broker between producers and consumers, so neither waits on the other. | delivery-guarantees | |
| `pub-sub` | short | One message delivered to many subscribers. | message-queue | |
| `log-based-messaging` | deep | A queue that deletes messages vs a log that keeps them and lets readers track their place. | message-queue | |
| `kafka-architecture` | deep | Topics, partitions, brokers, and replication through in-sync replicas. | log-based-messaging | |
| `message-ordering` | short | Order holds within a partition, not across partitions. Choosing the key. | kafka-architecture | |
| `consumer-groups` | short | Splitting a topic's partitions among consumers, and rebalancing. | kafka-architecture | |
| `offsets-and-commits` | short | A consumer's place in the log, and when to save it. | consumer-groups | |
| `consumer-lag` | short | How far behind the consumers are, and what it tells you. | offsets-and-commits | |
| `log-compaction` | short | Keeping only the latest value for each key instead of deleting by age. | kafka-architecture | |
| `exactly-once-processing` | deep | Idempotent producers, transactions, and what "exactly once" means from end to end. | delivery-guarantees, offsets-and-commits | |
| `poison-messages` | short | A message that crashes every consumer that reads it. | dead-letter-queue, message-queue | |
| `message-schemas` | short | Schema registries, and keeping producers and consumers compatible. | schema-evolution, message-queue | |
| `dual-writes` | short | Writing to the database and the queue separately, and how they drift apart. | transaction, message-queue | transactional-outbox |
| `transactional-outbox` | deep | Write the event in the same transaction as the data, and relay it later. | transaction, message-queue | dual-writes |
| `logical-replication` | short | Postgres decoding its WAL into a stream of row changes. | write-ahead-log | |
| `change-data-capture` | deep | Turning a database's own change log into events. Debezium and friends. | logical-replication, log-based-messaging | |
| `event-sourcing` | deep | Store the events, derive the current state from them. | log-based-messaging | |
| `cqrs` | short | Separate models for writes and for reads. | event-sourcing | |
| `background-jobs` | deep | Job queues on Postgres with SKIP LOCKED vs Redis vs a broker. | message-queue, explicit-locking | |
| `job-scheduling` | short | Cron jobs and delayed jobs that run once, even with several workers. | background-jobs | |

## Phase 11: Distributed systems I, replication and partitioning (skill 9)

**Why it's hard**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `distributed-system` | deep | Many machines acting as one, and the three new problems: partial failure, an unreliable network, no shared clock. | network-latency | |
| `fallacies-of-distributed-computing` | short | The eight assumptions everyone makes about networks, and why each is false. | distributed-system | |
| `failure-models` | short | Crash-stop, crash-recover, omission and Byzantine failures. | distributed-system | |
| `network-partitions` | short | Some machines can't reach others, and neither side knows why. | distributed-system | |
| `fault-injection` | deep | Breaking networks, disks and processes on purpose to see what the system does. netem, toxiproxy, Jepsen. | network-partitions, crash-testing | |

**Replication**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `replication` | deep | Keeping copies on several machines, for availability, lower latency and more reads. | distributed-system | partitioning |
| `leader-follower-replication` | deep | One node takes writes and ships its log to the others. | replication, write-ahead-log | leaderless-replication |
| `sync-vs-async-replication` | short | Wait for followers before confirming, or don't, and what each loses. | leader-follower-replication | |
| `replication-lag` | deep | Followers behind the leader: read-your-writes and monotonic reads. | sync-vs-async-replication | |
| `failover` | deep | Promoting a follower when the leader dies: split brain and lost writes. | leader-follower-replication | |
| `multi-leader-replication` | short | Several nodes take writes, and conflicts become normal. | replication | |
| `leaderless-replication` | deep | Dynamo-style: write to several nodes, read from several, fix up differences. | replication | leader-follower-replication |
| `quorums` | short | W + R > N, and why it's less of a guarantee than it looks. | leaderless-replication | |
| `conflict-resolution` | deep | Last write wins, version vectors, and merging. | multi-leader-replication, leaderless-replication | |
| `crdts` | deep | Data types that merge concurrent changes without coordinating. | conflict-resolution | |

**Partitioning**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `partitioning` | deep | Splitting data across machines so each holds a part. | distributed-system | replication |
| `range-vs-hash-partitioning` | short | Split by key ranges or by a hash of the key, and what each makes easy. | partitioning | |
| `consistent-hashing` | deep | Placing keys on a ring so adding a node moves only a few keys. | partitioning | |
| `rebalancing` | short | Moving partitions when nodes join or leave. | partitioning | |
| `hot-spots` | short | One key or partition getting most of the traffic. | partitioning | |
| `partitioned-secondary-indexes` | short | Local vs global secondary indexes when data is split. | partitioning, indexes | |

**Consistency and time**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `consistency-models` | deep | The ladder from eventual to linearizable: what each lets a reader see. | replication | isolation-levels |
| `eventual-consistency` | short | Stop writing and copies agree eventually. What it doesn't promise. | consistency-models | |
| `causal-consistency` | short | Everyone sees causes before their effects. | consistency-models | |
| `linearizability` | deep | The system acts like a single copy, and every operation happens at one instant. | consistency-models | serializable-snapshot-isolation |
| `linearizability-checking` | short | Checking a recorded history for linearizability. Knossos and Porcupine. | linearizability, history-checking | |
| `cap-theorem` | deep | What it actually says about partitions, and why most people quote it wrong. | linearizability, network-partitions | |
| `pacelc` | short | Even with no partition, you trade latency against consistency. | cap-theorem | |
| `clock-skew` | deep | Machine clocks drift and jump. NTP, and why timestamps can't order events safely. | distributed-system | |
| `lamport-clocks` | short | A counter that orders events by cause, not by wall time. | clock-skew | |
| `vector-clocks` | short | One counter per node, so you can tell "happened before" from "concurrent". | lamport-clocks | |
| `hybrid-logical-clocks` | short | Wall time plus a logical counter. | lamport-clocks, clock-skew | |

## Phase 12: Distributed systems II, consensus and coordination (skill 10)

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `failure-detection` | deep | Heartbeats and timeouts, phi accrual, and why you can't tell slow from dead. | distributed-system | |
| `gossip-protocols` | short | Spreading state by random peer-to-peer chatter. SWIM membership. | failure-detection | |
| `consensus` | deep | Getting nodes to agree on one value despite crashes. | failure-models | |
| `flp-impossibility` | short | No algorithm can guarantee consensus in a fully asynchronous system with even one crash. | consensus | |
| `replicated-state-machine` | deep | Same commands, same order, same state on every node. | consensus | |
| `leader-election` | deep | Picking one node to be in charge, and making sure there's never two. | failure-detection | |
| `raft` | deep | Consensus built to be understood: terms, elections, log replication and the safety rules. | replicated-state-machine, leader-election, leader-follower-replication | paxos |
| `raft-snapshots` | short | Compacting the log so it doesn't grow forever. | raft | |
| `raft-membership-changes` | short | Adding and removing nodes without two majorities. | raft | |
| `linearizable-reads` | short | Serving reads from a consensus group without returning stale data. ReadIndex and leases. | raft, linearizability | |
| `paxos` | deep | The original consensus algorithm, and Multi-Paxos. | consensus | raft |
| `chain-replication` | short | Writes go down a chain of nodes, reads come from the tail. | replication | raft |
| `byzantine-fault-tolerance` | short | Consensus when some nodes lie, and why most backends don't need it. | consensus | |
| `leases` | short | A lock that expires on its own. Safe only if clocks behave. | clock-skew | |
| `fencing-tokens` | short | A number that rises with every new lock holder, so an old holder can be refused. | leases | |
| `distributed-locks` | deep | Why locks across machines are hard, and the Redlock argument. | fencing-tokens | |
| `coordination-services` | short | ZooKeeper and etcd: what they're for and what they're not. | raft | |
| `two-phase-commit` | deep | Prepare then commit across machines, and what happens when the coordinator dies. | transaction, failure-detection | sagas |
| `sagas` | deep | A long operation as local steps, with a compensating step to undo each one. | two-phase-commit | two-phase-commit |
| `distributed-transactions` | deep | How Spanner and CockroachDB run transactions across shards, with consensus and clocks. | two-phase-commit, raft, clock-skew | |
| `deterministic-simulation-testing` | deep | Running a whole cluster in one deterministic process to replay any failure. FoundationDB, TigerBeetle. | fault-injection | |

## Phase 13: Reliability engineering (skill 11)

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `sli-slo-sla` | deep | What you measure, what you aim for, and what you promise. | latency-percentiles, availability-math | |
| `error-budgets` | short | The failure your SLO allows, spent on shipping. | sli-slo-sla | |
| `availability-math` | short | Nines, and how availability combines across dependencies in series and in parallel. | | |
| `failure-domains` | short | Things that fail together: a disk, a rack, a zone, a region. | | |
| `deadline-propagation` | short | Passing the remaining time budget down every call. | timeouts | |
| `retry-budgets` | short | Capping retries as a share of traffic, so they can't multiply load. | retries-with-backoff | |
| `circuit-breakers` | deep | Stop calling a dependency that's failing, and probe it before trusting it again. | timeouts | |
| `load-shedding` | deep | Rejecting some work on purpose to keep serving the rest. | queueing-theory, bounded-queues | |
| `admission-control` | short | Deciding at the door which requests get in, by priority. | load-shedding | |
| `bulkheads` | short | Separate pools per dependency, so one slow one can't take everything. | thread-pool | |
| `graceful-degradation` | short | Turning off the nice-to-have parts to keep the core working. | load-shedding | |
| `thundering-herd` | short | Many clients waking up and retrying at the same moment. | retries-with-backoff | cache-stampede |
| `cascading-failures` | deep | One overloaded part pushes load onto the next until everything falls over. | load-shedding | |
| `metastable-failures` | deep | The system stays down after the trigger is gone, held there by its own retries and queues. | retry-budgets, queueing-theory | cascading-failures |
| `cell-based-architecture` | deep | Splitting a service into independent copies to shrink the blast radius. | partitioning, failure-domains | |
| `chaos-engineering` | deep | Running failure experiments in production-like systems, with a hypothesis. | fault-injection | |
| `backups` | short | Logical vs physical backups, and point-in-time recovery. | write-ahead-log | |
| `disaster-recovery` | deep | RPO and RTO, and restore drills. A backup you haven't restored isn't a backup. | backups, replication | |
| `incident-response` | deep | Roles, communication, and mitigating first while you investigate. | | |
| `on-call` | short | Rotations, pages that deserve waking someone, and not burning out. | incident-response | |
| `runbooks` | short | Written steps for known problems. | incident-response | |
| `postmortems` | short | Blameless write-ups that fix the system, not the person. | incident-response | |

## Phase 14: Running it: containers, deploys, observability (skill 12)

**Containers and orchestration**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `linux-namespaces` | deep | Giving a process its own view of PIDs, network, mounts and users. | process | |
| `cgroups` | deep | Limiting and measuring a group of processes' CPU, memory and I/O. | process | |
| `overlayfs` | short | Stacking read-only layers under one writable layer. | filesystem | |
| `containers` | deep | Processes with namespaces, cgroups and a layered filesystem. Not little VMs. | linux-namespaces, cgroups, overlayfs | virtual-machines |
| `container-images` | short | The OCI image format: layers, manifests, registries. | containers | |
| `virtual-machines` | short | Hypervisors, and microVMs like Firecracker. | process | containers |
| `control-loops` | short | Compare desired state with actual state, act, repeat. | | |
| `kubernetes` | deep | Desired state stored in etcd, and controllers that make it real. | containers, control-loops | |
| `kubernetes-networking` | short | Pods, Services and how traffic reaches a pod. | kubernetes, load-balancing | |
| `probes` | short | Liveness, readiness and startup probes, and how wrong ones cause outages. | kubernetes, health-checks | |

**Shipping**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `infrastructure-as-code` | deep | Declaring infrastructure in files. Terraform's plan, state and drift. | control-loops | |
| `config-and-secrets` | short | Config in the environment, secrets kept out of code and logs. | | |
| `ci-cd` | short | Build, test and deploy on every merge. | | |
| `deployment-strategies` | deep | Rolling, blue-green and canary deploys, and rolling back. | load-balancing, health-checks, ci-cd | |
| `feature-flags` | short | Shipping code switched off, and turning it on separately. | | deployment-strategies |

**Observability**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `observability` | deep | Logs, metrics and traces: which question each one answers. | | |
| `structured-logging` | short | Logs as fields a machine can query, not sentences. | observability | |
| `metrics` | deep | Counters, gauges and histograms. Pull vs push. | observability, latency-percentiles | |
| `histograms` | short | Why you can't average percentiles, and how histograms fix it. | metrics | |
| `cardinality` | short | Why a user ID in a metric label breaks the metrics system. | metrics | |
| `distributed-tracing` | deep | Following one request through many services with spans and propagated context. | observability | |
| `opentelemetry` | short | The standard API and wire format for traces, metrics and logs. | distributed-tracing | |
| `continuous-profiling` | short | Profiling production all the time, cheaply. | profiling | |
| `alerting` | deep | Alert on what users feel, not on causes. SLO burn-rate alerts. | sli-slo-sla, metrics | |

## Phase 15: Security, authentication and authorization (skill 13)

**Who you are**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `threat-modeling` | deep | Listing what can go wrong before building: assets, attackers, trust boundaries. | | |
| `password-hashing` | deep | Slow, salted hashes: bcrypt, scrypt, Argon2. | cryptographic-hashes | |
| `cookies` | short | HttpOnly, Secure, SameSite, and what each stops. | http-semantics | |
| `sessions` | deep | A random ID in a cookie, and the session stored on the server. | cookies | jwt |
| `jwt` | deep | Signed tokens a server can check without a lookup, and the classic mistakes. | hmac, public-key-crypto | sessions |
| `oauth2` | deep | Letting an app act for a user without their password. The auth code flow with PKCE. | tls | |
| `oidc` | short | Logging in with OAuth2: the ID token. | oauth2, jwt | |
| `passkeys` | short | WebAuthn: logging in with a key pair instead of a password. | public-key-crypto | password-hashing |
| `mfa` | short | A second factor, and which kinds resist phishing. | password-hashing | |

**What you're allowed to do**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `authorization-models` | deep | RBAC, ABAC and relationship-based access: who can do what, and how to express it. | | |
| `zanzibar` | deep | Google's authorization system: relation tuples, the check API and consistent snapshots. | authorization-models, consistency-models | |
| `new-enemy-problem` | short | A permission change applied out of order lets the wrong person in. How zookies stop it. | zanzibar | |
| `multi-tenancy` | deep | Keeping customers' data apart: shared tables, schema per tenant, database per tenant. | authorization-models | |
| `row-level-security` | short | Postgres filtering rows per user inside the database. | multi-tenancy | |
| `audit-logging` | short | An append-only record of who did what, that holds up later. | structured-logging | |

**Attacks and defenses**

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `owasp-api-top-10` | short | The standard checklist of API security risks. | threat-modeling | |
| `bola` | deep | Broken object-level authorization: changing an ID in the URL to read someone else's data. | authorization-models | |
| `sql-injection` | short | User input run as SQL, and parameterized queries. | sql | |
| `ssrf` | deep | Tricking the server into calling internal addresses for you. | http-semantics | |
| `csrf` | short | Another site making the browser send an authenticated request. | cookies | |
| `cors` | deep | What CORS actually protects, and what it doesn't. | http-semantics | csrf |
| `secrets-management` | short | Vaults, KMS and rotating secrets. | config-and-secrets | |
| `envelope-encryption` | short | Encrypting data with a data key, and the data key with a master key. | symmetric-encryption, secrets-management | |
| `zero-trust` | short | No trusted network: every call proves who it's from. | mtls | |
| `supply-chain-security` | short | Dependencies you didn't write: lockfiles, SBOMs and signed builds. | threat-modeling | |

## Phase 16: Data systems (skill 14)

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `oltp-vs-olap` | deep | Many small transactions vs a few huge scans, and why one database rarely does both well. | transaction | |
| `column-storage` | deep | Storing each column together so scans read only what they need and compress well. | oltp-vs-olap, block-compression | |
| `vectorized-execution` | short | Processing a batch of values per operation instead of one row at a time. | column-storage | |
| `parquet` | short | The columnar file format: row groups, pages, encodings and statistics. | column-storage | |
| `data-warehouse` | short | A database built for analytics. | oltp-vs-olap | |
| `object-storage` | deep | S3's model: keys and objects, the consistency it promises, and the cost model. | http-semantics | filesystem |
| `open-table-formats` | deep | Iceberg and Delta: tables built from files on object storage, with snapshots and atomic commits. | parquet, object-storage | |
| `lakehouse` | short | Warehouse features on top of files in object storage. | open-table-formats, data-warehouse | |
| `etl-vs-elt` | short | Transform before loading or after. | data-warehouse | |
| `batch-processing` | deep | MapReduce and Spark: split the input, map, shuffle, reduce. | partitioning | stream-processing |
| `shuffle` | short | Moving data between machines so matching keys meet. The expensive step. | batch-processing | |
| `backfills` | short | Recomputing history after a bug or a new column. | batch-processing | |
| `stream-processing` | deep | Computing over events as they arrive, without end. | log-based-messaging | batch-processing |
| `event-time-vs-processing-time` | short | When it happened vs when you saw it. | stream-processing | |
| `windowing` | short | Tumbling, sliding and session windows. | event-time-vs-processing-time | |
| `watermarks` | deep | How a stream processor decides a window is complete. | event-time-vs-processing-time | |
| `late-data` | short | Events that arrive after their window closed. | watermarks | |
| `stateful-stream-processing` | deep | Keeping state inside a stream job and checkpointing it. How Flink does it. | stream-processing, checkpoints | |
| `dataflow-model` | short | One model for batch and streaming: what, where, when, how. | watermarks, windowing | |
| `lambda-vs-kappa` | short | Two pipelines (batch and stream) or one stream for everything. | batch-processing, stream-processing | |

## Phase 17: Putting it together: system design and durable execution (skill 15)

| id | depth | note | needs | compare |
|---|---|---|---|---|
| `system-design-method` | deep | Requirements, rough numbers, data model, API, then the bottlenecks. | backend-engineer, back-of-envelope-estimation | |
| `back-of-envelope-estimation` | deep | Rough math on traffic, storage and bandwidth before any diagram. | latency-numbers | |
| `monolith-vs-microservices` | deep | What splitting a system into services buys and what it costs. | distributed-system | |
| `service-mesh` | short | Sidecar proxies that handle retries, mTLS and telemetry for every service. | mtls, load-balancing | |
| `id-generation` | short | Unique IDs across machines: sequences, Snowflake IDs, UUIDv7. | primary-keys, clock-skew | |
| `fan-out` | short | Fan-out on write vs on read, like a timeline. | caching | |
| `distributed-rate-limiting` | short | Rate limits shared across many servers. | rate-limiting-algorithms, redis-internals | |
| `multi-region` | deep | Active-passive vs active-active across regions, and where the data lives. | replication, failover | |
| `realtime-sync` | deep | Keeping many clients in sync live: operational transforms vs CRDTs, and a server in the middle. | crdts, websockets | |
| `search-architecture` | short | Inverted indexes split across machines, and keeping them fed. | full-text-search, partitioning | |
| `durable-execution` | deep | Workflows that survive crashes by recording each step and replaying the history. Temporal, Restate, DBOS. | event-sourcing, idempotency, replicated-state-machine | sagas |
| `workflow-determinism` | short | Why workflow code has to make the same choices when it's replayed. | durable-execution | |
| `durable-timers` | short | Sleeping for a week inside a workflow, surviving restarts. | durable-execution | |
| `orchestration-vs-choreography` | short | One coordinator calls the steps vs services reacting to each other's events. | sagas | |

## Choices baked into this guess

1. **Phase 1 goes below the backend.** Postings for storage and
   infrastructure roles list storage fundamentals (block devices,
   filesystems, SSDs), and every storage build after phase 1 depends on
   `fsync` and `crash-consistency`.
2. **The crypto a reader needs for TLS sits in phase 3,** not in security.
   `cryptographic-hashes`, `hmac` and `public-key-crypto` are short
   concept nodes. Phase 15 builds on them.
3. **`delivery-guarantees` and `dead-letter-queue` live in phase 5,**
   because the webhook build needs them. Phase 10 builds on them instead
   of repeating them.
4. **`latency-percentiles` (short) is in phase 4 and `tail-latency` (deep)
   in phase 9.** The phase 4 build reports p99, but explaining why tails
   matter at scale belongs with the performance phase.
5. **`timeouts` is in phase 5 and `deadline-propagation` in phase 13.**
   One is a single call, the other is a whole request tree.
6. **Each isolation anomaly is its own node.** They are what interviews
   ask about, and the phase 8 build reproduces each one separately.
7. **Tools that a build depends on get a short node** (`strace`,
   `crash-testing`, `tun-tap`, `fuzzing`, `history-checking`), so the lab write-ups have
   something to link.

## Open questions for later phases

- **Some shorts may be too small.** `dirty-read`, `non-repeatable-read` and
  `phantom-read` might read better as one node. `cache-aside`,
  `write-through-cache` and `write-behind-cache` too. Decide when writing.
- **Some deeps may be two concepts.** `raft` (elections plus log
  replication), `kafka-architecture`, `postgres-architecture`.
- **Missing on purpose:** language-specific framework knowledge, frontend,
  mobile, ML. AI engineering lives in `ai-eng-graph`.
- **Possibly missing:** `search-engines` in depth, `graph-databases`,
  `time-series-databases`, `vector-search` (covered in ai-eng-graph),
  `webassembly-on-the-server`, `edge-compute`. Add them if a build step
  needs them.
