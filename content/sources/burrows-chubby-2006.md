---
id: burrows-chubby-2006
title: The Chubby lock service for loosely-coupled distributed systems
author: Mike Burrows (Google)
url: https://research.google.com/archive/chubby-osdi06.pdf
kind: paper
primary: true
---

## Summary

Google's OSDI 2006 paper on Chubby, a lock service built on Paxos: a
small replicated file system with advisory locks, used to elect primaries
(GFS, Bigtable), to store small bits of metadata and, to the authors'
surprise, mostly as a name service. It explains why they built a service
rather than a consensus library, how sessions are kept alive with leases
and KeepAlives, and how sequencers and lock-delay protect resources from
delayed requests by an old lock holder.

## Key claims

- Purpose: coarse-grained locking plus small reliable storage. "intended to provide coarse-grained locking as well as reliable (though low-volume) storage for a loosely-coupled distributed system." (abstract)
- Electing a primary is consensus, solved with Paxos; Paxos is safe without timing assumptions, clocks only give liveness. "Paxos maintains safety without timing assumptions, but clocks must be introduced to ensure liveness" (section 1)
- Before Chubby, primary election was ad hoc or done by operators. "most distributed systems at Google used ad hoc methods for primary election (when work could be duplicated without harm), or required operator intervention (when correctness was essential)." (section 1)
- The fencing idea in its simplest form: pass the lock acquisition count with each write and have the server reject lower counts. "add an if-statement to the file server to reject the write if the acquisition count is lower than the current value (to guard against delayed packets)." (section 2.1)
- A lock service is easier to retrofit than a consensus library. "a lock server makes it easier to maintain existing program structure and communication patterns." (section 2.1)
- Elected primaries need somewhere to advertise themselves, so the lock service also stores small files. "we chose to serve small-files to permit elected primaries to advertise themselves and their parameters, rather than build and maintain a second service." (section 2.1)
- Programmers think they know locks, and are usually wrong in distributed systems. "Ironically, such programmers are usually wrong, especially when they use locks in a distributed system" (section 2.1)
- A cell usually has five replicas, three needed; but even one client can take a lock and make progress. "Chubby itself usually has five replicas in each cell, of which three must be running for the cell to be up." (section 2.1)
- Coarse-grained use: a lock might elect a primary that holds it for hours or days. "an application might use a lock to elect a primary, which would then handle all access to that data for a considerable time, perhaps hours or days." (section 2.1)
- The master holds a master lease from the replicas; reads are served by the master alone while it's valid. "Read requests are satisfied by the master alone; this is safe provided the master lease has not expired, as no other master can possibly exist." (section 2.2)
- Elections usually take a few seconds; two recent ones took 6 s and 4 s, sometimes up to 30 s. "For example, two recent elections took 6s and 4s, but we see values as high as 30s" (section 2.2)
- Locks are advisory. "Like the mutexes known to most programmers, locks are advisory." (section 2.4)
- The core problem of distributed locks: a request sent under a lock can arrive after the lock has passed to someone else. "If R later arrives, it may be acted on without the protection of L, and potentially on inconsistent data." (section 2.4)
- A sequencer holds the lock name, mode and generation number; the resource server checks it and rejects stale ones. "It contains the name of the lock, the mode in which it was acquired (exclusive or shared), and the lock generation number." (section 2.4)
- The server may check against the most recent sequencer it has seen, without talking to Chubby. "against the most recent sequencer that the server has observed." (section 2.4)
- Lock-delay: if a holder fails rather than releasing, the lock can't be taken again for a while, up to a bound of one minute. "the lock server will prevent other clients from claiming the lock for a period called the lock-delay." (section 2.4)
- Lock-delay is admittedly imperfect. "While imperfect, the lock-delay protects unmodified servers and clients from everyday problems caused by message delays and restarts." (section 2.4)
- Primary election recipe: all candidates try the lock; the winner writes its identity into the lock file and passes a sequencer to servers. "All potential primaries open the lock file and attempt to acquire the lock." (section 2.6)
- Each session has a lease the master promises not to end early. "Each session has an associated lease—an interval of time extending into the future during which the master guarantees not to terminate the session unilaterally." (section 2.8)
- The master can only move the lease forward. "The master is free to advance this timeout further into the future, but may not move it backwards in time." (section 2.8)
- Default KeepAlive extension is 12 s. "The default extension is 12s, but an overloaded master may use higher values" (section 2.8)
- The client keeps a conservative local estimate of the lease, allowing for message flight time and the master's clock rate. "we require that the server's clock advance no faster than a known constant factor faster than the client's." (section 2.8)
- When the local lease runs out the session is "in jeopardy"; a 45 s grace period follows. "The client waits a further interval called the grace period, 45s by default." (section 2.8)
- In jeopardy the client empties and disables its cache. "The client empties and disables its cache, and we say that its session is in jeopardy." (section 2.8)
- The grace period lets clients survive master outages without losing sessions or locks. "Recall that the grace period allows clients to ride out long Chubby master outages without losing sessions or locks." (section 5)
- Replicas are placed to avoid failing together. "placed so as to reduce the likelihood of correlated failure (for example, in different racks)." (section 2.2)
- Moving the misplaced data out took about a year. "it took approximately a year for the data to be migrated elsewhere." (section 4.5)
- Its most popular use turned out to be naming. "we found that its most popular use was as a name server." (section 4.3)
- People stored too much in it; a 1.5 MB file was rewritten on each user action, so a 256 kB file limit was added. "We introduced a limit on file size (256kBytes)" (section 4.5)
- Using it as pub/sub was slow and inefficient. "make it a slow and inefficient for all but the most trivial publish/subscribe examples." (section 4.5)
- A lost lock is expensive for clients. "Although master fail-overs are rare, a lost Chubby lock is expensive for clients." (section 5)

## Visuals worth redrawing

- Figure 2, the grace period during master fail-over: old master lease,
  client lease timeline, jeopardy, new master. Good for a lease timeline.

## My notes

- Chubby calls fencing tokens "sequencers"; Kleppmann's fencing tokens
  and etcd's revisions are the same idea.
