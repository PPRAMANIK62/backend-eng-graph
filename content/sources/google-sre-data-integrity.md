---
id: google-sre-data-integrity
title: "Site Reliability Engineering, chapter 26: Data Integrity: What You Read Is What You Wrote"
author: Raymond Blum and Rhandeev Singh (Google), edited by Betsy Beyer
url: https://sre.google/sre-book/data-integrity/
kind: book
primary: true
---

## Summary

Google SRE book chapter (2016) on keeping data safe. Backups vs
recovery, why replication isn't recoverability, the trade-off between
how fresh and how fast a restore is, defense in depth (soft deletion,
backups, early detection), testing recovery end to end, and the Gmail
restore from tape in 2011.

## Key claims

- What people want is restores, not backups. "No one really wants to make backups; what people really want are restores." (Backups Versus Archives)
- Replication and redundancy are not recoverability. "In designing a data integrity program, it’s important to recognize that replication and redundancy are not recoverability." (Challenges of Maintaining Data Integrity Deep and Wide)
- Replicas spread a corrupt row or bad delete to every copy. "Datastores that automatically sync multiple replicas guarantee that a corrupt database row or errant delete are pushed to all of your copies, likely before you can isolate the problem." (Challenges of Maintaining Data Integrity Deep and Wide)
- The lower in the stack, the slower and rarer the copy: seconds to replicate, 40 minutes to export, hours for a filesystem backup. "Exporting a database snapshot to the filesystem underneath may take 40 minutes. A full backup of the underlying filesystem may take hours." (Scaling issues: Fulls, incrementals, and the competing forces of backups and restores)
- Restoring takes about as long as backing up. "Additionally, restoring probably takes as long as backing up, so actually loading the data might take hours." (Scaling issues: Fulls, incrementals, and the competing forces of backups and restores)
- Slow data loss may go unnoticed for days, needing older backups and a merge with current state. "When reaching back this far, you’ll likely want to merge the restored data with the current state. Doing so significantly complicates the restore process." (Retention)
- Defense in depth: soft deletion, then backups, then validation. "The first layer is soft deletion (or "lazy deletion" in the case of developer API offerings), which has proven to be an effective defense against inadvertent data deletion scenarios." (The 24 Combinations of Data Integrity Failure Modes)
- Backups don't matter; recovery does. "The most important principle in this layer is that backups don’t matter; what matters is recovery." (Second Layer: Backups and Their Related Recovery Methods)
- Full backups load the live system; do full off-peak and incrementals when busy. "To ease this burden, you can take full backups during off-peak hours, and then a series of incremental backups when your service is busier." (Second Layer)
- Tiered backups: quick local snapshots kept briefly, then longer-lived copies further away. "Often Google retains costly but quick-to-restore snapshots¹²⁹ for very short periods of time within the storage instance, and stores less recent backups on random access distributed storage within the same (or nearby) datacenter for a slightly longer time." (Second Layer)
- Backups can be broken without anyone knowing, until a restore. "your recovery dependencies (meaning mostly, but not only, your backup), may be in a latent broken state, which you aren’t aware of until you attempt to recover data." (Knowing That Data Recovery Will Work)
- Only a full end-to-end test counts. "What can go wrong with your recovery process? Anything and everything—which is why the only test that should let you sleep at night is a full end-to-end test." (Knowing That Data Recovery Will Work)
- You only know you can recover if you do. "you only know that you can recover your recent state if you actually do so." (Knowing That Data Recovery Will Work)
- Automate recovery tests and run them continuously. "Therefore, automate these tests whenever possible and then run them continuously." (Knowing That Data Recovery Will Work)
- Checklist: are backups empty, are there enough machines, does it finish in reasonable time, can you monitor it, any outside dependency. "Are your backups valid and complete, or are they empty?" (Knowing That Data Recovery Will Work)
- Gmail 2011: first large-scale real restore from GTape, practised many times before. "Fortunately, it was not the first such restore, as similar situations had been previously simulated many times." (Case Studies, Gmail)
- Because it was practised, they could estimate the restore time and beat it. "Recover 99%+ of the data before the estimated completion time" (Case Studies, Gmail)
- (For disaster-recovery.) The Gmail incident was in 2011. "As demonstrated by an actual Gmail incident in 2011 [Hic11], four days is a long time" (chapter introduction)
- Checklist item on outside dependencies. "Are you free of critical dependencies on resources outside of your control, such as access to an offsite media storage vault that isn’t available 24/7?" (Knowing That Data Recovery Will Work)
- Deletion bugs are the main threat when moving fast. "When velocity is high and privacy matters, bugs in applications account for the vast majority of data loss and corruption events." (First Layer: Soft Deletion)
- Definition. "Soft deletion means that deleted data is immediately marked as such, rendering it unusable by all but the application’s administrative code paths." (First Layer: Soft Deletion)
- Soft-deleted data is destroyed later. "Soft deletion implies that once data is marked as such, it is destroyed after a reasonable delay." (First Layer: Soft Deletion)
- Common delays. "Common choices of soft deletion delays are 15, 30, 45, or 60 days." (First Layer: Soft Deletion)
- Why not longer than 60 days. "In Google’s experience, the majority of account hijacking and data integrity issues are reported or detected within 60 days." (First Layer: Soft Deletion)
- Hijackers delete data first. "a hijacker commonly deletes the original user’s data before using the account for spamming and other unlawful purposes." (First Layer: Soft Deletion)
- The worst cases: developers new to deletion code, especially batch pipelines. "the most devastating acute data deletion cases are caused by application developers unfamiliar with existing code but working on deletion-related code, especially batch processing pipelines" (First Layer: Soft Deletion)
- Make it hard to bypass. "It’s advantageous to design your interfaces to hinder developers unfamiliar with your code from circumventing soft deletion features with new code." (First Layer: Soft Deletion)
- Gmail's trash keeps 30 days. "the Gmail trash bin allows users to access messages that were deleted fewer than 30 days ago." (First Layer: Soft Deletion)
- Lazy deletion is the storage system's version. "You can think of lazy deletion as behind the scenes purging, controlled by the storage system (whereas soft deletion is controlled by and expressed to the client application or service)." (First Layer: Soft Deletion)
- Lazy deletion's limits. "a long lazy deletion period is costly in systems with much short-lived data, and impractical in systems that must guarantee destruction of deleted data within a reasonable time frame" (First Layer: Soft Deletion)
- Who each layer protects against. "Soft deletion is the primary defense against developer error and the secondary defense against user error." (First Layer: Soft Deletion)
- Trash for users. "A trash folder that allows users to undelete data is the primary defense against user error." (First Layer: Soft Deletion)

## Visuals worth redrawing

- Figure 26-4, an object's journey from soft deletion to destruction.

## My notes

- Section labels are the chapter's own headings.
