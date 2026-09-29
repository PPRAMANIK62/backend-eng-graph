---
id: soft-deletion
title: Soft deletion
depth: short
phase: 13
note: >-
  Marking data deleted and purging it later, so a bad delete can be
  undone before the data is gone.
needs: [backups]
leads_to: []
compare_with: []
---

# Soft deletion

Soft deletion means a delete doesn't destroy anything right away. The
data is marked as deleted, disappears from the product, and is only
destroyed after a delay, typically weeks. Until then, someone with
access to the admin tools can bring it back. It's the cheapest defense
against the most common way data gets lost: not disks failing, but code
and people deleting the wrong thing.

## Why the first defense isn't backups

Replicas don't help with a bad delete. A replicated store copies an
errant delete to every replica, likely before anyone notices. And
[[backups]], the next layer down, are slow: restoring can take hours and
means merging old data with everything written since.

Google's SRE book puts soft deletion first in its layered defense, based
on what actually causes loss when teams move fast and care about
privacy: bugs in applications cause the vast majority of data loss and
corruption. The most devastating cases it describes come from developers
unfamiliar with the existing code changing deletion logic, especially
in batch pipelines.

## How it works

1. **Delete means mark.** A delete sets a flag or moves the item to a
   deleted state. From then on only administrative code paths can see it:
   support tools, account recovery, legal discovery, troubleshooting.
2. **Wait.** The item stays for a fixed delay. Common choices are 15,
   30, 45 or 60 days. Google's experience is that most account hijacking
   and data integrity problems are reported within 60 days, so keeping
   soft-deleted data much longer buys little.
3. **Destroy.** After the delay, a purge job deletes it for real.

A user-facing trash folder is the same idea one level up. Gmail's trash
keeps messages deleted fewer than 30 days ago. The SRE book lays the
layers out by whose mistake they catch:

| Layer | Controlled by | Main defense against |
|---|---|---|
| Trash folder | the user | user error |
| Soft deletion | the application | developer error, and user error behind the trash |
| Lazy deletion | the storage system | mistakes by developers using the storage |

Lazy deletion is soft deletion done by the storage service itself: data
a client deletes becomes inaccessible at once but is kept for up to a
few weeks before it's destroyed.

## Where it gets tricky

**It can be bypassed.** A new batch job that deletes rows directly skips
the mark-and-wait path entirely. Design the interfaces so that the easy
way to delete is the soft way, and new code can't go around it.

**Privacy pulls the other way.** Users must be able to delete their
data, and some systems must guarantee deleted data is really destroyed
within a set time. A long delay conflicts with that, and costs storage
when there's a lot of short-lived data. The delay length is a policy
choice: law, cost and what the product promises.

**Hijackers delete too.** Someone who takes over an account commonly
deletes its data first. Soft deletion lets you restore it after
recovering the account, as long as the delay is longer than the time it
takes to notice.

**Every query has to respect the flag.** In a relational schema, a
`deleted_at` column only works if every read path filters on it.
Missing one leaks "deleted" data back into the product.

## What this means when you build

- Make deletes soft by default: mark, hide, and purge later with a
  separate job.
- Pick a delay from policy (legal limits, privacy promises, cost), not
  by habit.
- Give support staff a tool to undelete, and log its use.
- Keep [[backups]] as the next layer, for what soft deletion can't
  catch.

## Further reading

- [Data Integrity: What You Read Is What You Wrote](https://sre.google/sre-book/data-integrity/), Site Reliability Engineering, chapter 26, Google. Soft deletion, lazy deletion and trash as the first layer of defense, and the delays Google uses.
