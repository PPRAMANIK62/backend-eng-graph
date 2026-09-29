---
id: linkedin-burrow-lag-rules
title: Consumer Lag Evaluation Rules (Burrow wiki)
author: LinkedIn, Burrow project
url: https://github.com/linkedin/Burrow/wiki/Consumer-Lag-Evaluation-Rules
kind: docs
primary: true
---

## Summary

The Burrow wiki page on how LinkedIn's Kafka lag monitor decides
whether a consumer group is healthy. Instead of a fixed "N messages
behind" threshold, it keeps a sliding window of committed offsets and
lag per partition and applies rules: any zero lag is fine, a
committed offset that doesn't move while lag stays or grows is
stalled, offsets that move while lag keeps growing is a warning, and
no commits for too long is stopped.

## Key claims

- The point: judge health without a fixed lag threshold. "we can check whether or not the consumer is performing well without the need for setting a discrete threshold for the number of messages a consumer is allowed to be behind before alerts go off." (intro)
- Every partition is checked, not just a few topics. "By evaluating against every partition the group consumes, we assure that the entire consumer group is healthy, and not just the one or two topics that are being monitored." (intro)
- Window: the last 10 committed offsets by default; with 60-second commits, 10 minutes. "The default setting is 10 which, when combined with an offset commit interval (configured on the consumer) of 60 seconds, means we evaluate the status of a consumer group over 10 minutes." (Evaluation Window)
- Lag is the broker's head offset minus the consumer's committed offset. "The lag is calculated as difference between the HEAD offset of the broker and the consumer's offset." (Evaluation Window)
- Rule 1: any zero lag in the window is OK. "If any lag within the window is zero, the status is considered to be OK." (Evaluation Rules)
- Rule 2: offset not moving and lag fixed or growing is an error, STALLED. "If the consumer offset does not change over the window, and the lag is either fixed or increasing, the consumer is in an ERROR state, and the partition is marked as STALLED." (Evaluation Rules)
- Rule 3: offsets moving but lag never shrinking is a warning: slow. "This means that the consumer is slow, and is falling behind." (Evaluation Rules)
- Rule 4: no recent commits is an error, STOPPED, unless the consumer is fully caught up. "the consumer is in an ERROR state and the partition is marked as STOPPED." (Evaluation Rules)
- A busy topic's lag goes up and down; any decrease means it's catching up. "This means that the consumer is moving forwards and was catching up during part of the window. This pattern is common for topics that are busy." (Examples, example 4)

## Visuals worth redrawing

- Example 2 (stalled) and example 3 (slow) as two small lag-over-time
  sketches. Our own drawing, shapes only.

## My notes

- The rules work on committed offsets, so a consumer that processes but
  rarely commits looks worse than it is.
