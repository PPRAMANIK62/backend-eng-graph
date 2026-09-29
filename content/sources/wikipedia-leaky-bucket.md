---
id: wikipedia-leaky-bucket
title: Leaky bucket
author: Wikipedia contributors
url: https://en.wikipedia.org/wiki/Leaky_bucket
kind: docs
primary: false
---

## Summary

Encyclopedia article on the leaky bucket (read at revision oldid
1351218966). It separates the two algorithms that share the name, the
leaky bucket as a meter and as a queue, shows the meter is a mirror
image of the token bucket, and ties the meter to GCRA through the ITU-T
and ATM Forum descriptions.

## Key claims

- Two different algorithms go by the same name. "These give what appear to be two different algorithms, both of which are referred to as the leaky bucket algorithm and generally without reference to the other method." (Overview)
- As a meter, the bucket is a counter used only to check conformance. "In one version, the bucket is a counter or variable separate from the flow of traffic or schedule of events." (Overview)
- As a queue, the bucket holds the packets and releases them at a fixed rate. "In the second version, the bucket is a queue in the flow of traffic." (Overview)
- The meter is the token bucket mirrored. "The leaky bucket as a meter is exactly equivalent to (a mirror image of) the token bucket algorithm" (Overview)
- With the same parameters they pass and refuse the same traffic. "Thus, given equivalent parameters, the two algorithms will see the same traffic as conforming or nonconforming." (Overview)
- GCRA is the ITU-T and ATM Forum's form of the leaky bucket as a meter, with a bucket of capacity T + τ. "The capacity of the bucket (the upper bound of the counter) is (T + τ)" (As a meter, Concept of operation, quoting ITU-T I.371)

## Visuals worth redrawing

None needed.

## My notes

- Secondary source. Used for the meter/queue split and the token bucket
  equivalence, which the primary sources here don't state directly.
