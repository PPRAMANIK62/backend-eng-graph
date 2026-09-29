---
id: feed-fan-out
title: Fan-out on write vs on read
depth: short
phase: 17
note: >-
  Building a feed: copy each post into followers' feeds when it's
  written, or gather posts when the feed is read.
needs: [caching, denormalization, hot-spots]
leads_to: []
compare_with: [pub-sub, system-design-method]
---

# Fan-out on write vs on read

A home feed shows the latest posts from everyone you follow. There are
two ways to build it. **Fan-out on write** (push) copies each new post
into the stored feed of every follower when it's posted.
**Fan-out on read** (pull) stores posts only by author and gathers them
when someone opens their feed. Push makes reads cheap and writes
expensive; pull does the opposite. Real systems use both, chosen per
account.

## One post, two ways to deliver it

Alice has 300 followers. She posts.

**Push.** The system looks up Alice's followers and appends the new
post's ID to each of their feed lists: 300 small writes. When Bob opens
his feed, it's already there, one lookup away. The feed is a
[[denormalization|denormalized]] copy, kept in a fast store, often in
memory ([[caching]]).

**Pull.** The system writes the post once, to Alice's own list. When
Bob opens his feed, it looks up everyone Bob follows, fetches the recent
posts of each, merges them by time and returns the newest few. One
write, but every read touches as many lists as Bob follows.

![Two diagrams side by side. Left, fan-out on write: one post from Alice goes through a fan-out step that appends its ID to the feed lists of her followers, and a reader's request fetches one precomputed list. Right, fan-out on read: the post is written once to Alice's own list, and a reader's request fetches from the lists of every account they follow and merges them. Below, a hybrid: ordinary accounts are pushed, accounts with huge followings are pulled at read time and merged in.](img/feed-fan-out-push-pull.svg)

*Push, pull, and the hybrid most large feeds use. Hybrid adapted from Adam Silberstein and others, "Feeding Frenzy" (SIGMOD 2010).*

## Push, as Twitter ran it

Twitter's home timeline is the best-documented push design. Around
2012–2013 it looked like this:

- Reads dominated: about 300,000 timeline reads a second against about
  6,000 writes.
- Each user's timeline was a list in a [[redis-internals|Redis]] cluster, holding up to 800
  entries. Each entry was small: the tweet ID, the author's ID and a few
  bytes of flags, not the tweet itself.
- Each timeline was stored on 3 machines, so losing one didn't mean
  rebuilding millions of timelines.
- Only active users (logged in within 30 days) got a timeline in memory.
  Anyone else had theirs rebuilt from the follow graph and disk when
  they came back.
- A read fetched the list, then looked up the tweets for those IDs in a
  single batched request, a step they called hydration.

The write side paid for it. Posting to 20,000 followers meant 20,000
inserts across the cluster.

## The celebrity problem

Push breaks on accounts with enormous followings. The largest Twitter
account then had 31 million followers, so one tweet meant 31 million
inserts. Delivery to 1 million followers took about 3.5 seconds at the
median, and up to 5 minutes at the [[latency-percentiles|99th percentile]]. Replies to a
celebrity's tweet could arrive before the tweet itself: a follower who
got the tweet early replied, and the reply's small fan-out finished
while the celebrity's was still running. Twitter's fix was to stop
fanning out the biggest accounts and merge their tweets into each
reader's timeline at read time.

That's the hybrid, and a Yahoo! paper from 2010 explains why it's
right. For each producer and consumer pair, compare how often the
consumer reads with how often the producer posts:

- A producer who posts rarely, followed by someone who reads often:
  push. The copy is made once and read many times.
- A producer who posts constantly, followed by someone who reads rarely:
  pull. Most pushed copies would be pushed out of the feed by newer
  posts before anyone saw them.

Their result is that making this choice separately for each pair
minimises the total cost for the whole system. It also gives a lever
for sudden load: switch the affected pairs from push to pull.

## Where it gets tricky

**It's a trade between writes and reads, not a free win.** Push trades
extra writes and storage for fast reads, which fits when reads far
outnumber writes, as they did at Twitter. When writes dominate, or most
followers never look, push does work for nobody.

**Feeds are a derived copy.** A pushed feed can be rebuilt from the
follow graph and each author's posts, which is how Twitter restored
timelines for returning users. Plan for that rebuild, and for what a
user sees while it runs.

**Order and duplicates.** Users expect a feed without gaps and without
the same post twice, even though the pieces arrive at different times
from different places. A feed stored as IDs in time order, with the
merge done carefully, is how you keep those promises.

**Hot accounts are [[hot-spots]].** Pull for celebrities moves their
load to read time: millions of readers now read the same author's list,
so that one list becomes a hot spot of its own.

## What this means when you build

- Estimate read and write rates, and the follower counts at the tail,
  before choosing. The tail decides the design.
- Store IDs in feeds, not full posts, and cap the length.
- Keep feeds only for active users, and have a rebuild path for
  everyone else.
- Push for ordinary accounts, pull for the few with huge followings,
  and merge at read time.
- Run fan-out from a [[message-queue|queue]] in the background, as Twitter did, so
  posting stays fast even when delivery takes seconds.

## Further reading

- [Feeding Frenzy: Selectively Materializing Users' Event Feeds](https://jeffterrace.com/docs/feeding-frenzy-sigmod10-web.pdf), Adam Silberstein, Jeff Terrace, Brian F. Cooper, Raghu Ramakrishnan, SIGMOD 2010. The push/pull cost model and the per-pair rule behind the hybrid.
- [The Architecture Twitter Uses to Deal with 150M Active Users](https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/), High Scalability, 2013. A detailed summary of Raffi Krikorian's talk on Twitter's push timelines and the celebrity problem.
