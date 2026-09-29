---
id: pgbouncer-features
title: PgBouncer features
author: PgBouncer authors
url: https://www.pgbouncer.org/features.html
kind: docs
primary: true
---

## Summary

PgBouncer's three pool modes and the table of which Postgres features
survive each one (site for PgBouncer 1.26).

## Key claims

- Session pooling gives a client one server connection for its whole session and supports everything. "This mode supports all PostgreSQL features." (Session pooling)
- Transaction pooling assigns a server connection only for a transaction. "A server connection is assigned to a client only during a transaction." (Transaction pooling)
- It breaks session features unless the application cooperates. "This mode breaks a few session-based features of PostgreSQL." (Transaction pooling)
- Statement pooling disallows multi-statement transactions. "Multi-statement transactions are disallowed." (Statement pooling)
- About 2 kB per client connection. "Low memory requirements (2 kB per connection by default)." (feature list)
- Transaction pooling breaks client expectations by design. "“transaction” pooling breaks client expectations of the server by design" (SQL feature map)
- Never in transaction mode: SET/RESET, LISTEN, WITH HOLD cursors, PREPARE/DEALLOCATE, PRESERVE/DELETE ROWS temp tables, LOAD, session-level advisory locks. (SQL feature map table)
- Work in transaction mode: startup parameters, NOTIFY, WITHOUT HOLD cursors, ON COMMIT DROP temp tables, and protocol-level prepared plans once max_prepared_statements is non-zero. (SQL feature map table and footnote 2)
- Startup parameters it tracks: client_encoding, DateStyle, IntervalStyle, Timezone, standard_conforming_strings, application_name. (footnote 1)

## Visuals worth redrawing

- Clients, pool and server connections under session vs transaction
  pooling.

## My notes

None.
