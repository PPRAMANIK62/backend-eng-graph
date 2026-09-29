---
id: demers-epidemic-algorithms-1987
title: Epidemic Algorithms for Replicated Database Maintenance
author: Alan Demers, Dan Greene, Carl Hauser, Wes Irish, John Larson, Scott Shenker, Howard Sturgis, Dan Swinehart and Doug Terry (Xerox PARC)
url: https://bitsavers.org/pdf/xerox/parc/techReports/CSL-89-1_Epidemic_Algorithms_for_Replicated_Database_Maintenance.pdf
kind: paper
primary: true
---

## Summary

The Xerox PARC paper (PODC 1987, reissued as tech report CSL-89-1) that
brought epidemic theory to replicated databases. Compares direct mail,
anti-entropy (pairwise comparison with a random site) and rumor mongering
(spread a hot update until others already know it). Used in Xerox's
Clearinghouse name servers. Read the abstract, section 0 and section 1.1.

## Key claims

- Simple randomized algorithms that need little from the network still make every update reach every replica. "The algorithms are very simple and require few guarantees from the underlying communication system, yet they ensure that the effect of every update is eventually reflected in all replicas." (Abstract)
- Deployed in Xerox's Clearinghouse servers. "One of the algorithms has been implemented in the Clearinghouse servers of the Xerox Corporate Internet, solving long-standing problems of high traffic and database inconsistency." (Abstract)
- Direct mail: timely, but not fully reliable. "This is timely and reasonably efficient but not entirely reliable since individual sites do not always know about all other sites and since mail is sometimes lost." (0)
- Anti-entropy: pick a random site, compare, resolve differences; reliable but expensive. "Anti-entropy: every site regularly chooses another site at random and by exchanging database contents with it resolves any differences between the two." (0)
- Rumor mongering: spread a hot rumor to random sites, stop once too many already know it; cheap, but a small chance some site misses it. "Rumor cycles can be more frequent than anti-entropy cycles because they require fewer resources at each site, but there is some chance that an update will not reach all sites." (0)
- Both are epidemic processes. "Anti-entropy and rumor mongering are both examples of epidemic processes, and results from the theory of epidemics [Ba] are applicable." (0)
- A simple epidemic reaches everyone in time proportional to the log of the population. "starting with a single infected site this is achieved in expected time proportional to the log of the population size." (1.1)
- Replicas can only be fully consistent once updates stop. "The sites can become fully consistent only when all updating activity has stopped and the system has become quiescent." (0)
- For push anti-entropy the expected number of cycles is about log2(n) + ln(n) for large n. "For push, the exact formula is log2(n) + In(n) + 0(1) for large n [Pi]." (1.1; "In" and "0" are OCR for ln and O)
- With pull, a node stays unaware only if it keeps contacting unaware nodes; with push, only if nobody picks it; so pull converges much faster at the end. "For pull, a site remains susceptible after the i + 1st cycle if it was susceptible after the ith cycle and it contacted a susceptible site in the i + 1st cycle." (1.1)
- Anti-entropy is typically a backup behind a faster, less reliable method. "when anti-entropy is used as a backup for some other distribution" (1.1)
- Death certificates can't be kept forever; one strategy holds them for a fixed time, trading space against the risk of resurrection. "strategy is to hold death certificates for some fixed time" (2)
- Pull or push-pull beats push when only a few sites are left. "either pull or push-pull is greatly preferable to push, which behaves poorly in the expected case." (1.1)
- Deletes need death certificates, or old copies come back. "To remedy this problem we replace deleted items with death certificates, which carry timestamps and spread like ordinary data." (2)
- Why: deleting the local copy just lets anti-entropy copy the item back. "Just the opposite will happen: the propagation mechanism will spread old copies of the item from elsewhere in the database back to the site where we have deleted it." (2)
- Death certificates themselves have to be deleted at some point. "We still must decide when to delete the death certificates themselves or they will ultimately consume all available storage at the sites." (2)
- Anti-entropy is reliable but too costly to run often. "Anti-entropy is extremely reliable but requires examining the contents of the database and so cannot be used too frequently." (0)
- It started as a background process to recover from failed direct mail. "They proposed anti-entropy as a mechanism that could be run in the background to recover automatically from such failures [Bi]." (1.3)

## Visuals worth redrawing

- The push vs pull recurrence curves; better redrawn as "rounds vs sites
  still unaware".

## My notes

- Anti-entropy in Dynamo-style stores (phase 11 `anti-entropy`) comes from
  this line of work.
