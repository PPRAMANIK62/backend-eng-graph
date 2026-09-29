---
id: silberstein-feeding-frenzy-2010
title: "Feeding Frenzy: Selectively Materializing Users' Event Feeds"
author: Adam Silberstein, Jeff Terrace, Brian F. Cooper, Raghu Ramakrishnan (Yahoo! Research, Princeton)
url: https://jeffterrace.com/docs/feeding-frenzy-sigmod10-web.pdf
kind: paper
primary: true
---

## Summary

SIGMOD 2010 paper that treats a social feed as a view-materialization
problem. Producers write events, consumers read feeds, and for each
producer/consumer pair you either push (write the event into the
consumer's stored feed) or pull (read the producer's events at query
time). The main result: choosing push or pull separately for each pair,
by comparing the consumer's read rate with the producer's write rate,
minimises total cost. Built and tested on Yahoo!'s PNUTS.

## Key claims

- The main idea. "events from high-rate producers are retrieved at query time, while events from lower-rate producers are materialized in advance." (Abstract)
- Local decisions give the global optimum. "we can minimize global cost by making local decisions about each producer/consumer pair, based on the ratio between a given producer’s update rate (how often an event is added to the stream) and a given consumer’s view rate (how often the feed is viewed)." (Abstract)
- Why feeds are hard: wide fan-out and skew. "The wide fanout of popular streams (those with many followers) and high skew (fanout and update rates vary widely) make it difficult to scale such applications." (Abstract)
- The two strategies, defined. "push—events are pushed to materialized per-consumer feeds" and "pull —events are pulled from a per-producer event store at query time" (1, Introduction)
- Only the latest events are shown, so pushing events that get pushed out before anyone looks is waste. "Since we only need to display the most recent N events, it is wasteful to materialize lots of events that will later be superseded by newer events before the consumer logs in to retrieve them." (1, Introduction)
- Pull wins when a consumer logs in rarely compared with how often the producer writes. "if the consumer logs in infrequently compared to the rate at which the producer is producing events, the pull strategy is best." (1, Introduction)
- The decision rule: with H the cost to push one event into a feed and L the cost of one pull from a producer, push if (consumer view rate / producer event rate) ≥ H/L, otherwise pull. "If (φci /φpj ) >= H/Lj , push for all events by pj" (3.2.1, Lemma 1)
- Why: push costs H once per event; pull costs L spread over the events fetched, times how often the consumer looks during the event's lifetime. "Push cost over ej,k ’s lifetime = H" (3.2.1, Claim 1)
- Flash loads can be handled by switching affected pairs from push to pull. "this local optimization approach effectively allows us to cope with flash loads and other sudden workload changes simply by changing affected producer/consumer pairs from push to pull." (1, Introduction)
- Their example of skew: one celebrity's tweets reached over 4.6 million followers when written (2010). "his status update is propagated to over 4.6 million followers" (1, Introduction)
- Materialising everything can blow up storage: Digg's example grew from tens of GB to 3 TB. "resulting in a blow up of stored data from tens of GB to 3 TB" (1, Introduction)
- Feed properties users expect include no gaps and no duplicates. "No duplicates: No event ei appears twice in the feed." (2, feed properties)

## Visuals worth redrawing

- A producer/consumer bipartite graph with some edges marked push and
  some pull. Redrawn as the hybrid in `feed-fan-out`.

## My notes

- The costs H and L are assumed constant as the system scales; the paper
  says this breaks if data spills from memory to disk.
