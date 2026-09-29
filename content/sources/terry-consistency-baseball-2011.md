---
id: terry-consistency-baseball-2011
title: "Replicated Data Consistency Explained Through Baseball"
author: Doug Terry
url: https://www.microsoft.com/en-us/research/wp-content/uploads/2011/10/ConsistencyAndBaseballReport.pdf
kind: paper
primary: true
---

## Summary

A Microsoft Research technical report (2011, later in CACM, 2013) that
defines six read guarantees in plain terms (strong, eventual,
consistent prefix, bounded staleness, monotonic reads, read my writes)
and shows, with a replicated baseball score, which score each one lets
a reader see and which guarantee each person at the game actually
needs.

## Key claims

- Eventual consistency isn't enough for most readers, and strong isn't needed. "Eventual consistency is insufficient for most of the participants, but strong consistency is not needed either." (abstract)
- Stronger consistency costs performance and availability. "Offering stronger consistency generally results in lower performance and reduced availability for reads or writes or both." (1)
- The model: writes are applied in the same order everywhere, reads may be old. "Writes are serialized and eventually performed in the same order at all servers." (2)
- Each guarantee is defined by which earlier writes a read may see. "Each guarantee is defined by the set of previous writes whose results are visible to a read operation." (2)
- Table 1, strong. "Strong Consistency See all previous writes." (Table 1)
- Table 1, eventual. "Eventual Consistency See subset of previous writes." (Table 1)
- Strong consistency: a read sees all completed writes. "In other words, a read observes the effects of all previously completed writes." (2)
- Eventual is the weakest: any subset of writes. "More generally, such a read can return results from a replica that has received an arbitrary subset of the writes to the data object being read." (2)
- Consistent prefix: a state that existed at the master at some time. "In other words, the reader sees a version of the data store that existed at the master at some time in the past." (2)
- Bounded staleness is usually a time bound. "Typically, staleness is defined by a time period T, say 5 minutes." (2)
- Monotonic reads is a session guarantee. "As such, it is often called a “session guarantee.”" (2)
- Monotonic reads: stale but never older than before. "With monotonic reads, a client can read arbitrarily stale data, as with eventual consistency, but is guaranteed to observe a data store that is increasingly up-to-date over time." (2)
- Read my writes. "It guarantees that the effects of all writes that were performed by the client are visible to the client’s subsequent reads." (2)
- The last four are between eventual and strong, and none is stronger than another. "None of these four guarantees is stronger than any of the others, meaning that each might result in a read operation returning a different value." (2)
- Strong reads usually need a majority of replicas. "strong consistency is desirable from a consistency viewpoint but offers the worst performance and availability since it generally requires reading from a majority of replicas." (2, Table 2)
- In the example game the score is 2-5, and an eventual read can return any of 18 scores. "A strong consistency read can only return one result, the current score, whereas an eventual consistency read can return one of 18 possible scores." (3)
- Many of those scores never happened. "Observe that many of these scores are ones that were never the actual score." (3)
- Consistent prefix only returns real past scores. "The consistent prefix property limits the result to scores that actually existed at some time." (3)
- The scorekeeper needs up-to-date data but can get it with read my writes, because only he writes. "Since the scorekeeper is the only person who updates the score, he can request the read my writes guarantee and receive the same effect as a strong read." (4.1)
- A strong read must assume anyone anywhere just wrote. "In processing a strong consistency read the storage system must pessimistically assume that some client, anywhere in the world, may have just updated the data." (4.1)
- Read my writes only needs a server that has seen this client's writes. "the system simply needs to record the set of writes that were previously performed by the client and find some server that has seen all of these writes." (4.1)
- The radio reporter needs consistent prefix and monotonic reads; neither alone is enough. "Observe that neither guarantee is sufficient by itself." (4.3)
- The sample game: the home team leads 2-5 in the seventh inning. "This hypothetical game is currently in the middle of the seventh inning (the proverbial seventh-inning stretch), and the home team is winning 2-5." (3)
- Table 3, consistent prefix row. "Consistent Prefix 0-0, 0-1, 1-1, 1-2, 1-3, 2-3, 2-4, 2-5" (Table 3)
- Table 3, bounded staleness row. "scores that are at most one inning out-of-date: 2-3, 2-4, 2-5" (Table 3)
- Table 3, monotonic reads row. "after reading 1-3: 1-3, 1-4, 1-5, 2-3, 2-4, 2-5" (Table 3)
- An eventual read can return 1-0, a lead the visitors never had. "such a read might return a score with the visitors leading 1-0, even though the visiting team has never actually been in the lead." (4.3)
- The radio reporter could read 2-5 and then, 30 minutes later, 1-3. "For the line score in Figure 3, the reporter could read a score of 2-5, the current score, and then, 30 minutes later, read a score of 1-3." (4.3)
- The umpire must use strong reads. "Thus, in order to receive up-to-date information, the umpire must perform strong consistency reads." (4.2)
- A fan checking season statistics is fine with eventual reads. "Others who periodically check on the team’s season statistics are usually content with eventual consistency." (4.6)
- Some stores already offer a choice per read. "Amazon’s SimpleDB, for example, provides both eventually consistent reads and consistent reads, with the latter experiencing a higher read latency and reduction in read throughput" (1)
- A scorekeeper who reads a stale score writes a wrong one. "Otherwise, the scorekeeper runs the risk of writing an incorrect score and undermining the game, not to mention inciting a mob of angry baseball fans." (4.1)

- The sample game's writes, in order (Figure 2). "In this game, the home team scored first, then the visitors tied the game, then the home team scored twice more, and so on." (3, Figure 2: home 1, visitors 1, home 2, home 3, visitors 2, home 4, home 5)
- The score is written as visitors first. "Note that the visitors’ score is listed first" (3)
- Table 3, read my writes row. "for the writer: 2-5" and, for anyone else, the same 18 scores as eventual. (Table 3)
- The umpire's one need for the score is deciding whether the home team skips its last at bat. "the home team has already won if they are ahead in the score; thus, the home team can and does skip its last at bat in some games." (4.2)
- The radio station reports every 30 minutes. "In the San Francisco area, for example, KNBR reports sports news every 30 minutes." (4.3)

## Visuals worth redrawing

- Table 3: the scores each guarantee may return for the sample game.
  Good as a small table in an article.

## My notes

- Terry calls it "read my writes"; most other sources say "read your
  writes". Same guarantee.
