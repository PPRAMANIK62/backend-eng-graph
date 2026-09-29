---
id: gitlab-database-outage-2017
title: GitLab.com database outage postmortem
author: GitLab
url: https://about.gitlab.com/blog/2017/02/10/postmortem-of-database-outage-of-january-31/
kind: blog
primary: true
---

## Summary

GitLab's public postmortem of its 2017 GitLab.com database outage. An
engineer fixing broken replication wiped the data directory on the
primary instead of the secondary. Of five backup and recovery methods,
none worked as expected: pg_dump backups had been failing silently, disk
snapshots weren't enabled for the database, and the only usable copy was
a six-hour-old LVM snapshot made for staging, which took about 18 hours
to copy back.

## Key claims

- Some production data was lost for good. "We also lost some production data that we were eventually unable to recover." (introduction)
- Roughly 5,000 projects, 5,000 comments and 700 new accounts were affected. "Our best estimate is that it affected roughly 5,000 projects, 5,000 comments and 700 new user accounts." (introduction)
- Setup: one primary, one hot-standby secondary used only for failover. "GitLab.com currently uses a single primary and a single secondary in hot-standby mode." (Database setup)
- Replication broke because the primary removed WAL the secondary still needed, with no WAL archiving. "The replication failed as WAL segments needed by the secondary were already removed from the primary." (Timeline)
- The wipe ran on the primary by mistake; about 300 GB gone in a second or two. "The engineer terminated the process a second or two after noticing their mistake, but at this point around 300 GB of data had already been removed." (Timeline)
- Finding and using backups failed completely. "Unfortunately the process of both finding and using backups failed completely." (Timeline)
- Replication was for failover, not disaster recovery. "Replication between PostgreSQL hosts, primarily used for failover purposes and not for disaster recovery." (Broken recovery procedures)
- The pg_dump backups weren't there: the S3 bucket was empty. "The S3 bucket was empty, and there was no recent backup to be found anywhere." (Database backups using pg_dump)
- Cause: pg_dump 9.2 against a 9.6 server errored out. "A difference in major versions results in pg_dump producing an error, terminating the backup procedure." (Database backups using pg_dump)
- Failure emails were rejected (no DMARC), so nobody knew. "This means we were never aware of the backups failing, until it was too late." (Database backups using pg_dump)
- Disk snapshots weren't enabled for database servers. "these snapshots were not enabled for any of the database servers as we assumed that our other backup procedures were sufficient enough." (Azure disk snapshots)
- They restored from an LVM snapshot about 6 hours old, rather than lose almost 24 hours. "To recover GitLab.com we decided to use the LVM snapshot created 6 hours before the outage, as it was our only option to reduce data loss as much as possible (the alternative was to lose almost 24 hours of data)." (Recovering GitLab.com)
- Copying from staging took about 18 hours on throttled disks. "Copying the data from the staging to the production host took around 18 hours." (Recovering GitLab.com)
- Nobody owned testing the backups. "Because there was no ownership, as a result nobody was responsible for testing this procedure." (Root cause analysis, problem 2, why 8)
- Fixes include monitoring backups and automated testing of restores. "Automated testing of recovering PostgreSQL database backups (#1102)" (Improving recovery procedures)
- (For disaster-recovery.) The LVM snapshot was taken by hand hours earlier; the automatic one ran daily. "prior to starting this work, our engineer took an LVM snapshot of the production database and loaded this into the staging environment." / "This procedure normally happens automatically once every 24 hours (at 01:00 UTC), but they wanted a more up to date copy of the database." (Timeline)
- The load increase that started it. "GitLab.com starts experiencing an increase in database load due to what we suspect was spam." (Timeline)

## Visuals worth redrawing

None.

## My notes

- Title shortened here: the real title names the day of the outage, and this folder keeps no calendar dates.
- A good worked case for RPO (planned 24 hours, actual about 6 by luck) and RTO (about 18 hours of copying alone).
