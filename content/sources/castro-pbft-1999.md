---
id: castro-pbft-1999
title: Practical Byzantine Fault Tolerance
author: Miguel Castro, Barbara Liskov
url: https://pdos.csail.mit.edu/6.824/papers/castro-practicalbft.pdf
kind: paper
primary: true
---

## Summary

PBFT (OSDI 1999), the first state machine replication protocol that
survives Byzantine faults in an asynchronous network and is fast enough
to use. With 3f+1 replicas it tolerates f that behave arbitrarily. Read
from the MIT 6.824 course copy; the math symbols (f, n) don't survive
text extraction, so quotes below avoid them.

## Key claims

- Byzantine means arbitrary behaviour, caused by attacks or software errors. "Since malicious attacks and software errors can cause faulty nodes to exhibit Byzantine (i.e., arbitrary) behavior, Byzantine-fault-tolerant algorithms are increasingly important." (1)
- It works without timing assumptions for safety, unlike earlier practical systems. "Our algorithm is not vulnerable to this type of attack because it does not rely on synchrony for safety." (1)
- Earlier systems relying on synchrony could be attacked by delaying honest nodes until they were excluded. "An attacker may compromise the safety of a service by delaying non-faulty nodes or the communication between them until they are tagged as faulty and excluded from the replica group." (1)
- Liveness does need some synchrony, or it would solve consensus in an asynchronous system (FLP). "Therefore, it must rely on synchrony to provide liveness; otherwise it could be used to implement consensus in an asynchronous system, which is not possible [9]." (3)
- Safety means linearizability, as long as at most f of 3f+1 replicas are faulty. (3)
- Independent failures need different code, operating systems, passwords and administrators. "each node should run different implementations of the service code and operating system and should have a different root password and a different administrator." (2)
- 3f+1 is the minimum: you must proceed after hearing from n−f replicas, f of those may be faulty, and honest answers must outnumber faulty ones, so n−2f > f. "The resiliency of our algorithm is optimal" (2)
- Adding replicas beyond 3f+1 costs performance and buys nothing. "the additional replicas degrade performance (since more and bigger messages are being exchanged) without providing improved resiliency." (4)
- Replicas move through numbered views; in each view one replica is the primary. "In a view one replica is the primary and the others are backups." (4)
- The client waits for f+1 matching replies from different replicas. (4.1)
- Normal case has three phases. "The three phases are pre-prepare, prepare, and commit." (4.2)
- Pre-prepare and prepare order requests within a view even if the primary lies; prepare and commit order them across views. "The pre-prepare and prepare phases are used to totally order requests sent in the same view even when the primary, which proposes the ordering of requests, is faulty." (4.2)
- If the primary doesn't pass a request on, replicas suspect it and change view. "If the primary does not multicast the request to the group, it will eventually be suspected to be faulty by enough replicas to cause a view change." (4.1)
- Normal operation uses MACs; public-key signatures only when there are faults. "public-key cryptography, which was cited as the major latency [29] and throughput [22] bottleneck in Rampart, is used only when there are faults." (1)
- Read-only operations take one round trip, read-write two. "It uses only one message round trip to execute read-only operations and two to execute read-write operations." (1)
- Their BFT NFS was 3% slower than an unreplicated NFS on the Andrew benchmark. "The results show that our system is only 3% slower than the standard NFS daemon in the Digital Unix kernel during normal-case operation." (1)
- A faulty replica can still leak data. "a faulty replica may leak information to an attacker." (2)
- The first BFT state machine replication protocol that is correct on an asynchronous network. "It describes the first state-machine replication protocol that correctly survives Byzantine faults in asynchronous networks." (1)
- Replicas answer the client directly. "A replica sends the reply to the request directly to the client." (4.1)
- If the client gets no reply in time, it broadcasts the request to all replicas. "If the client does not receive replies soon enough, it broadcasts the request to all replicas." (4.1)

## Visuals worth redrawing

- Figure 1: normal-case message flow (request, pre-prepare, prepare,
  commit, reply) with replica 3 faulty.

## My notes

- The 3% figure is from 1999 hardware and one benchmark; treat as
  historical.
