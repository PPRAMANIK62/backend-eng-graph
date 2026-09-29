---
id: gray-leases-1989
title: "Leases: An Efficient Fault-Tolerant Mechanism for Distributed File Cache Consistency"
author: Cary G. Gray and David R. Cheriton
url: http://web.stanford.edu/class/cs240/readings/leases.pdf
kind: paper
primary: true
---

## Summary

The SOSP 1989 paper that named and analysed leases. A lease gives its
holder rights over some data for a limited time; the server must get the
holder's approval, or wait for the term to run out, before letting anyone
else write. Failures then cost time, not correctness, as long as clocks
behave. It works out how long a term should be (short terms of a few
seconds do nearly as well as long ones) and which clock failures break it.
Read as a scanned PDF (OCR text), sections 1 to 6.

## Key claims

- Definition: a lease is a contract giving rights for a limited time. "A lease is a contract that gives its holder specified rights over property for a limited period of time." (section 2)
- Leases turn failures into delays rather than errors. "Non-Byzantine failures affect performance, not correctness, with their effect minimized by short leases." (abstract)
- A write waits until each holder approves or its lease runs out. "When a client writes a datum, the server must defer the request until each leaseholder has granted approval or the term of its lease has expired." (section 2)
- An unreachable holder only delays the writer until the term ends. "If some host holding a lease for this file is unreachable, the delay continues until the lease expires." (section 2)
- A server restarting after a crash must still honor leases it granted; the simple way is to wait out the longest term. "When a server is recovering after crashing, it must honor the leases it granted before it crashed." (section 2)
- Short terms reduce false sharing (a conflict with a holder that isn't using the data). "Short leases also minimize the false write-sharing that occurs." (section 2)
- Long terms cut traffic for data that is read a lot and rarely written. "Longer-term leases are significantly more efficient both for the client and server" (section 2)
- In their model of the V system, a term of a few seconds gets most of the benefit: at one sharer, 10 seconds cuts consistency traffic to a tenth of a zero term's. "a term of 10 seconds reduces the consistency traffic to 10% of that for a zero term." (section 3)
- The client's effective term is shorter than the server's, by the message delay and an allowance for clock skew, ε. "allowance for uncertainty in clocks" (Table 1, the ε parameter)
- Leases need well-behaved clocks. "Leases depend on well-behaved clocks." (section 5)
- A fast server clock or a slow client clock breaks consistency; the opposite errors only cost extra traffic. "a server clock that advances too quickly can cause errors because it may allow a write before the term of a lease held by a previous client has expired at that client." (section 5)
- "The opposite errors-a slow server clock or fast client clock-do not result in inconsistencies" (section 5)
- Only bounded drift is needed if the term is sent as a duration. "in which case the lease term can be communicated as its duration" (section 5)
- Breakable locks with timeouts (Xerox DFS) look like leases but, since clients don't know the timeout, degenerate into a zero-term lease. "clients do not use the lock timeout value and they are not reliably notified when a lock is broken" (section 6)

## Visuals worth redrawing

- None as figures; the timing relationship (server term vs the client's
  shorter effective term, minus delay and ε) is worth drawing as a timeline.

## My notes

- The PDF is a scan; quotes above are copied from its OCR text, picked
  where the OCR is clean.
- The paper is about file caches, not locks; the lock use is the same idea
  applied to "control over writes".
