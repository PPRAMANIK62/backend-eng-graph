---
id: postgres-warm-standby-failover
title: "PostgreSQL documentation, 26.3. Failover"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/warm-standby-failover.html
kind: docs
primary: true
---

## Summary

The PostgreSQL 18 manual's short section on failover from a primary to
a log-shipping standby. It names the split-brain risk and STONITH, says
PostgreSQL itself does no failure detection, and describes the
degenerate state right after failover.

## Key claims

- After failover the old primary has to be told it's no longer primary. "you must have a mechanism for informing the old primary that it is no longer the primary." (26.3)
- STONITH, and what happens without it. "This is sometimes known as STONITH (Shoot The Other Node In The Head), which is necessary to avoid situations where both systems think they are the primary, which will lead to confusion and ultimately data loss." (26.3)
- A third machine can help, with care. "It is also possible to use a third system (called a witness server) to prevent some cases of inappropriate failover" (26.3)
- PostgreSQL doesn't detect failure itself. "PostgreSQL does not provide the system software required to identify a failure on the primary and notify the standby database server." (26.3)
- Right after failover there's only one server. "Once failover to the standby occurs, there is only a single server in operation. This is known as a degenerate state." (26.3)
- pg_rewind speeds up turning the old primary into a standby. "The pg_rewind utility can be used to speed up this process on large clusters." (26.3)
- Planned switchovers test the failover path. "This also serves as a test of the failover mechanism to ensure that it will really work when you need it." (26.3)
- How to promote. "To trigger failover of a log-shipping standby server, run pg_ctl promote or call pg_promote()." (26.3)
- Planned switchovers give each machine a maintenance window. "Regular switching from primary to standby is useful, since it allows regular downtime on each system for maintenance." (26.3)

## Visuals worth redrawing

None.

## My notes

- Detection and fencing are left to outside tools; none opened for this
  note. The setup side is in postgres-warm-standby (26.2).
