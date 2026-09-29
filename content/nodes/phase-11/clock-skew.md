---
id: clock-skew
title: Clock skew
depth: deep
phase: 11
note: >-
  Machine clocks drift and jump. NTP, wall vs monotonic clocks, and why
  timestamps can't order events safely.
needs: [distributed-system]
leads_to: [lamport-clocks, hybrid-logical-clocks, leases, id-generation, conflict-resolution, vector-clocks, distributed-transactions, distributed-rate-limiting, commit-wait]
compare_with: [event-time-vs-processing-time]
---

# Clock skew

Every machine keeps its own time with a cheap quartz oscillator that runs
a little fast or a little slow. So two machines never quite agree on what
time it is, and the software that keeps them close does it by nudging the
clock, and sometimes by jumping it. If your code compares timestamps from
different machines, or subtracts two wall-clock readings on one machine,
it can get the order wrong, or even the sign.

## Two clocks, one lost write

Start with a small example. Two app servers, A and B, write the same key
to a store that keeps whichever write has the later timestamp (last write
wins, one of the options in [[conflict-resolution]]). A's clock is right.
B's clock runs a bit behind.

A user saves a draft through A. A moment later the user saves again, and
this request lands on B. In real time, B's write is the newer one. But B
stamps it with its own clock, and that clock reads earlier than A's stamp.
The store compares the two stamps, keeps A's older draft and drops the
newer one. Nobody sees an error.

![Two timelines. The top line is real time: A's write happens first and B's write happens after it. Below, each write's timestamp is placed on a timestamp axis: B's stamp lands before A's stamp because B's clock is behind. The store keeps the write with the later stamp, A's older draft, and B's newer write is lost.](img/clock-skew-lost-write.svg)

*In real time B wrote last, but its slow clock gave it the earlier stamp, so last write wins keeps the wrong one.*

No bug was needed for this, only ordinary [[distributed-system|distributed
system]] conditions. Two words to keep apart:

- **Offset**, or skew: how far apart two clocks read at the same moment.
- **Drift**: how fast that gap grows, because two oscillators tick at
  slightly different rates. It's measured in parts per million (ppm).

To get a feel for the scale: NTP's error bookkeeping assumes a clock can
be off in rate by up to 15 ppm, which by its own arithmetic adds up to
about 1.3 seconds a day. Google's Spanner budgets a more cautious 200 µs
of drift per second for its machines. Left alone, clocks walk apart, so
something has to keep pulling them back.

## How NTP measures the gap

That something is usually NTP, the Network Time Protocol (version 4 is
RFC 5905, 2010). Primary servers are kept right by wire or radio
links to national time standards. Secondary servers copy time from them,
and clients copy from the secondaries, down a tree. NTP packets are
[[udp|UDP]] datagrams, and that's deliberate: a retransmission would
only add delay, and delay is error here.

A client can't read the server's clock directly. Any answer it gets is
already old by the time it arrives. So one exchange records four
timestamps:

![Sequence diagram between a client and an NTP server. The client stamps T1 on its own clock as it sends a request. The server stamps T2 when the request arrives and T3 when it sends the reply. The client stamps T4 when the reply arrives. Below the diagram: delay equals (T4 minus T1) minus (T3 minus T2), and offset equals half of ((T2 minus T1) plus (T3 minus T4)).](img/clock-skew-ntp-exchange.svg)

*One NTP exchange: two stamps on each clock. Adapted from David L. Mills et al., RFC 5905, figure 15 (2010).*

From those four numbers:

- **Round-trip delay** = (T4 − T1) − (T3 − T2): the whole trip, minus the
  time the server spent holding the request.
- **Offset** = ((T2 − T1) + (T3 − T4)) / 2: how far the server's clock is
  from the client's.

The offset formula averages the two directions, so it's exact only if the
request and the reply took the same time. Work it through: if the request
takes 30 ms and the reply 10 ms, the estimate is off by half the
difference, 10 ms, and nothing in the four timestamps can show it. That's
why a congested or lopsided network path makes time worse, not just
slower.

How close does it get? RFC 5905 gives typical figures, not promises: a
primary server within a few tens of microseconds, secondary servers and
clients on a fast LAN within a few hundred microseconds, and a few tens
of milliseconds when clients poll rarely (up to every 36 hours).

## Fixing a wrong clock: slew or step

Once NTP knows the offset, it has two ways to fix it.

- **Slew.** Run the clock slightly fast or slow until the gap closes.
  Time never jumps and never runs backwards, it just ticks at a slightly
  wrong rate for a while. NTPv4 does this for offsets under 125 ms.
- **Step.** Set the clock to the right value at once. If the clock was
  ahead, time jumps backwards. NTPv4 steps only when the offset is over
  125 ms and has stayed that way for 900 seconds. Above 1,000 seconds
  it should give up and exit with a message in the system log.

An administrator can also set the clock by hand. So the wall clock on a
single machine can jump in either direction, which is the second way
timestamps lie.

## Wall clock and monotonic clock

Operating systems deal with this by offering more than one clock. On
Linux, `clock_gettime` (man-pages 6.19) gives you, among others:

| Clock | Counts | Jumps when set? | Follows NTP's rate changes? |
|---|---|---|---|
| `CLOCK_REALTIME` | wall time since the Unix epoch | yes | yes |
| `CLOCK_MONOTONIC` | time since boot, not counting suspend | no | yes |
| `CLOCK_MONOTONIC_RAW` (Linux 2.6.28) | raw hardware time, not counting suspend | no | no |
| `CLOCK_BOOTTIME` (Linux 2.6.39) | time since boot, including suspend | no | yes |

The rule that falls out: use the wall clock to tell the time, and the
monotonic clock to measure how long something took. A monotonic reading
never goes backwards, but it means nothing on another machine: it's time
since that machine booted.

Your language's time library matters as much as the kernel. Go 1.9
changed `time.Now()` so that every value carries a monotonic reading as
well as the wall time, which makes subtracting two of them safe when the
wall clock is adjusted. Before that change, it wasn't, and that cost
Cloudflare an outage.

## The leap second that broke DNS

A leap second is a step everyone knows about in advance. Now and then UTC
adds an extra second. `CLOCK_REALTIME` pretends leap seconds don't exist,
so around one, NTP pulls it back by a second to stay in line with UTC.

During one such leap second, Cloudflare's [[dns|DNS]] server, written in Go, was
timing how long its upstream resolvers took to answer, with
`time.Now()`. The resolvers usually answered in a few milliseconds. When
the clock went back a second in the middle of a lookup, the measured time
came out negative. The server smoothed many samples, so after a few bad
ones the average itself went negative. That average was passed to Go's
`rand.Int63n`, which panics on a negative argument. At the peak about
0.2% of DNS queries were affected, and under 1% of HTTP requests through
Cloudflare saw an error. Their own summary of the root cause: the belief
that time can't go backwards. The fix was to check for a negative
duration and stop recording it (their postmortem is from 2017).

Large fleets now avoid the step altogether by **smearing**. Since 2008
Google has spread each leap second out instead of stepping. Its proposed
standard is a 24-hour linear smear from noon to noon UTC, during which
clocks run about 11.6 ppm slow; AWS uses the same smear. Nothing jumps,
but for that day smeared time differs from UTC, by up to about half a
second at the leap itself. Spanner's clock is Unix time with smearing too.
And leap seconds may stop being a problem: they're planned to be
discontinued.

## Why timestamps can't order events

Back to the lost write. Even with good NTP, two events on different
machines that happen closer together than the skew can't be ordered by
their timestamps. And the usual time APIs give you a single number, with
no hint of how wrong it might be.

Google's Spanner takes the other road. Its TrueTime API returns an
interval, earliest to latest, that is guaranteed to contain the true
time. It's served by time masters in every data center, with GPS
receivers or atomic clocks, and a daemon on every machine. In the 2012
paper the error bound, half the interval's width, typically grew from
about 1 to 7 ms between polls every 30 seconds. To order [[transaction|transactions]], a
commit waits until its timestamp is certainly in the past before anyone
may see it: [[commit-wait]], about 5 ms in their measurements.
Machines whose clocks drift past the assumed bound get evicted, and they
found bad CPUs six times more likely than bad clocks. You don't need
atomic clocks to take the lesson: physical time can order events only
if you know the error bound and are willing to wait it out.

Without that, you order events by something other than wall time:
[[lamport-clocks]] and [[vector-clocks]] order by cause, and
[[hybrid-logical-clocks]] mix a logical counter into physical time so
timestamps stay close to real time but never contradict cause and
effect.

## Where it gets tricky

**Monotonic doesn't mean steady.** `CLOCK_MONOTONIC` never jumps, but it
still speeds up and slows down with NTP's slewing. `CLOCK_MONOTONIC_RAW`
doesn't. And two reads in a row may return the same value on some
architectures, so a monotonic reading is not a unique ID.

**Suspend and pauses.** `CLOCK_MONOTONIC` stops while the machine is
suspended; `CLOCK_BOOTTIME` doesn't. A [[process-pauses|paused process]]
is a different problem with the same smell: a timestamp taken just
before a long pause is stale by the time the process uses it.

**NTP knows its error, your code doesn't.** NTP tracks a maximum error
for every measurement, but `clock_gettime` hands you one number. Code
that treats that number as exact has quietly assumed zero skew.

**Typical isn't guaranteed.** RFC 5905's figures are typical ones.
Spanner, with dedicated hardware, still saw its error bound spike from
network congestion and from time servers taken down for maintenance.
Plan for the tail, not the median.

**Smeared and unsmeared time disagree.** During a smear, a smeared clock
and one that steps can be about half a second apart. A fleet that mixes
the two kinds of time source has built in that much skew for a day.

## What this means when you build

- Measure durations with a monotonic clock. In Go since 1.9, subtracting
  two `time.Now()` values already does this; in C, use `CLOCK_MONOTONIC`.
- If a duration can come out negative, handle it instead of trusting it.
- Don't order writes from different machines by wall-clock timestamp
  unless losing some writes is acceptable. Use a single writer, or
  logical or hybrid clocks.
- Run NTP on every machine, use one kind of time source across the
  fleet, and alert on the offset NTP reports.
- When correctness depends on clocks, such as a [[leases|lease]] or an ID
  that embeds a timestamp (see [[id-generation]]), write down the skew
  you're assuming and what happens when it's exceeded.

## Further reading

- [RFC 5905](https://www.rfc-editor.org/rfc/rfc5905), David L. Mills et al., IETF, 2010. NTPv4: the four-timestamp exchange (section 8), typical accuracy (section 1), and the step and slew thresholds (section 11).
- [clock_getres(2), clock_gettime(2)](https://man7.org/linux/man-pages/man2/clock_gettime.2.html), Linux man-pages 6.19. What each Linux clock counts and what moves it.
- [Spanner: Google's Globally-Distributed Database](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), James C. Corbett et al., 2012. TrueTime: time as an interval, commit wait, and measured error bounds (sections 3 and 5.3).
- [How and why the leap second affected Cloudflare DNS](https://blog.cloudflare.com/how-and-why-the-leap-second-affected-cloudflare-dns/), John Graham-Cumming, Cloudflare, 2017. A short postmortem of a real outage from a clock going backwards.
- [Leap Smear](https://developers.google.com/time/smear), Google. How and why Google and AWS smear leap seconds instead of stepping.
- [Go 1.9 Release Notes](https://go.dev/doc/go1.9), The Go Authors. When Go's `time.Now()` started carrying a monotonic reading.
