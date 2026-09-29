---
id: postgres-warm-standby
title: "PostgreSQL documentation, 26.2. Log-Shipping Standby Servers"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/warm-standby.html
kind: docs
primary: true
---

## Summary

The manual's section on standby servers (read at version 18): how a
standby replays the primary's WAL, file-based shipping vs streaming,
setting one up from a base backup, keeping enough WAL around
(replication slots), cascading, synchronous replication and its
`synchronous_commit` levels, and how to measure how far behind a
standby is.

## Key claims

- A standby is a server in continuous recovery, reading the primary's WAL. "The primary server operates in continuous archiving mode, while each standby server operates in continuous recovery mode, reading the WAL files from the primary." (26.2)
- File-based shipping moves one WAL segment at a time. "PostgreSQL implements file-based log shipping by transferring WAL records one file (WAL segment) at a time." (26.2)
- Log shipping is asynchronous: records are shipped after commit, so unshipped transactions can be lost. "It should be noted that log shipping is asynchronous, i.e., the WAL records are shipped after transaction commit." (26.2)
- Same hardware architecture needed. "In any case the hardware architecture must be the same — shipping from, say, a 32-bit to a 64-bit system will not work." (26.2.1)
- Different major versions can't ship to each other. "In general, log shipping between servers running different major PostgreSQL release levels is not possible." (26.2.1)
- Minor upgrades: standbys first. "When updating to a new minor release, the safest policy is to update the standby servers first — a new minor release is more likely to be able to read WAL files from a previous minor release than vice versa." (26.2.1)
- In standby mode the server keeps applying WAL from an archive or over TCP. "In standby mode, the server continuously applies WAL received from the primary server." (26.2.2)
- Promotion ends standby mode. "Standby mode is exited and the server switches to normal operation when pg_ctl promote is run, or pg_promote() is called." (26.2.2)
- A new standby starts from a base backup. "Take a base backup as described in Section 25.3.2 to bootstrap the standby server." (26.2.3)
- Streaming: the primary streams WAL records as they're generated. "The standby connects to the primary, which streams WAL records to the standby as they're generated, without waiting for the WAL file to be filled." (26.2.5)
- Streaming is async by default, with a small delay, typically under a second. "This delay is however much smaller than with file-based log shipping, typically under one second assuming the standby is powerful enough to keep up with the load." (26.2.5)
- If the primary recycles WAL before the standby gets it, the standby must be rebuilt. "If this occurs, the standby will need to be reinitialized from a new base backup." (26.2.5)
- Ways to avoid that: wal_keep_size, a replication slot, or a WAL archive the standby can read. "You can avoid this by setting wal_keep_size to a value large enough to ensure that WAL segments are not recycled too early, or by configuring a replication slot for the standby." (26.2.5)
- A walreceiver on the standby talks to a walsender on the primary. "you will see a walreceiver in the standby, and a corresponding walsender process in the primary." (26.2.5)
- The WAL stream exposes privileged data. "It is very important that the access privileges for replication be set up so that only trusted users can read the WAL stream, because it is easy to extract privileged information from it." (26.2.5.1)
- Lag is measured by comparing WAL positions. "You can calculate this lag by comparing the current WAL write location on the primary with the last WAL location received by the standby." (26.2.5.2)
- Which gap points where: primary load, network or standby load, replay speed. "Large differences between pg_current_wal_lsn and the view's sent_lsn field might indicate that the primary server is under heavy load, while differences between sent_lsn and pg_last_wal_receive_lsn on the standby might indicate network delay, or that the standby is under heavy load." (26.2.5.2)
- Replay behind receive means WAL arrives faster than it can be replayed. "A large difference between pg_last_wal_replay_lsn and the view's flushed_lsn indicates that WAL is being received faster than it can be replayed." (26.2.5.2)
- Replication slots keep WAL until every standby has it. "Replication slots provide an automated way to ensure that the primary server does not remove WAL segments until they have been received by all standbys" (26.2.6)
- Slots can fill the disk. "Beware that replication slots can cause the server to retain so many WAL segments that they fill up the space allocated for pg_wal." (26.2.6)
- max_slot_wal_keep_size caps it. "max_slot_wal_keep_size can be used to limit the size of WAL files retained by replication slots." (26.2.6)
- Cascading: a standby can relay WAL to other standbys; this is async only. "Cascading replication is currently asynchronous." (26.2.7)
- Why cascade: fewer connections to the primary and less traffic between sites. "This can be used to reduce the number of direct connections to the primary and also to minimize inter-site bandwidth overheads." (26.2.7)
- The commit record is on the primary's disk before the WAL is sent; the standby reports each batch it writes to its own disk. "After a commit record has been written to disk on the primary, the WAL record is then sent to the standby. The standby sends reply messages each time a new batch of WAL data is written to disk, unless wal_receiver_status_interval is set to zero on the standby." (26.2.8.1)
- Async loss is proportional to the delay. "The amount of data loss is proportional to the replication delay at the time of failover." (26.2.8)
- Synchronous commit waits for the WAL to be on disk on both servers. "each commit of a write transaction will wait until confirmation is received that the commit has been written to the write-ahead log on disk of both the primary and standby server." (26.2.8)
- The minimum extra wait is one round trip. "The minimum wait time is the round-trip time between primary and standby." (26.2.8)
- Read-only transactions and rollbacks don't wait. "Read-only transactions and transaction rollbacks need not wait for replies from standby servers." (26.2.8)
- remote_write waits only for the standby's OS write, not its flush. "Setting synchronous_commit to remote_write will cause each commit to wait for confirmation that the standby has received the commit record and written it out to its own operating system, but not for the data to be flushed to disk on the standby." (26.2.8.1)
- So remote_write survives a Postgres crash on the standby but not an OS crash. "the standby could lose the data in the event of an operating system crash, though not a PostgreSQL crash." (26.2.8.1)
- remote_apply waits until the standby has replayed the transaction, so reads there see it. "Setting synchronous_commit to remote_apply will cause each commit to wait until the current synchronous standbys report that they have replayed the transaction, making it visible to user queries." (26.2.8.1)
- With remote_apply you get causal consistency across load-balanced reads. "In simple cases, this allows for load balancing with causal consistency." (26.2.8.1)
- synchronous_commit can be set per user, database or transaction. "in order to control the durability guarantee on a per-transaction basis." (26.2.8.1)
- FIRST picks sync standbys by priority; ANY waits for any N of the list (quorum). "The method ANY specifies a quorum-based synchronous replication and makes transaction commits wait until their WAL records are replicated to at least the requested number of synchronous standbys in the list." (26.2.8.2)
- Locks stay held while waiting. "Waiting doesn't utilize system resources, but transaction locks continue to be held until the transfer is confirmed." (26.2.8.3)
- Example of mixing levels: 10% important changes, 90% chat messages. "For example, an application workload might consist of: 10% of changes are important customer details, while 90% of changes are less important data that the business can more easily survive if it is lost, such as chat messages between users." (26.2.8.3)
- If a sync standby crashes, commits can wait forever. "Such transaction commits may never be completed if any one of the synchronous standbys should crash." (26.2.8.4)
- A new standby first catches up and only then can be synchronous. "The standby is only able to become a synchronous standby once it has reached streaming state." (26.2.8.4)
- A primary restart marks waiting transactions committed even if no standby got them; the guarantee is only about the acknowledgement. "The guarantee we offer is that the application will not receive explicit acknowledgment of the successful commit of a transaction until the WAL data is known to be safely received by all the synchronous standbys." (26.2.8.4)

## Visuals worth redrawing

- The four WAL positions (current on primary, sent, received/flushed on
  standby, replayed) as marks on one log. Our own drawing.

## My notes

- "2-safe" and "group-1-safe" terms in 26.2.8 come from the literature;
  not used in the articles.
