---
id: yuan-simple-testing-2014
title: "Simple Testing Can Prevent Most Critical Failures: An Analysis of Production Failures in Distributed Data-Intensive Systems"
author: Ding Yuan, Yu Luo, Xin Zhuang, Guilherme Renna Rodrigues, Xu Zhao, Yongle Zhang, Pranay U. Jain and Michael Stumm (University of Toronto)
url: https://www.usenix.org/system/files/conference/osdi14/osdi14-paper-yuan.pdf
kind: paper
primary: true
---

## Summary

An OSDI 2014 study of 198 randomly sampled, user-reported failures in
Cassandra, HBase, HDFS, Hadoop MapReduce and Redis. Most failures needed a
few input events in a particular order and only a few nodes, and almost all
catastrophic ones came from bad handling of errors the code had already
detected. The authors built a static checker, Aspirator, for the simplest
of those mistakes.

## Key claims

- Scope. "We present the result of a comprehensive study investigating 198 randomly selected, user-reported failures" (Abstract)
- Almost all failures reproduce on three nodes or fewer. "almost all failures require only 3 or fewer nodes to reproduce" (Abstract)
- Order of inputs matters. "multiple inputs are needed to trigger the failures with the order between them being important." (Abstract)
- Finding 1: 77% need more than one input event, 90% need no more than three. "A majority (77%) of the failures require more than one input event to manifest, but most of the failures (90%) require no more than 3." (3)
- Finding 3: 98% manifest on at most three nodes, 84% on at most two. "Almost all (98%) of the failures are guaranteed to manifest on no more than 3 nodes." (3)
- Finding 10: 92% of catastrophic failures come from incorrect handling of non-fatal errors. "Almost all catastrophic failures (92%) are the result of incorrect handling of non-fatal errors explicitly signaled in software." (4)
- 58% of catastrophic failures could have been caught by simple tests of error-handling code. "in 58% of the catastrophic failures, the underlying faults could easily have been detected through simple testing of error handling code." (1)
- Finding 11: 35% are trivial mistakes: empty or log-only handlers, over-catching and aborting, TODO/FIXME handlers. "35% of the catastrophic failures are caused by trivial mistakes in error handling logic" (4.1)
- A quarter of catastrophic failures came from ignoring explicit errors, counting handlers that only log. "25% of the catastrophic failures were caused by ignoring explicit errors (an error handler that only logs the error is also considered as ignoring the error)." (4.1)
- 74% of failures are deterministic given the right inputs. "We found that 74% of the failures are deterministic in that they are guaranteed to manifest with an appropriate input sequence" (1)
- 77% of failures can be reproduced by a unit test. "77% of the failures can be reproduced by a unit test." (1)
- These systems were already tested with unit tests, random error injection and static checkers. "these systems have undergone thorough testing using unit tests, random error injections [18], and static bug finding tools such as FindBugs [32]" (1)

## Visuals worth redrawing

None.

## My notes

- The takeaway for fault injection: faults matter because they send the
  program into its error-handling paths, which are the least tested code.
