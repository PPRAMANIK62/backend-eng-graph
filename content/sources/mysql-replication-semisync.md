---
id: mysql-replication-semisync
title: "MySQL 8.4 Reference Manual, 19.4.10 Semisynchronous Replication"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/replication-semisync.html
kind: docs
primary: true
---

## Summary

MySQL's semisynchronous replication (MySQL 8.4): the source waits until
at least one replica has received and logged a transaction, not applied
it, then answers the client. Defines asynchronous, semisynchronous and
fully synchronous replication side by side, and says what happens on a
timeout. Opened with WebFetch because curl got an error page; quotes
are as WebFetch returned them.

## Key claims

- Async: a crash can lose commits no replica has. "With asynchronous replication, if the source crashes, transactions that it has committed might not have been transmitted to any replica." (overview)
- Fully synchronous: failover to any replica at any time. "Fully synchronous replication means failover from the source to any replica is possible at any time." (overview)
- Semisync: every commit has reached at least one replica. "Semisynchronous replication therefore guarantees that if the source crashes, all the transactions that it has committed have been transmitted to at least one replica." (overview)
- The replica acks after writing to its relay log and flushing it, before applying. "The replica acknowledges receipt of a transaction's events only after the events have been written to its relay log and flushed to disk." (overview)
- Default wait point: after the binary log sync, before the storage-engine commit (AFTER_SYNC). "By default, the source waits for replica acknowledgment of the transaction receipt after syncing the binary log to disk, but before committing the transaction to the storage engine." (overview)
- AFTER_COMMIT is the alternative and changes what clients on the source can see. "This setting affects the replication characteristics and the data that clients can see on the source." (overview)
- The cost is at least one round trip. "The amount of slowdown is at least the TCP/IP roundtrip time to send the commit to the replica and wait for the acknowledgment of receipt by the replica." (overview)
- Best for servers close together. "This means that semisynchronous replication works best for close servers communicating over fast networks, and worst for distant servers communicating over slow networks." (overview)
- On timeout it falls back to async, and returns when a replica catches up. "If a timeout occurs without any replica having acknowledged the transaction, the source reverts to asynchronous replication. When at least one semisynchronous replica catches up, the source returns to semisynchronous replication." (overview)
- After a crash and failover, throw the old source away. "With semisynchronous replication, if the source crashes and a failover to a replica is carried out, the failed source should not be reused as the replication source, and should be discarded." (overview)
- Why: it can hold transactions no replica acknowledged. "It could have transactions that were not acknowledged by any replica, which were therefore not committed before the failover." (overview)

## Visuals worth redrawing

None.

## My notes

- The timeout variable's name and default weren't on this page as
  fetched; left out of the articles.
