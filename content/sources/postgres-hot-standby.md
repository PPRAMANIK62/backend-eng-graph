---
id: postgres-hot-standby
title: "PostgreSQL documentation, 26.4. Hot Standby"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/hot-standby.html
kind: docs
primary: true
---

## Summary

The manual's section on running read-only queries on a standby (read
at version 18). What's allowed, why the standby lags and is "eventually
consistent", and the conflicts between standby queries and WAL replay,
with the settings that trade replay delay against cancelled queries.

## Key claims

- Hot standby connections are strictly read-only. "All such connections are strictly read-only; not even temporary tables may be written." (26.4.1)
- Row locks and sequence updates are refused on a standby. "SELECT ... FOR SHARE | UPDATE, because row locks cannot be taken without updating the underlying data files." / "Sequence updates: nextval(), setval()" (26.4.1, list of actions that produce errors)
- There's a measurable delay, so the same query can differ between primary and standby. "Running the same query nearly simultaneously on both primary and standby might therefore return differing results." (26.4.1)
- The manual calls the standby eventually consistent. "We say that data on the standby is eventually consistent with the primary." (26.4.1)
- A transaction becomes visible on the standby when its commit record is replayed. "Once the commit record for a transaction is replayed on the standby, the changes made by that transaction will be visible to any new snapshots taken on the standby." (26.4.1)
- The standby can't refuse a change that already happened on the primary. "However, on the standby there is no choice: the WAL-logged action already occurred on the primary so the standby must not fail to apply it." (26.4.2)
- Example: a DROP TABLE on the primary reaches a standby where the table is being queried; the standby must delay replay or cancel the query. "The standby server must either delay application of the WAL records (and everything after them, too) or else cancel the conflicting query so that the DROP TABLE can be applied." (26.4.2)
- max_standby_archive_delay and max_standby_streaming_delay bound how long replay waits. "Conflicting queries will be canceled once it has taken longer than the relevant delay setting to apply any newly-received WAL data." (26.4.2)
- For HA standbys keep the delay short; for reporting standbys a long one. "In a standby server that exists primarily for high availability, it's best to set the delay parameters relatively short, so that the server cannot fall far behind the primary due to delays caused by standby queries." (26.4.2)
- A long query holding back replay hides recent changes from other sessions. "Keep in mind however that a long-running query could cause other sessions on the standby server to not see recent changes on the primary, if it delays application of WAL records." (26.4.2)
- The most common conflict is early cleanup of row versions a standby query can still see. "The most common reason for conflict between standby queries and WAL replay is “early cleanup”." (26.4.2)
- hot_standby_feedback stops those conflicts but can bloat tables on the primary. "If you do this, you should note that this will delay cleanup of dead rows on the primary, which may result in undesirable table bloat." (26.4.2)
- A cancelled query may succeed on retry. "Canceled queries may be retried immediately (after beginning a new transaction, of course)." (26.4.2)

## Visuals worth redrawing

None.

## My notes

None.
