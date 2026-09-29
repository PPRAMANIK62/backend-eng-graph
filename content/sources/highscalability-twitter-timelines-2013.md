---
id: highscalability-twitter-timelines-2013
title: "The Architecture Twitter Uses to Deal with 150M Active Users, 300K QPS, a 22 MB/S Firehose, and Send Tweets in Under 5 Seconds"
author: High Scalability, summarising a QCon talk by Raffi Krikorian of Twitter
url: https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/
kind: blog
primary: false
---

## Summary

A detailed write-up (2013) of Raffi Krikorian's "Timelines at Scale"
talk about Twitter's home timeline: fan-out on write into Redis lists
holding tweet IDs, the cost for accounts with tens of millions of
followers, and the move to merge those accounts in at read time.
Secondary, but the talk itself (InfoQ) is video only.

## Key claims

- Reads dwarf writes: 300K QPS reading timelines vs about 6000 RPS writing. "300K QPS are spent reading timelines and only 6000 requests per second are spent on writes." (intro list)
- Twitter chose fan-out on write so reads are cheap. "Solution is a write based fanout approach. Do a lot of processing when tweets arrive to figure out where tweets should go." (The Challenge)
- Tweet IDs are inserted into each follower's timeline list in Redis. "So for every write of a tweet as many as 20K inserts are occurring across the Redis cluster." (High Level for Pull Based Timelines)
- A timeline stores IDs, not text: tweet ID, author ID, and 4 bytes of flags. "What is being stored is the tweet ID of the generated tweet, the user ID of the originator of the tweet, and 4 bytes of bits used to mark if it’s a retweet or a reply or something else." (High Level for Pull Based Timelines)
- A home timeline holds 800 entries. "Your home timeline sits in a Redis cluster and is 800 entries long." (High Level for Pull Based Timelines)
- Only active users (logged in within 30 days) get timelines in the cache; others are rebuilt on demand. "If you are not an active user then the tweet does not go into the cache." (High Level for Pull Based Timelines)
- Each timeline is kept in 3 replicas. "Each tweet is replicated 3 times on 3 different machines." (High Level for Pull Based Timelines)
- Reads then hydrate the IDs into tweets with a multiget. "Since the timeline only contains tweet IDs they must “hydrate” those tweets, that is find the text of the tweets." (High Level for Pull Based Timelines)
- Write is O(n) in followers, read is O(1); search is the inverse. "when a tweet  comes in there’s an O(n) process to write to Redis clusters, where n is the number of people following you." (Search and Pull are Inverses)
- Celebrity fan-out can take minutes, and replies can arrive before the tweet. "Replies are being seen all the time before the original tweets for celebrities." (The Future)
- The fix under way: stop fanning out the biggest accounts and merge them at read time. "Not fanning out the high value users anymore." (The Future)
- Delivery numbers given: 3.5 seconds at p50 to deliver to 1 million followers; up to 5 minutes at p99. "3.5 seconds @ p50 (50th percentile) to deliver to 1m" (Monitoring)
- Follower counts cited at the time: 31 million for the largest account. "@ladygaga has 31 million followers." (The Future)
- Users who fall out of the cache get their timeline rebuilt from the social graph and disk. "If you fall out of the Redis cluster then you go through a process called reconstruction." (High Level for Pull Based Timelines)
- Hydration is a batched parallel fetch. "Given an array of IDs they can do a multiget and get the tweets in parallel from T-bird." (High Level for Pull Based Timelines)
- Why replies arrive first: a reply's fan-out runs while the celebrity's is still going. "Let’s say a person on the early receive list replies then the fanout for that reply is being processed while her fanout is still occurring so the reply is injected before the original tweet in the people receiving her tweets later." (The Future)
- Merging the biggest accounts at read time saves compute. "Saves 10s of percents of computational resources." (The Future)
- Posting puts the tweet on a queue and returns; fan-out runs asynchronously. "The tweets are handed off to the asynchronous pathway where all the stuff we’ve been talking about kicks in." (Decoupling)

## Visuals worth redrawing

None.

## My notes

- All numbers are Twitter's as of the talk (2012–2013). Pin them to
  that, don't present as current.
- The site lists the author only as "High Scalability".
