---
id: db-connection-pooling
title: Database connection pooling
depth: short
phase: 6
note: >-
  Why Postgres connections are expensive, and what PgBouncer's pooling
  modes break.
needs: [connection-pooling, postgres-architecture]
leads_to: [advisory-locks]
compare_with: []
---

# Database connection pooling

Every Postgres connection is a whole server process, and a busy system
can end up with far more of them than the database handles well. A
pooler like PgBouncer in front of Postgres shares a few server
connections among many clients. Its most useful mode quietly breaks
some Postgres features, and you need to know which.

## Why Postgres connections are expensive

Postgres starts one backend process per connection (see
[[postgres-architecture]]). Opening one costs a [[tls|TLS]] handshake, network
round trips and the work of starting the backend, which is why apps
keep connections open in a pool (see [[connection-pooling]]).

The surprising part is what open connections cost. Andres Freund, a
Postgres developer, measured this in 2020 on a two-socket Xeon
workstation running Linux 5.8:

- **Memory is less of a problem than people think.** With the right
  settings, [[huge-pages]] above all, each connection's memory overhead
  was under 2 MiB in many workloads. It grows if a long-lived connection
  touches many tables, because each backend caches catalog data.
- **Idle connections slow down the busy ones.** Every transaction
  needs a snapshot, a record of which other transactions' changes it
  may see (see [[mvcc]]). Building one got slower with every
  established connection, even idle ones. In his test, one active
  connection ran more than twice as slow once enough idle connections
  sat beside it. That was the main limit, and his fixes for it
  went into Postgres 14.
- **Context switches.** Every query wakes a backend process, and a busy
  server keeps switching between them (see [[context-switch]]).

And connections sit idle most of the time, while the network and the
app do their part between queries. A fleet of app servers, each with a
pool of 10, easily keeps hundreds of mostly idle connections open.

A high `max_connections` on its own costs little. Established
connections are what hurt.

## Session, transaction and statement pooling

Apps connect to PgBouncer as if it were Postgres. It holds a small set
of real server connections and hands them out; a client connection to
PgBouncer costs about 2 kB. The pool mode decides how often a server
connection changes hands:

- **Session pooling** (the default). A client gets one server
  connection for as long as it stays connected. Everything works, but
  you need as many server connections as connected clients, so it saves
  only the cost of opening them.
- **Transaction pooling.** A client gets a server connection only for
  the length of one transaction. When the transaction ends, the
  connection goes back to the pool. Hundreds of mostly idle clients can
  share a few dozen server connections.
- **Statement pooling.** Like transaction pooling, but transactions
  with more than one statement aren't allowed.

![Two timelines with three clients and two server connections. Session pooling: client A holds server connection 1 and client B holds server connection 2 for their whole sessions, idle gaps included, and client C waits. Transaction pooling: transactions from A, B and C take turns on the two server connections, and each connection is handed to whoever has the next transaction.](img/db-connection-pooling-modes.svg)

*Session pooling ties a server connection to a client; transaction pooling ties it to one transaction.*

Transaction pooling is the mode that actually cuts server connections.

## What transaction pooling breaks

Postgres keeps some state per connection, the *session*. Under
transaction pooling, your next transaction may run on a different
server connection, so anything that relies on session state is either
missing or left behind for the next client. The mode breaks client
expectations by design. These never work in transaction mode:

- `SET` and `RESET` of session settings (a handful of settings like
  `client_encoding`, `TimeZone` and `application_name` are tracked for
  you)
- `LISTEN`
- cursors declared `WITH HOLD`
- SQL-level `PREPARE` and `DEALLOCATE`
- temporary tables that outlive a transaction (`ON COMMIT PRESERVE ROWS`
  or `DELETE ROWS`)
- `LOAD`
- session-level [[advisory-locks]]

Transaction-scoped things still work: `NOTIFY`, ordinary cursors,
`ON COMMIT DROP` temp tables.

**Prepared statements are the one that changed.** They come in two
kinds: SQL `PREPARE`, and the protocol-level kind that client libraries
send. PgBouncer 1.21 added support for the protocol-level kind in
transaction mode: it gives each
distinct query its own internal name and prepares it again on whichever
server connection the client lands on. Clients preparing the same query
share it, so with a pool of 20 server connections and 100 clients, the
query is parsed only 20 times. It's controlled by
`max_prepared_statements`, which became 200 by default in 1.24.

## Where it gets tricky

**Stale prepared statements after a migration.** Because clients share
server-side prepared statements, changing a table's columns can make
Postgres reject a shared statement with "cached plan must not change
result type". Running `RECONNECT` on PgBouncer's admin console after
the migration clears it.

**Pools stack.** Your app has its own pool, and PgBouncer keeps one per
user and database pair (`default_pool_size`, 20 by default). Keep
Postgres's `max_connections` a little above the server connections
PgBouncer opens, so admin and monitoring connections still fit.

**Postgres chose not to build this in.** The project left pooling
outside the server on purpose: no one design suits every setup, and a
pooler on another machine can perform better. Freund argues the real
fix is a different connection model, a few processes serving many
connections, and calls it a huge project.

## What this means when you build

- Count your connections across the whole fleet: app instances times
  pool size.
- Put PgBouncer in transaction mode in front of Postgres once that
  number gets into the hundreds, and keep the real server connections
  close to what the database can run at once.
- Before switching, check your code and libraries for session features:
  `SET`, `LISTEN`, session advisory locks, `WITH HOLD` cursors,
  long-lived temp tables.

## Further reading

- [PgBouncer features](https://www.pgbouncer.org/features.html), PgBouncer authors, 1.26. The three pool modes and the table of what breaks in each.
- [PgBouncer configuration](https://www.pgbouncer.org/config.html), PgBouncer authors, 1.26. Pool sizes, `pool_mode`, and how prepared statements work in transaction mode.
- [PgBouncer changelog](https://www.pgbouncer.org/changelog.html), PgBouncer authors. When prepared statement support arrived and became the default.
- [Analyzing the Limits of Connection Scalability in Postgres](https://techcommunity.microsoft.com/blog/adforpostgresql/analyzing-the-limits-of-connection-scalability-in-postgres/1757266), Andres Freund, Microsoft, 2020. Measurements of what connections really cost: memory, snapshots, context switches.
- [Number Of Database Connections](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections), PostgreSQL wiki. Why fewer connections can mean more throughput, and why Postgres has no built-in pooler.
