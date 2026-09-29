---
id: postgres-monitoring-stats
title: "PostgreSQL documentation, 27.2 The Cumulative Statistics System"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/monitoring-stats.html
kind: docs
primary: true
---

## Summary

The manual's page on the statistics views (read at version 18). Used
here for pg_stat_activity (the session states and the columns that
show how old a transaction is and what it holds back) and for the lag
columns of pg_stat_replication.

## Key claims

- The "idle in transaction" state. "idle in transaction: The backend is in a transaction, but is not currently executing a query." (pg_stat_activity, state)
- And its aborted form. "idle in transaction (aborted): This state is similar to idle in transaction, except one of the statements in the transaction caused an error." (pg_stat_activity, state)
- xact_start is when the current transaction began. "Time when this process' current transaction was started, or null if no transaction is active." (pg_stat_activity, xact_start)
- backend_xmin is the session's xmin horizon. "The current backend's xmin horizon." (pg_stat_activity, backend_xmin)
- pg_stat_replication has three lag columns; write_lag measures up to the standby's write. "Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written it (but not yet flushed it or applied it)." (27.2.4, pg_stat_replication, write_lag)
- replay_lag measures up to the standby's replay. "Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written, flushed and applied it." (27.2.4, pg_stat_replication, replay_lag)
- For an async standby, replay_lag approximates how long until a commit is visible there. "For an asynchronous standby, the replay_lag column approximates the delay before recent transactions became visible to queries." (27.2.4)
- When everything is caught up and idle, the lag columns go NULL after a while. "If the standby server has entirely caught up with the sending server and there is no more WAL activity, the most recently measured lag times will continue to be displayed for a short time and then show NULL." (27.2.4)

## Visuals worth redrawing

None.

## My notes

None.
