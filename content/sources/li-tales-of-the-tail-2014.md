---
id: li-tales-of-the-tail-2014
title: "Tales of the Tail: Hardware, OS, and Application-level Sources of Tail Latency"
author: Jialin Li, Naveen Kr. Sharma, Dan R. K. Ports, Steven D. Gribble (University of Washington)
url: https://drkp.net/papers/latency-socc14.pdf
kind: paper
primary: true
---

## Summary

SoCC 2014. The authors measured three Linux servers (a null RPC
server, Memcached, Nginx) on a multi-core machine and compared their
latency distributions with what a queueing model predicts. The real
tails were much worse, and they traced the extra to specific causes
in the hardware, the OS and the application, then removed them one by
one.

## Key claims

- The causes they found. "The underlying causes include interference from background processes, request re-ordering caused by poor scheduling or constrained concurrency models, suboptimal interrupt routing, CPU power saving mechanisms, and NUMA effects." (Abstract)
- After fixing them. "Memcached can achieve a median latency of 11 µs and a 99.9th percentile latency of 32 µs at 80% utilization on a four-core system." (Abstract)
- The naive setup at the same load, single core. "has a median latency of 100 µs and a 99.9th percentile latency of 5 ms." (Abstract)
- Fan-out in the wild. "a Facebook web request may access thousands of Memcached servers" (Introduction)
- With enough fan-out the rare case is normal. "the one-in-one-thousand case is the common case." (Introduction)
- What queueing theory predicts. "Queuing models predict that tail latency worsens with increased server utilization, but that it improves as additional processors service a queue." (Introduction)
- Queue order matters. "FIFO queuing has the best tail latency" (section 2, queueing disciplines)
- Power saving hurts the tail when the server is lightly loaded. "under low utilization, CPU power savings mechanisms hurt tail latency." (Conclusion)
- The three servers, and the gap to the model. "Using fine-grained measurements of three different servers (a null RPC service, Memcached, and Nginx) on Linux, we then explore why these servers exhibit significantly worse tail latencies than queuing models alone predict." (Abstract)

## Visuals worth redrawing

- Their CCDF plots of latency with and without each fix, log scale.

## My notes

- Hardware from 2014 (a four-core machine with a 10 Gb/s NIC); the
  causes are still the usual suspects, the numbers are not current.
