---
id: stripe-online-migrations-2017
title: "Online migrations at scale"
author: Jacqueline Xu, Stripe
url: https://stripe.com/blog/online-migrations
kind: blog
primary: true
---

## Summary

How Stripe (2017) moved hundreds of millions of Subscriptions objects
out of the Customer record into their own table without downtime, using
a four-step dual-write pattern and checking reads against each other in
production.

## Key claims

- The scale. "Stripe has hundreds of millions of Subscriptions objects." (Why migrations are hard)
- No maintenance windows. "We perform all infrastructure upgrades online, rather than relying on planned maintenance windows." (Why migrations are hard)
- The four steps. "Dual writing to the existing and new tables to keep them in sync." / "Changing all read paths in our codebase to read from the new table." / "Changing all write paths in our codebase to only write to the new table." / "Removing old data that relies on the outdated data model." (the 4-step pattern)
- Ramp dual writes up gradually while watching metrics. "We can mitigate performance concerns by slowly ramping up the percentage of objects that get duplicated, while keeping a careful eye on operational metrics." (Part 1)
- Copy old objects lazily when they change, then backfill the rest. "whenever objects are updated, they will automatically be copied over to the new table." (Part 1)
- Finding what to backfill was the expensive part, done offline from snapshots. "The most expensive part of backfilling the new table on the live database is simply finding all the objects that need migration." (Part 1)
- Reads compared old vs new in production with Scientist. "Scientist is a Ruby library that allows you to run experiments and compare the results of two different code paths, alerting you if two expressions ever yield different results in production." (Part 2)
- Then reverse the write order: new store first, old store as archive. "We now want to reverse the order: write data to the new store and then archive it in the old store." (Part 3)
- Small steps. "We never attempted to change more than a few hundred lines of code at one time." (conclusion)
- Subscriptions had been stored inside the Customer record and moved to their own table. "Our redesigned data model moves subscriptions into their own table." (Our example migration)
- After the backfill, the offline job ran again to check nothing was missed. "run the Scalding job once again to make sure there are no existing subscriptions missing from the Subscriptions table." (Part 1)
- Write paths were changed one small code path at a time. "we’ll isolate as many code paths into the smallest unit possible so we can apply each change carefully." (Part 3)

## Visuals worth redrawing

- The four phases with arrows showing which store each read and write
  hits.

## My notes

- The post doesn't say which database Stripe used; the pattern is
  database-agnostic.
