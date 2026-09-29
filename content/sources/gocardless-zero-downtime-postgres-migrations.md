---
id: gocardless-zero-downtime-postgres-migrations
title: "Zero-downtime Postgres migrations - the hard parts"
author: Chris Sinjakli, GoCardless
url: https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/
kind: blog
primary: true
---

## Summary

GoCardless's write-up of about 15 seconds of API downtime caused by a
migration that ran in milliseconds. The ALTER TABLE waited for a lock
behind a slow read, and every query after it queued behind the ALTER.
Written when Postgres 9.4 was current.

## Key claims

- The outage: about 15 seconds of API downtime from a planned migration. "A few months ago, we took around 15 seconds of unexpected API downtime during a planned database migration." (intro)
- The usual rules: don't rename in-use columns, don't rewrite under an exclusive lock, index concurrently. "Don't rename columns/tables which are in use by the app - always copy the data and drop the old one once the app is no longer using it" (intro list)
- Re-run on a backup copy, the migrations took a few hundred milliseconds. "They went through in a few hundred milliseconds." (investigation)
- A lock request that can't be granted waits in a queue, and conflicting requests queue behind it. "When a lock can't be acquired because of a lock held by another transaction, it goes into a queue. Any locks that conflict with the queued lock will queue up behind it." (investigation)
- A queued ACCESS EXCLUSIVE blocks everything on the table. "As AccessExclusive locks conflict with every other type of lock, having one sat in the queue blocks all other operations" (investigation; a footnote marker follows)
- The ALTER was fast; waiting for the lock caused the downtime. "The ALTER TABLE statement itself was fast to execute, but the effect of it waiting for an AccessExclusive lock on the referenced table caused the downtime" (investigation)
- At the time, adding a foreign key took AccessExclusive on both tables. "In order to add a foreign key constraint, Postgres takes AccessExclusive locks on both the table with the constraint" (investigation)
- Fix: set lock_timeout in migrations. "Set lock_timeout in your migration scripts to a pause your app can tolerate. It's better to abort a deploy than take your application down." (what to do)
- Fix: get rid of long-running queries and transactions, and log them. "It's worth setting log_min_duration_statement and log_lock_waits to find these issues in your app before they turn into downtime." (what to do)
- An open console transaction is enough to cause it. "will cause downtime if someone deploys a schema change for some_table." (footnote 6)
- Postgres 9.4 made VALIDATE CONSTRAINT take a weaker lock. "9.4 does make the VALIDATE CONSTRAINT step take a weaker ShareUpdateExclusive lock though" (footnote 4)

## Visuals worth redrawing

- The three-transaction worked example (slow SELECT, waiting ALTER,
  blocked SELECT) as a timeline.

## My notes

- The foreign key lock level has changed since: the current ALTER TABLE
  docs say ADD FOREIGN KEY takes SHARE ROW EXCLUSIVE on both tables
  (postgres-alter-table). That still conflicts with writes, so the
  queue problem is the same for writes, but plain reads would no longer
  queue behind it.
- The page's metadata doesn't give a reliable year; "9.4" in the text
  dates it to that release.
