---
id: distributed-snapshots
title: Distributed snapshots
depth: deep
phase: 16
note: >-
  Saving a consistent copy of a running job's state without stopping it:
  Chandy-Lamport, and the checkpoint barriers Flink uses.
needs: [stateful-stream-processing, offsets-and-commits]
leads_to: [transactional-sinks]
compare_with: [checkpoints]
---

# Distributed snapshots

A distributed snapshot is a saved copy of the state of every part of a
running distributed system, taken without stopping it, that fits
together as if it had been taken at one instant. Stream processors use
one as their checkpoint: after a crash they restore every operator from
it, rewind the inputs to the positions it recorded, and carry on as if
nothing had happened. If you build anything that keeps state across
several machines and has to survive a crash, this is how you save it.

## Why "everyone save now" doesn't work

Take a small job with three steps. A source reads click events from a
Kafka topic. A counter keeps a count per user (its
[[stateful-stream-processing|state]]). A sink writes the counts out.
Each step runs on a different machine and passes records to the next
over the network.

The simplest idea is to tell every step to save its state at noon. But
the machines have no shared [[clock-skew|clock]], and even if they
did, records are in flight between them. Say the source saves "I've read up to offset 100"
at noon, then sends record 101. The counter's noon comes a moment later,
after it has already counted record 101. Restore from that pair and the
source replays 101, so it gets counted twice. Flip the timing and the
counter saves before 101 arrives while the source saves after sending
it: now 101 is counted zero times.

The same problem shows up in the classic example. Picture two
processes passing a single token back and forth. Record one process
while it holds the token, then record the channel after the token has
left and entered it, and your picture has two tokens. Record them the
other way around and it has none. Neither state could ever happen.

A snapshot is consistent when nothing is counted twice or lost. If the
counter's saved state includes record 101, the source's saved position
must be past 101. If the source's position is past 101 but the counter
hasn't seen it yet, 101 must be saved as a message still in the
channel.

## Chandy and Lamport's markers

K. Mani Chandy and Leslie Lamport gave the standard answer in 1985. It
assumes processes that talk only through channels, and channels that
lose nothing and deliver in order (FIFO). A process can record only its
own state and the messages it sends and receives. The algorithm runs
alongside the real work and must not stop or change it.

The trick is a special message, a **marker**, sent on the same channels
as the data. Two rules:

- **Sending.** When a process records its state, it immediately sends a
  marker on every outgoing channel, before sending anything else on it.
- **Receiving.** When a process gets a marker on a channel:
  - if it hasn't recorded its state yet, it records it now, records
    that channel as empty, and sends its own markers;
  - if it already has, the channel's recorded state is every message
    that arrived on it after the process recorded itself and before the
    marker.

Any process can start by recording itself. The markers then spread
along the channels until every process that can be reached has
recorded. Because channels are FIFO, the marker
splits each channel's messages cleanly into "before the snapshot" and
"after", which is exactly the line that was missing in the noon
example.

The snapshot you get may not match any single moment the system was
actually in. That's fine. It's a state the system could have been in:
reachable from where recording started, and able to reach where
recording ended. For restarting after a crash, that's all you need. The
paper even names checkpointing as a use.

## Flink's barriers: the same idea, tuned for dataflows

A stream job isn't an arbitrary set of processes. Data flows one way,
from sources to sinks, and the sources read from a replayable log.
Flink's checkpoints use those two facts to save less than
Chandy-Lamport would.

The coordinator (Flink's JobManager) starts checkpoint *n* by telling
each source to inject a **barrier** into its stream. A barrier is
Flink's marker. It carries the checkpoint ID, travels in line with the
records, and never overtakes them. It splits the stream into records
that belong to checkpoint *n* and records that belong to the next one.
The source saves its position at that point, for Kafka the
[[offsets-and-commits|offset]] in each partition, and reports it to the
coordinator. Barriers are cheap, so several checkpoints can be in the
stream at once.

An operator with one input does the simple thing. When the barrier
arrives, it snapshots its state, forwards the barrier, and carries on.

An operator with several inputs, like a join, or any operator after a
[[shuffle]] (which reads from many upstream instances), has to **align**:

![Two input streams feed one operator. Barrier n has arrived on input 1, so the operator stops reading input 1 and buffers what comes after the barrier. It keeps reading input 2, whose records before barrier n still belong to this checkpoint. When barrier n arrives on input 2, the operator snapshots its state, sends barrier n downstream, and resumes both inputs, starting with the buffered records.](img/distributed-snapshots-alignment.svg)

*Barrier alignment on a two-input operator. Adapted from the Apache Flink docs, "Stateful Stream Processing", and Carbone et al., "State Management in Apache Flink" (VLDB 2017), figure 4.*

1. When barrier *n* arrives on one input, the operator stops reading
   that input. Anything behind the barrier belongs to checkpoint *n+1*
   and must wait.
2. It keeps processing the other inputs, since their records before
   barrier *n* still belong to checkpoint *n*.
3. When barrier *n* has arrived on every input, the operator emits
   barrier *n* downstream and snapshots its state. Every record before
   the barriers has changed the state, and no record after them has.
4. It unblocks its inputs and carries on, starting with what it held
   back.

When the barrier reaches the sinks and they acknowledge it, the
checkpoint is complete. What's saved is small: for each source, a
position in its input; for each operator, a pointer to its saved state.
No records in flight are saved at all. Alignment made sure every
channel was empty of checkpoint-*n* records at the moment each operator
recorded itself.

That's the difference from the original algorithm. Chandy-Lamport lets
every process record immediately and saves the in-flight messages as
channel state. Before Flink's approach, systems either stopped the
whole job to snapshot it (Naiad halted all processing, took the
snapshot, then resumed) or used markers and also logged every record
in transit so they could replay it. Flink's Asynchronous Barrier
Snapshotting, from a 2015 paper by the Flink team, does neither on
graphs without cycles. Jobs with loops still log the records traveling
back around the loop.

Writing the state out doesn't block processing either. The operator
only has to capture a consistent version quickly; a background thread
copies it to durable storage. The RocksDB backend marks the current
version so compaction won't discard it. The in-memory backend copies
its table and then copies an entry only when the operator changes it
while the snapshot is still being written.

## Recovering

After a failure, Flink picks the latest completed checkpoint *k*,
redeploys the job, gives each operator its state from *k*, and rewinds
every source to its saved position. Records after that position are
read again, but none of them are in the restored state, so each one
changes the state exactly once. If the snapshot was incremental, each
operator loads the last full snapshot and then applies the changes on
top.

The effects on state are exactly once. Output the job already wrote to
the outside world is a different problem, solved by
[[transactional-sinks]].

## When alignment hurts: unaligned checkpoints

Alignment blocks inputs, and a barrier can only move as fast as the
records ahead of it. Under [[backpressure]], buffers between operators
are full, so a barrier waits behind all of them. With a slow path
through the job, alignment can take hours.

Flink 1.11 added **unaligned checkpoints**. When the first barrier
reaches an operator's input buffers, the operator forwards it at once to the end of its output
buffers, overtaking the queued records, and saves those overtaken
records as part of the checkpoint. That's the original Chandy-Lamport
idea again: save channel state rather than wait for the channel to
drain. The costs:

- More data written per checkpoint, so it doesn't help when writing to
  checkpoint storage is the bottleneck.
- Only one unaligned checkpoint at a time.
- A record that takes a long time to process still delays the barrier.
- On recovery, [[watermarks]] are regenerated after the in-flight records
  are restored, which can change results for operators that read the
  current watermark per record.

A middle ground is the aligned-checkpoint timeout: start aligned, and
switch to unaligned if it takes too long. Flink 1.14 also added buffer
debloating, which shrinks the in-flight buffers so there's less for a
barrier to wait behind.

## Where it gets tricky

**How much alignment costs.** Flink's docs put it at a few milliseconds
usually, with occasional outliers. At King, on Flink 1.2.0 with 18
machines, parallelism 70 and 100 to 500 GB of state, alignment averaged
1.3 seconds per checkpoint. It didn't grow with state size. It grew
with the number of shuffles in the job and with parallelism, because
each shuffle is another place to wait.

**At-least-once mode.** Flink can skip alignment: an operator snapshots
when it has seen the barrier on every input but keeps processing all
inputs meanwhile. The snapshot for *n* then includes some records from
*n+1*, which are replayed after a restore and counted twice. A job made
only of maps and filters has no alignment to skip, so it stays exactly
once even in this mode.

**It needs a replayable input.** The snapshot saves positions, not
data. If the source can't rewind to a position, restoring state is
pointless because the records after it are gone.

**Checkpoints and savepoints.** Flink uses the same mechanism for two
things. Checkpoints are for crash recovery: Flink creates and deletes
them on its own, in the backend's native format, possibly incremental.
Savepoints are for planned work like upgrading Flink or changing the
job: you trigger and delete them, and they default to a portable
format.
Flink compares the pair to a database's recovery log and its backups.
Savepoints are always aligned. An unaligned checkpoint can't be
restored after a Flink minor version upgrade, or after a change to how
data is partitioned between operators.

**Not the database kind of checkpoint.** A database
[[checkpoints|checkpoint]] flushes dirty pages so recovery replays less
of the log. A stream checkpoint is the whole recovery point: the state
itself, plus where to rewind the input.

## What this means when you build

- Put the barrier in the data channel, not beside it. The whole
  algorithm depends on channels being FIFO.
- Save the source position inside the snapshot, as part of the same
  checkpoint. Committing offsets separately reopens the noon problem.
- Only a checkpoint that every sink has acknowledged counts. Recover
  from the latest complete one.
- Keep the snapshot off the hot path: capture a version quickly, write
  it in the background.
- Watch checkpoint duration and alignment time, especially under
  backpressure.
- The phase 16 lab's harness kills the processor mid-run and restores
  from the last checkpoint. That test checks exactly this mechanism.

## Further reading

- [Distributed Snapshots: Determining Global States of Distributed Systems](https://lamport.azurewebsites.net/pubs/chandy.pdf), K. Mani Chandy and Leslie Lamport, 1985. The original: consistent global states, the marker rules and why the result is usable.
- [Lightweight Asynchronous Snapshots for Distributed Dataflows](https://arxiv.org/pdf/1506.08603), Paris Carbone et al., 2015. Barrier snapshots without logging in-flight records, and how they compare with stopping the job.
- [Stateful Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/), Apache Flink docs, Flink 2.3. Barriers, alignment, recovery, unaligned checkpoints and at-least-once mode.
- [Checkpointing under backpressure](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpointing_under_backpressure/), Apache Flink docs, Flink 2.3. Why barriers stall, buffer debloating, and the limits of unaligned checkpoints.
- [Checkpoints vs. Savepoints](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpoints_vs_savepoints/), Apache Flink docs, Flink 2.3. Who owns which, the formats, and what each can survive.
- [State Management in Apache Flink](https://www.vldb.org/pvldb/vol10/p1718-carbone.pdf), Paris Carbone et al., VLDB 2017. The protocol's assumptions, asynchronous snapshots in each backend, and production numbers from King.
