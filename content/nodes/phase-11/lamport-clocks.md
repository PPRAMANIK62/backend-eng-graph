---
id: lamport-clocks
title: Lamport clocks
depth: short
phase: 11
note: >-
  A counter that orders events by cause, not by wall time.
needs: [clock-skew]
leads_to: [vector-clocks, hybrid-logical-clocks, causal-consistency]
compare_with: [replicated-state-machine, id-generation]
---

# Lamport clocks

A Lamport clock is a counter in every process. It goes up by one at every
event, it rides along on every message, and a process that receives a
message moves its counter past the sender's. The result is a number for
every event that never contradicts cause and effect, without anyone
reading a real clock. It's the simplest answer to [[clock-skew]]: if wall
clocks can't order events, count instead.

## What "happened before" means

In a [[distributed-system|distributed system]] you often can't say which of two events came
first. Leslie Lamport's 1978 paper replaced "earlier in time" with a
relation you can actually observe. Event a *happened before* event b if:

- a and b are in the same process and a came first, or
- a is sending a message and b is receiving that same message, or
- there's a chain of those two steps from a to b.

If neither happened before the other, the two events are **concurrent**:
neither could have affected the other, whatever the wall clocks said.
This is a partial order. Some pairs of events simply have no order.

## Two rules for the counter

A logical clock should give every event a number C so that if a happened
before b, then C(a) < C(b). Two rules are enough:

1. **Tick.** A process adds one to its counter before each event.
2. **Carry and catch up.** A message carries the sender's counter. The
   receiver sets its own counter higher than both its current value and
   the message's: max(own, message) + 1.

![Three process timelines P, Q and R with events a to g. P's event a has counter 1 and sends a message carrying 1 to Q. Q's event c is 1, then d receives the message and becomes max(1,1)+1 = 2, then e is 3 and sends a message carrying 3 to R. R's event f is 1, then g receives the message and becomes max(1,3)+1 = 4. P's later event b is 2. b and e are highlighted: b is 2 and e is 3, but neither caused the other.](img/lamport-clocks-counters.svg)

*Counters on three processes. Adapted from Leslie Lamport, "Time, Clocks, and the Ordering of Events in a Distributed System", figures 1 and 2 (1978).*

Follow any message arrow and the number goes up. Follow any process line
and it goes up. So along every chain of cause and effect, the numbers
only increase.

## From a partial order to a total one

Two events can have the same counter, like a and c above. Break ties with
a fixed order of process ids, and you get a **total order**: compare
(counter, process id) pairs. Every event now has a place in one line, and
every process that knows the same events puts them in the same line.

That's what the counter is really for. Lamport used it to build a
[[mutex|mutual exclusion]] algorithm with no central coordinator: requests are served in
timestamp order. Then he generalised it. If every process applies the
same commands in timestamp order, they all end up in the same state,
which is the idea behind a [[replicated-state-machine]].

The total order is one of many valid ones. A different tie-break, or
different but valid counters, gives a different line. Only the
happened-before relation is fixed by what actually happened.

## Where it gets tricky

**It only works one way.** If a happened before b, then C(a) < C(b). The
reverse is false: C(b) < C(e) tells you nothing. In the figure, b is 2
and e is 3, but they're concurrent. To tell "happened before" apart from
"concurrent" by looking at timestamps, you need one counter per process,
which is [[vector-clocks]].

**Causes outside the system are invisible.** Lamport's own example: you
make a request on one computer, then phone a friend in another city who
makes a request on a different computer. Your request caused theirs, but
no message inside the system carried that, so their request can get the
lower timestamp. The fix is to carry the timestamp across the outside
channel yourself: pass along the counter you saw, and ask for something
later than it.

**No link to real time.** A Lamport counter can't answer "what happened
at 3 pm?", and it can't tell a crashed process from a slow one
([[failure-detection]]). Detecting
failure needs physical time. [[hybrid-logical-clocks]] keep the counter's
guarantee while staying close to the wall clock.

## What this means when you build

- Put a counter on every message and update it with the two rules. It
  costs one integer.
- Use (counter, node id) whenever you need every node to agree on one
  order of events without a leader handing out sequence numbers.
- Don't read "smaller timestamp" as "caused" or "earlier". It means only
  "wasn't caused by".
- If a user or another system can carry causality around yours, give
  them the timestamp to pass back.

## Further reading

- [Time, Clocks, and the Ordering of Events in a Distributed System](https://lamport.azurewebsites.net/pubs/time-clocks.pdf), Leslie Lamport, 1978. The original: happened-before, the two clock rules, the total order and the phone-call anomaly. Short and readable.
- [Logical Physical Clocks and Consistent Snapshots in Globally Distributed Databases](https://cse.buffalo.edu/tech-reports/2014-04.pdf), Sandeep Kulkarni et al., 2014. Section 1 sums up what Lamport clocks can't do, as the motivation for hybrid logical clocks.
