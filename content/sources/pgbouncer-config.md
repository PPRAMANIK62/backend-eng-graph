---
id: pgbouncer-config
title: PgBouncer configuration
author: PgBouncer authors
url: https://www.pgbouncer.org/config.html
kind: docs
primary: true
---

## Summary

PgBouncer's settings reference (1.26). Used for pool mode, pool sizes,
reset query and how prepared statements work in transaction mode.

## Key claims

- pool_mode default is session. "Server is released back to pool after client disconnects. Default." (pool_mode)
- Transaction mode releases the server when the transaction finishes. "Server is released back to pool after transaction finishes." (pool_mode)
- max_client_conn default 100. (max_client_conn)
- default_pool_size is per user/database pair, default 20. "The maximum number of server connections to allow per user/database pair." (default_pool_size)
- max_prepared_statements: PgBouncer tracks named prepared statements in transaction and statement mode. "When this is set to a non-zero value PgBouncer tracks protocol-level named prepared statements related commands sent by the client in transaction and statement pooling mode." (max_prepared_statements)
- It re-prepares on whichever server connection the client lands on. "PgBouncer transparently prepares the statement before executing it." (max_prepared_statements)
- Clients preparing the same query share one server-side statement; with pool_size 20 and 100 clients it's parsed 20 times. "then the query is prepared (and thus parsed) only 20 times on the PostgreSQL server." (max_prepared_statements)
- Downside: after a schema change, "cached plan must not change result type"; RECONNECT fixes it. "One of the most common ways of running into this issue is during a DDL migration where you add a new column or change a column type on an existing table." (max_prepared_statements)
- max_prepared_statements default 200. (max_prepared_statements, Default)
- server_reset_query DISCARD ALL cleans session state between clients, and isn't used in transaction mode. "When transaction pooling is used, the server_reset_query is not used, because in that mode, clients must not use any session-based features" (server_reset_query)

## Visuals worth redrawing

None.

## My notes

None.
