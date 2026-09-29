---
id: nowojski-flink-end-to-end-exactly-once-2018
title: An Overview of End-to-End Exactly-Once Processing in Apache Flink (with Apache Kafka, too!)
author: Piotr Nowojski, Mike Winters
url: https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/
kind: blog
primary: true
---

## Summary

The Flink blog post (2018, Flink 1.4.0) explaining how a sink ties an
external transaction to Flink's checkpoints: the checkpoint is the
pre-commit phase of a two-phase commit, the completion notice is the
commit, with a file sink as the worked example.

## Key claims

- Exactly-once means each event affects the result once. "each incoming event affects the final results exactly once." (Exactly-once Semantics Within an Apache Flink Application)
- External systems must commit or roll back in step with checkpoints. "these external systems must provide a means to commit or roll back writes that coordinate with Flink’s checkpoints." (Exactly-once Semantics Within an Apache Flink Application)
- One transaction per checkpoint interval. "A commit bundles all writes between two checkpoints." (End-to-end Exactly Once Applications)
- Checkpoint start is the pre-commit phase. "The starting of a checkpoint represents the “pre-commit” phase of our two-phase commit protocol." (End-to-end Exactly Once Applications)
- The completion callback is the commit phase. "This is the commit phase of the two-phase commit protocol and the JobManager issues checkpoint-completed callbacks for every operator in the application." (End-to-end Exactly Once Applications)
- After pre-commit, commit must eventually succeed. "After a successful pre-commit, the commit must be guaranteed to eventually succeed – both our operators and our external system need to make this guarantee." (End-to-end Exactly Once Applications)
- A failed commit restarts the job and retries. "If a commit fails (for example, due to an intermittent network issue), the entire Flink application fails, restarts according to the user’s restart strategy, and there is another commit attempt." (End-to-end Exactly Once Applications)
- File example, begin: a temp file. "to begin the transaction, we create a temporary file in a temporary directory on our destination file system." (Implementing the Two-Phase Commit Operator)
- File example, pre-commit: flush and close. "on pre-commit, we flush the file, close it, and never write to it again." (Implementing the Two-Phase Commit Operator)
- File example, commit: atomic move, later visibility. "on commit, we atomically move the pre-committed file to the actual destination directory. Please note that this increases the latency in the visibility of the output data." (Implementing the Two-Phase Commit Operator)
- File example, abort: delete. "on abort, we delete the temporary file." (Implementing the Two-Phase Commit Operator)
- Crash between pre-commit and commit, so the checkpoint must hold enough to finish. "We must save enough information about pre-committed transactions in checkpointed state to be able to either abort or commit transactions after a restart." (Implementing the Two-Phase Commit Operator)
- So commit must be idempotent. "It is our responsibility to implement a commit in an idempotent way." (Implementing the Two-Phase Commit Operator)
- Kafka transactions arrived in 0.11. "Kafka introduced transactions for the first time in Kafka 0.11, which is what made the Kafka exactly-once producer possible in Flink." (Wrapping Up)
- Pre-commit also opens the next transaction. "We’ll also start a new transaction for any subsequent writes that belong to the next checkpoint." (Implementing the Two-Phase Commit Operator)
- On restore, the sink commits pre-committed transactions again. "it always issues a preemptive commit when restoring state from a checkpoint." (Implementing the Two-Phase Commit Operator)
- How the file sink recognizes an already-done commit. "the temporary file is not in the temporary directory, but has already been moved to the target directory." (Implementing the Two-Phase Commit Operator)
- A commit that never succeeds loses data. "if the commit does not eventually succeed, data loss occurs." (End-to-end Exactly Once Applications)
- Flink 1.4.0 introduced TwoPhaseCommitSinkFunction for this. "introduced a significant milestone for stream processing with Flink: a new feature called TwoPhaseCommitSinkFunction" (introduction)

## Visuals worth redrawing

- The four-step pre-commit/commit figures around a Kafka-to-Kafka job.

## My notes

- TwoPhaseCommitSinkFunction, the class this post introduces, was removed in Flink 2.0 (see flink-2-0-release-2025); the same idea lives in Sink V2's SinkWriter and Committer.
