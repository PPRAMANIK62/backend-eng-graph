---
id: ongaro-raft-dev-membership-bug-2015
title: "bug in single-server membership changes (raft-dev mailing list)"
author: Diego Ongaro
url: https://groups.google.com/g/raft-dev/c/t4xj6dJTP6E/m/d2D9LrWRza8J
kind: blog
primary: true
---

## Summary

Diego Ongaro's post to the raft-dev list (2015) announcing a safety bug in
the single-server membership changes from his dissertation, found by
Huanchen Zhang and Brandon Amos at CMU while formalizing it. Two competing
single-server changes made by leaders of different terms can end up with
majorities that don't overlap, and a committed entry can be overwritten.
The fix: a leader must commit an entry from its own term before it adds a
new configuration entry.

## Key claims

- The bug is in single-server changes, not joint consensus. "I need to announce a bug in the dissertation version of membership changes (the single-server changes, not joint consensus)." (opening)
- Raft needs every later quorum to contain someone who knows an earlier decision, even across membership changes. "It's essential to Raft that if one decision (vote or commitment) is made in one quorum (majority), a subsequent quorum will contain at least one server that's aware of the decision, and this is needed even across membership changes." (The bug)
- Within one term one leader keeps changes to one server apart; the bug crosses terms. "Within a single term, a single leader can easily ensure that one configuration and the next differ by at most one server. This bug shows up across term boundaries." (The bug)
- The failure is split brain. "It's possible for two concurrent, competing changes across term boundaries to have quorums that don't overlap with each other, causing a safety violation (split brain)." (The bug)
- Counter-example 1 starts from a 4-server cluster: S1 adds S5 (config D) and goes offline; S2 becomes leader of term 2 and removes S1 (config E = {S2, S3, S4}), committing it on S2 and S3; S1 then wins term 3 with votes from S1, S4, S5 and overwrites the committed E. "Note that S1 does not have the committed entry E in its log." (Counter-example 1)
- Scope: even-sized cluster, several changes requested concurrently, leadership lost. "In this event, data loss and permanent split brain could occur." (Scope and severity)
- Joint consensus is not affected. "This does not affect Raft implementations that use joint consensus" (Scope and severity)
- The fix. "a leader may not append a new configuration entry until it has committed an entry from its current term." (Proposed solution)
- In practice that means waiting for the new leader's no-op. "This change would mean rejecting or delaying membership change requests until the no-op entry is committed." (Proposed solution)
- Why it works: once a current-term entry is committed, older uncommitted configurations can never commit. "Once a leader has committed an entry in its current term, it knows it has the latest committed configuration, and no existing uncommitted configurations from prior terms can be committed anymore" (Proposed solution)
- No formal proof yet for membership changes of either type at the time. "We don't yet have a formal safety proof for the correctness of membership changes (of either type) in Raft." (Safety argument)

## Visuals worth redrawing

- Counter-example 1 as a table of five logs over seven steps.

## My notes

- Linked from the "Updates and Errata" section of the dissertation's GitHub
  README, which calls it an "important bug".
