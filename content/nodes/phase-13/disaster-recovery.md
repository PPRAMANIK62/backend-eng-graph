---
id: disaster-recovery
title: Disaster recovery
depth: deep
phase: 13
note: >-
  RPO and RTO, and restore drills. A backup you haven't restored isn't a
  backup.
needs: [backups, replication]
leads_to: [multi-region]
compare_with: [failover]
---

# Disaster recovery

Disaster recovery is how you get a whole service and its data back
after something takes out far more than one server: a region lost, a
database wiped, an attacker deleting data. You plan it around two
numbers, how much data you can afford to lose and how long you can
afford to be down. And you only know you can recover by actually
restoring.

## Two numbers: how much data, how much time

Picture the moment disaster strikes on a timeline. Two gaps matter.

![Timeline with three marks: the last recovery point on the left, the disaster in the middle, and service restored on the right. The gap from the last recovery point to the disaster is the data you lose, bounded by the RPO. The gap from the disaster to service restored is the downtime, bounded by the RTO, and it includes noticing the problem and deciding to invoke the plan, not just the restore itself.](img/disaster-recovery-rpo-rto.svg)

*RPO looks back from the disaster, RTO looks forward. Adapted from AWS, "Disaster Recovery of Workloads on AWS", figure 3.*

- **Recovery point objective (RPO)** is the most data, measured in time,
  you're willing to lose: the longest acceptable gap between the last
  point you can recover to and the disaster. Daily backups mean an RPO
  of up to a day.
- **Recovery time objective (RTO)** is the longest acceptable time
  between the service going down and coming back.

Both are business decisions. A business impact analysis asks what an
outage or data loss actually costs, and that cost can depend on timing:
a payroll system down just before payday hurts far more than just
after. The answer sets the targets, and the targets set what you build.
If a recovery option costs more than the loss it prevents, you
shouldn't build it unless a regulator makes you. For some workloads,
having no disaster recovery at all is a valid, deliberate choice.

## A disaster, told by the team it happened to

GitLab.com in 2017 ran PostgreSQL with one primary and one hot standby.
A load spike broke replication, because the primary removed WAL the
standby still needed and there was no WAL archive to fetch it from.
While an engineer was rebuilding the standby, a command meant to wipe
its data directory ran on the primary instead. About 300 GB was gone
before they stopped it.

On paper they had several ways back. In practice:

- **Daily `pg_dump` backups** to S3: the bucket was empty. The backup
  job ran `pg_dump` 9.2 against a 9.6 server, which errors out, and the
  failure emails were being rejected by the mail server, so nobody knew.
- **Cloud disk snapshots**: turned on for other servers, but not the
  database, on the assumption that the other backups were enough.
- **Replication**: for failover, not disaster recovery, and the standby
  had just been wiped.
- **An LVM snapshot** copied daily to staging for testing, plus one an
  engineer had happened to take by hand about 6 hours earlier.

They restored from that 6-hour-old manual snapshot; the alternative was
losing almost 24 hours. Copying it back from staging's slow, throttled
disks took about 18 hours. About 5,000 projects, 5,000 comments and 700
new accounts were affected, and some data was never recovered.

Read it with the two numbers in mind. The effective RPO was
supposed to be a day and came out at 6 hours by luck. The RTO was set
by the speed of slow staging disks. And the root-cause answer to "why
was the backup procedure never tested?" was that nobody owned it.

## High availability is not disaster recovery

[[replication|Replicas]] and automatic [[failover]] keep a service up
when a component dies. They don't protect data from the service itself.
A replica copies a mistaken `DELETE`, a corrupt row or an attacker's
changes to every copy, usually before anyone notices. Replication and
redundancy are not recoverability.

So disaster recovery needs point-in-time copies kept apart from the
live system: [[backups]]. How often you take them bounds your RPO. For
a database, a base backup plus continuously archived WAL gives the
finest recovery point, and archiving that falls behind directly
increases what a disaster would cost you. Data isn't the only thing to
back up either: code, configuration and infrastructure have to be
rebuildable in the recovery site, ideally from
[[infrastructure-as-code]], or the rebuild itself blows the RTO.

Disasters also come in different sizes. A flood in one data center, a
region-wide outage and a bad script deleting production data need
different answers. Spreading across zones handles the first; the last
needs backups no matter how many regions you run in. Thinking in
[[failure-domains]] helps: what fails together, and which copy survives.

## Four strategies, from cheap to instant

The usual options come in four strategies, each buying a lower RPO and
RTO for more money and complexity:

| Strategy | What's running in the recovery site | Recovery means |
|---|---|---|
| Backup and restore | Nothing but backups | Rebuild infrastructure, restore data, deploy |
| Pilot light | Data replicated; core infrastructure on; app servers off | Switch app servers on, scale up |
| Warm standby | A smaller, fully working copy | Scale up; it can take traffic at once |
| Multi-site active/active | Full copies, all serving users | Route traffic away from the failed site |

Even active/active doesn't remove the need for backups. If data is
corrupted or deleted, every active site has the bad data, and the
recovery point has to be some time before the problem was discovered.
That's a non-zero RPO no matter how many regions you run.

Two practical rules come with these. First, fail over using the
simplest, most available operations, not ones that depend on a control
plane that may be down too: flipping a DNS record or a routing switch,
not creating new resources. Second, be careful with automatic failover.
Failing over costs data and time, so a false alarm causes the damage it
was meant to avoid. Many teams start the failover by hand but automate
every step after that, so it's one button. See [[multi-region]] for
the long-term design side of this.

## The clock starts before you act

RTO covers the whole path, not just the restore. With a one-hour RTO,
you have one hour to notice the problem, page the right people,
escalate, work out whether it'll fix itself, decide to invoke the plan,
and then recover. If people hesitate to invoke disaster recovery even
when the RTO is at risk, that usually means they don't trust the plan.

Restores are also slower than people expect. The further down the stack
a copy lives, the slower it is to make and to load. Google's example: a
database replicates in seconds, an export to the filesystem takes about
40 minutes, a full filesystem backup takes hours, and restoring takes
about as long as backing up. Google keeps quick-to-restore snapshots
close by for a short time, and older copies further away for longer.

## Restore drills

A backup can be broken for a long time without anyone knowing: empty,
incomplete, made by the wrong version, or impossible to restore in the
time you have. You find out when you try to restore. The only test
worth trusting is a full, end-to-end restore, and the only way it stays
true is to run it again and again, automatically.

A drill should answer:

- Are the backups complete, or empty?
- Is there enough machine capacity and disk to restore into?
- Does the restore finish within the RTO?
- Can you watch its progress?
- Does it depend on anything outside your control that might be
  missing that day, like an offsite vault that isn't open around the
  clock?

Talk-throughs count too. In a fictionalized account of a Google disaster
test, an on-call engineer was asked to restore a service's database
from backup into a clone. Two bugs fell out in minutes: a command in
the runbook now needed extra parameters, and the scratch space for the
restore had become too small because the database had grown since the
runbook was written.

Practice pays off in a real disaster. When Gmail lost a large amount of
user data in 2011, Google restored it from its tape backup system. It
was the first large-scale real use of that system, but not the first
restore: the team had simulated it many times. So they could give an
estimate of how long it would take, and recovered over 99% of the data
before the estimate ran out.

Restoring a region is the same idea at a larger size. Failing over to
the recovery site on a schedule is a drill, and it's a natural
[[chaos-engineering]] experiment: a hypothesis (users barely notice), a
steady-state metric, and a stop condition.

## Where it gets tricky

**Paths you rarely run don't work.** A standby that could take the full
load last year may not now: traffic has grown, service quotas in the
recovery region are too low, a machine image is stale. Configuration
drift between the main and recovery sites has to be checked
continuously. The only recovery path that reliably works is the one you
exercise often, so keep few of them.

**Late discovery changes everything.** A deleted database gets noticed
in minutes. A bug that slowly corrupts data may go unnoticed for days,
so you need older backups, and then you have to merge what you restore
with everything written since. That's much harder than a plain restore,
and it's why how long you keep backups matters, not just how often
you take them.

**Disaster recovery is more than systems.** The plan sits inside the
business's wider continuity plan. Google's exercises found failures in
people and processes, not only in code: an approval chain whose
approvers were all in the "lost" site, and an emergency call bridge
that held only 40 callers once people found the plan.

**Faster isn't always right.** Each step down the table costs more to
run. The right strategy is the cheapest one that meets the targets the
business actually set.

## What this means when you build

- Write down RPO and RTO per service, and get someone who owns the
  business side to agree to them.
- Keep point-in-time backups separate from replicas, in another
  failure domain, so one mistake can't delete both.
- Make every backup job alert when it fails, and check that the alert
  actually reaches someone.
- Automate a restore drill: restore the latest backup into a scratch
  environment, check the data, record how long it took. That time, and
  the age of the newest restored data, are what you can really promise
  as RTO and RPO.
- Give backups and restores an owner.
- Rebuild infrastructure from code, and back up configuration, not
  only data.
- Rehearse failover, with a person pressing one button and everything
  after that automated.

## Further reading

- [Disaster Recovery of Workloads on AWS](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html), AWS Well-Architected, 2021. RPO and RTO, high availability vs disaster recovery, the four strategies, detection and testing.
- [Data Integrity: What You Read Is What You Wrote](https://sre.google/sre-book/data-integrity/), Raymond Blum and Rhandeev Singh, Google SRE book, 2016. Why replication isn't recoverability, tiered backups, testing recovery end to end, and the Gmail tape restore.
- [GitLab.com database outage postmortem](https://about.gitlab.com/blog/2017/02/10/postmortem-of-database-outage-of-january-31/), GitLab, 2017. Five backup methods that failed in five ways, told honestly.
- [Weathering the Unexpected](https://queue.acm.org/detail.cfm?id=2371516), Kripa Krishnan (Google), ACM Queue, 2012. Google's disaster tests, with a sidebar on a restore drill that found two bugs.
- [25.3 Continuous Archiving and Point-in-Time Recovery (PITR)](https://www.postgresql.org/docs/current/continuous-archiving.html), PostgreSQL 18 manual. How WAL archiving sets the recovery point for a database, and what makes it fall behind.
