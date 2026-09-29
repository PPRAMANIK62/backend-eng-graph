---
id: flickr-ticket-servers-2010
title: "Ticket Servers: Distributed Unique Primary Keys on the Cheap"
author: Flickr engineering (posted by Kay Kremerskothen)
url: https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/
kind: blog
primary: true
---

## Summary

Flickr's post (2010) on how it made globally unique integer IDs for a
sharded MySQL setup: dedicated "ticket server" databases whose only job
is an auto-increment counter, run as two servers handing out odd and
even numbers.

## Key claims

- Sharded data needs globally unique keys, which per-database auto-increment can't give. "MySQL can’t guarantee uniqueness across physical and logical databases." (intro)
- Why not GUIDs: big, and they index badly. "Mostly because GUIDs are big, and they index badly in MySQL." (intro)
- Sequential IDs have other uses. "ticket servers give us sequentiality which has some really nice properties including making reporting and debugging more straightforward, and enabling some caching hacks." (intro)
- The trick: `REPLACE INTO` on a one-row table, then `LAST_INSERT_ID()`. "REPLACE INTO Tickets64 (stub) VALUES ('a');" (Putting It All Together)
- One ticket server would be a single point of failure. "You really really don’t know want provisioning your IDs to be a single point of failure." (Putting It All Together)
- Two servers split the space into odds and evens with `auto-increment-increment = 2` and offsets 1 and 2. "We divide responsibility between the two boxes by dividing the ID space down the middle, evens and odds" (Putting It All Together)
- They drift apart, which is harmless. "The sides do drift a bit out of sync, I think we have a few hundred thousand more odd number objects then evenly numbered objects at the moment, but this hurts no one." (Putting It All Together)
- It was already years old in production when written; they call it the simplest thing that works. "is a great example of the Flickr engineering dumbest possible thing that will work design principle." (closing)
- Data moves between shards, so keys must be unique across all of them. "Sometimes we need to migrate data between databases, so we need our primary keys to be globally unique." (intro)

## Visuals worth redrawing

None.

## My notes

- The post is part of Flickr's "Using, Abusing and Scaling MySQL"
  series. The byline on the archive is the account that reposted it;
  the original author isn't named on the page.
- The IDs from two servers are unique but not in global time order
  (odds and evens drift).
