---
id: postgres-architecture
title: Postgres architecture
depth: short
phase: 6
note: >-
  The moving parts at a glance: a process per connection, shared
  buffers, the WAL writer, autovacuum.
needs: [process]
leads_to: [db-connection-pooling]
compare_with: [sqlite]
---

# Postgres architecture at a glance

A running Postgres server is a family of operating system processes
that share one block of memory. Every client connection gets its own
process, and a handful of background processes write data to disk,
clean up old rows and keep the rest running. You don't need the
details to write queries, but this shape explains why connections are
expensive, where memory goes, and what those `postgres` processes in
`ps` are doing.

## One process per connection

When Postgres starts, the first process is the **postmaster**. It
listens on the TCP port and starts every other process.

When a client connects, the postmaster starts a new **backend**
[[process]] just for that connection. From then on the client talks
only to its backend: the backend parses each query, plans it, runs it
and sends the rows back. So 200 open connections means 200 backend processes on the server.

This is the "process per user" model. It's the
database version of [[thread-per-connection]], with processes instead
of threads. Separate processes isolate sessions from each other,
so a problem in one session is less likely to spread. But hundreds of them cost memory
and [[context-switch|context switches]], which is why
[[db-connection-pooling]] exists.

## Shared memory and shared buffers

All the processes share one region of memory. The largest part of it
is **shared buffers**: 8 kB pages of tables and indexes mirrored from
the data files, Postgres's [[buffer-pool]]. A page that's been changed
in memory is *dirty* until it's written back to its file.

Shared memory also holds WAL records on their way to disk, and other
shared state the processes use to coordinate.

`shared_buffers` sets the size. The default is usually 128 MB, which is
small. On a dedicated server with at least 1 GB of RAM, a reasonable
start is 25% of memory, and more than 40% is unlikely to help,
because Postgres also relies on the operating system's own
[[page-cache]].

## The background processes

Alongside the backends, a set of helper processes each do one job:

- **WAL writer** writes WAL records from shared memory to the WAL files
  on disk (see [[write-ahead-log]]).
- **Background writer** writes dirty pages from shared buffers to the
  data files a little at a time, so writing doesn't come in big bursts.
- **Checkpointer** runs [[checkpoints]].
- **Autovacuum launcher and workers.** The launcher is always there
  (unless autovacuum is turned off) and starts workers that run
  [[vacuum]] and `ANALYZE` on tables that need it.
- **Startup process** replays WAL after a crash, and on a replica
  (see [[crash-recovery]]).
- **WAL archiver, receiver and summarizer** handle backups and
  [[replication]] when they're enabled.
- **Logger** writes the server log, if enabled.
- **Background workers** run parallel query and [[logical-replication]],
  and extensions can add their own.
- **I/O workers**, new in Postgres 18. Postgres 18 added an asynchronous
  I/O system that lets a backend queue several reads at once. With the
  default `io_method = worker`, a small pool of I/O worker processes
  (3 by default) does the reading. It can use [[io-uring]] instead if
  Postgres was built with support for it.

![A Postgres server as boxes. Clients on the left connect to the postmaster, which starts one backend per client. The backends and the background processes (WAL writer, background writer, checkpointer, autovacuum, I/O workers) all attach to one shared memory area holding shared buffers and WAL buffers. Below, on disk: the data files, written by the background writer and checkpointer, and the WAL files, written by the WAL writer.](img/postgres-architecture-processes.svg)

*The main processes of one Postgres 18 instance and the shared memory they all use.*

The whole group, one postmaster with its backends, helpers and shared
memory, is an **instance**. One instance manages one database cluster
with all its databases.

## Where it gets tricky

**Query memory is on top of shared buffers.** Sorts and hashes are
capped by `work_mem` (4 MB by default). The cap is per sort or hash, not per query, and each
connection can run several at once, so total use can be many times
`work_mem` times the number of connections.

**Names that look alike.** A *backend* serves a client. A *background
worker* runs parallel query or extension code. The *background writer*
flushes dirty pages. They're easy to mix up.

**Threads might come one day.** In 2023 Postgres developers debated
moving from processes to threads, citing the cost of switching between
processes when there are many connections. Tom Lane predicted a
disaster, with far too much code that would break; the server has
about 2,000 global variables that assume one session per process.
As of Postgres 18 it's still one process per
connection.

## What this means when you build

- Treat connections as expensive. Keep their number bounded with a
  pool.
- Set `shared_buffers` deliberately; the default is for tiny machines.
- Keep `work_mem` modest when you have many connections.
- Don't turn off autovacuum. The next phases explain what it's cleaning
  up.

## Further reading

- [Glossary](https://www.postgresql.org/docs/current/glossary.html), PostgreSQL docs, version 18. One-paragraph definitions of every process, the instance and shared memory.
- [51.2. How Connections Are Established](https://www.postgresql.org/docs/current/connect-estab.html), PostgreSQL docs, version 18. The process-per-user model and the postmaster.
- [19.4. Resource Consumption](https://www.postgresql.org/docs/current/runtime-config-resource.html), PostgreSQL docs, version 18. `shared_buffers`, `work_mem` and the new `io_method` setting.
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/), PostgreSQL Global Development Group, 2025. The asynchronous I/O subsystem.
- [PostgreSQL reconsiders its process-based model](https://lwn.net/Articles/934940/), Jonathan Corbet, LWN, 2023. The debate about moving Postgres to threads, and why it's hard.
