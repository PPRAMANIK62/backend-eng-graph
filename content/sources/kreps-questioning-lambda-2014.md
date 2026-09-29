---
id: kreps-questioning-lambda-2014
title: Questioning the Lambda Architecture
author: Jay Kreps
url: https://www.oreilly.com/radar/questioning-the-lambda-architecture/
kind: blog
primary: true
---

## Summary

A 2014 post by one of Kafka's and Samza's creators. It describes the
Lambda Architecture, credits it for keeping input immutable and for
taking reprocessing seriously, rejects the claims that streaming must
be approximate or that Lambda "beats CAP", and says the real cost is
keeping the same logic correct in two systems. It proposes the
alternative now called the Kappa Architecture: keep the log, and
reprocess by running a second copy of the stream job from the start.

## Key claims

- How Lambda works. "You implement your transformation logic twice, once in the batch system and once in the stream processing system. You stitch together the results from both systems at query time to produce a complete answer." (What is a Lambda Architecture)
- Kreps built LinkedIn's real-time infrastructure with Kafka and Samza. "I’ve been involved in building out the real-time data processing infrastructure at LinkedIn using Kafka and Samza" (intro)
- Why Lambda caught on: the tools at hand. "a scalable high-latency batch system that can process historical data and a low-latency stream processing system that can’t reprocess results." (We have done this experiment)
- Good: immutable input. "I like that the Lambda Architecture emphasizes retaining the input data unchanged." (What's good about this?)
- Good: it takes reprocessing seriously; code always changes. "Code will always change." (same)
- Streaming need not be weaker than batch. "there is no reason that a stream processing system can’t give as strong a semantic guarantee as a batch system." (same)
- The CAP claim doesn't hold. "The CAP theorem, sadly, remains intact." (same)
- The core problem: the same result from two complex systems. "maintaining code that needs to produce the same result in two complex distributed systems is exactly as painful as it seems like it would be." (And the bad…)
- A shared abstraction over both only gets the intersection of features. "any new abstraction can only provide the features supported by the intersection of the two systems." (same)
- LinkedIn tried hybrid designs; keeping two code bases in sync was very hard. "Keeping code written in two different systems perfectly in sync was really, really hard." (We have done this experiment)
- The alternative, step one: retain the log. "Use Kafka or some other system that will let you retain the full log of the data you want to be able to reprocess and that allows for multiple subscribers." (An alternative)
- Retention sets how far back you can reprocess. "if you want to reprocess up to 30 days of data, set your retention in Kafka to 30 days." (An alternative)
- Reprocess only when the code changes. "in this approach you only do reprocessing when your processing code changes, and you actually need to recompute your results." (An alternative)
- Step two onward: a second job from the start of the log into a new table; switch; delete the old. "When the second job has caught up, switch the application to read from the new table." (An alternative)
- The name. "Maybe we could call this the Kappa Architecture, though it may be too simple of an idea to merit a Greek letter." (An alternative)
- Keeping both tables for a while lets you roll back instantly. "This allows you to revert back instantaneously to the old logic by just having a button that redirects the application to the old table." (An alternative)
- The cut-over can be controlled by an A/B test. "you can control the cut-over with an automatic A/B test or bandit algorithm" (An alternative)
- Reprocessing is restarting from an older offset. "changing the consumer’s position to go back and reprocess data is as simple as restarting the job with a different offset." (Some background)
- Not tied to Kafka; any long-retention ordered store works. "You could substitute any system that supports long retention of ordered data (for example HDFS, or some kind of database)." (Some background)
- Cost: 2x output storage for a while and a database that takes a fast reload. "my proposal requires temporarily having 2x the storage space in the output database and requires a database that supports high-volume writes for the re-load." (Comparison)
- The real gain is one framework. "The real advantage isn’t about efficiency at all, but rather about allowing people to develop, test, debug, and operate their systems on top of a single processing framework." (Comparison)
- Lambda is asynchronous processing, not a way around CAP. "this is an architecture for asynchronous processing, so the results being computed are not kept immediately consistent with the incoming data." (What's good about this?)

## Visuals worth redrawing

- The two diagrams: Lambda (log feeding batch and stream, merged at
  serving) and the alternative (one log, two job versions, two tables).

## My notes

- Kreps's post (2014) predates Flink's and Beam's event-time support
  becoming mainstream; it doesn't discuss event time at all.
