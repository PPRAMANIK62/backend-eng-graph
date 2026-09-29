---
id: gjengset-students-guide-raft-2016
title: Students' Guide to Raft
author: Jon Gjengset
url: https://thesquareplanet.com/blog/students-guide-to-raft/
kind: blog
primary: false
---

## Summary

A long post (2016) by a teaching assistant for MIT's 6.824 (now 6.5840)
distributed systems class, listing the Raft bugs students hit over and
over: treating heartbeats as special, truncating logs wrongly, mixing up
nextIndex and matchIndex, acting on stale replies, snapshot recovery
gaps, and how to implement the "accelerated log backtracking" the paper
only sketches.

## Key claims

- Figure 2 of the paper must be followed exactly. "every single statement it makes should be treated, in specification terms, as MUST, not as SHOULD." (Implementing Raft)
- Treating figure 2 as an informal guide gives a mostly working implementation, then problems. "Doing this, you will quickly get up and running with a mostly working Raft implementation. And then the problems start." (Implementing Raft)
- Heartbeats aren't special; skipping the checks is dangerous. "By accepting the RPC, the follower is implicitly telling the leader that their log matches the leader's log up to and including the prevLogIndex included in the AppendEntries arguments." (The importance of details) [curly apostrophe]
- Only truncate on a real conflict. "If the follower has all the entries the leader sent, the follower MUST NOT truncate its log." (The importance of details)
- Why: a stale AppendEntries could take back entries already acknowledged. "truncating the log would mean "taking back" entries that we may have already told the leader that we have in our log." (The importance of details) [curly quotes]
- Reset the election timer only on AppendEntries from the current leader, when starting an election, or when granting a vote. "you should only restart your election timer if a) you get an AppendEntries RPC from the current leader" (Livelocks)
- Resetting the timer on every vote request lets outdated servers keep interrupting the ones that could win. "If you reset the election timer whenever someone asks you to vote for them, this makes it equally likely for a server with an outdated log to step forward as for a server with a longer log." (Livelocks)
- Implement the up-to-date check exactly, not by log length. "No cheating and just checking the length!" (Incorrect RPC handlers)
- A leader must not set commitIndex to an entry from an earlier term. "you specifically need to check that log[N].term == currentTerm." (Failure to follow The Rules)
- nextIndex is optimistic and for performance; matchIndex is conservative and for safety. "matchIndex is used for safety." (Failure to follow The Rules)
- Set matchIndex from the arguments you sent, not from current state. "the correct thing to do is update matchIndex to be prevLogIndex + len(entries[]) from the arguments you sent in the RPC originally." (Term confusion)
- Drop replies whose term differs from the term you sent in. "If the two are different, drop the reply and return." (Term confusion)
- Snapshots: a crash between saving the snapshot and saving the trimmed Raft state can make a server re-apply entries; persist the real index of the log's first entry. "a server could crash between persisting a snapshot and persisting the updated Raft state." (An aside on optimizations)
- Fast backup: follower returns conflictTerm and conflictIndex; leader jumps nextIndex past the whole conflicting term. "If it does not find an entry with that term, it should set nextIndex = conflictIndex." (An aside on optimizations)

## Visuals worth redrawing

None.

## My notes

- Secondary, but written from grading many real implementations; good for
  "where it gets tricky" in raft-log-replication.
