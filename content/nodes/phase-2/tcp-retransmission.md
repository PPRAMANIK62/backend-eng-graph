---
id: tcp-retransmission
title: TCP retransmission
depth: deep
phase: 2
note: >-
  How TCP notices a lost segment and sends it again: the retransmission
  timeout, duplicate ACKs, SACK and RACK-TLP.
needs: [tcp]
leads_to: [congestion-control, head-of-line-blocking]
compare_with: []
---

# TCP retransmission

[[tcp|TCP]] promises that every byte arrives, so the sender keeps a copy
of everything not yet acknowledged and sends it again once it decides
it was lost. It decides in two ways: a timer runs out, or the ACKs
coming back show a gap. The timer is slow, so how fast TCP recovers
from a loss depends mostly on whether the second way works.

## The retransmission timer

Start with one connection and one segment. The sender notes when it
sent the segment, and when the ACK comes back, the gap is a round-trip
time sample. From those samples it keeps two numbers: a smoothed
average (SRTT) and a measure of how much the samples vary (RTTVAR).
The retransmission timeout is:

RTO = SRTT + 4 × RTTVAR

Here's how that plays out, with made-up samples and the update rules
from RFC 6298 (2011), ignoring the clock granularity term:

| Sample | SRTT | RTTVAR | RTO |
|---|---|---|---|
| none yet | – | – | 1 s |
| 100 ms (first) | 100 ms | 50 ms | 300 ms |
| 100 ms | 100 ms | 37.5 ms | 250 ms |
| 180 ms | 110 ms | 48.1 ms | 302.5 ms |

Before any sample, the RTO is 1 second. The first sample sets SRTT to
that sample and RTTVAR to half of it. After that, each new sample moves
SRTT an eighth of the way toward itself, and RTTVAR a quarter of the
way toward how far the sample landed from SRTT. Steady round trips
shrink RTTVAR, so the timeout closes in on the round trip itself. One
slow sample makes it jump back out. (The spec would round every one of
these up to 1 second; more on that floor below.)

When the timer fires, the sender resends the oldest unacknowledged
segment and **doubles** the RTO. Each further timeout doubles it again,
so a dead path is probed less and less often. The spec allows a cap as
long as it's at least 60 seconds; Linux caps it at 120 seconds by
default (`tcp_rto_max_ms`). A 2019 Cloudflare trace on Linux 5.2 shows
the pattern: gaps starting around 200 ms, roughly doubling, levelling
off near two minutes, and the connection killed after about 15
retransmissions. How long TCP keeps trying before it gives up is
covered in [[tcp]], and how an idle connection notices a dead peer at
all is [[tcp-keepalive]].

Two details matter:

- **Karn's rule.** If a segment was sent twice, an ACK for it doesn't
  say which copy it answers, so it isn't used as a sample. The TCP
  timestamps option removes that ambiguity: with it, the sender can
  tell which copy an ACK answers. Linux turns timestamps on by default.
- **The floor.** The spec says to round the RTO up to at least
  1 second, to avoid resending data that wasn't really lost. Linux uses
  a 200 ms floor by default (`tcp_rto_min_us`). On a path with a 1 ms
  round trip, the floor is the whole timeout: the formula would give a
  few milliseconds, and you wait 200.

A timeout is also the harshest signal for [[congestion-control]]:
after one, the sender's congestion window drops to a single segment
and slow start begins again.

## Reading the ACKs: fast retransmit

The receiver always acknowledges the next byte it's missing, and while
it holds data past a gap, it sends an ACK for every segment that
arrives. Send five segments and lose the second:

![Sequence diagram. The sender sends segments 1 to 5; segment 2 is lost. The receiver answers segment 1 with "ACK 2", then answers segments 3, 4 and 5 with "ACK 2" again, three duplicates. On the third duplicate the sender resends segment 2 without waiting for the timer, and the receiver replies "ACK 6".](img/tcp-retransmission-dupack.svg)

*Three duplicate ACKs trigger a resend long before the timer would. Segments are numbered 1 to 5 for simplicity; real ACKs carry byte numbers.*

Segments 3, 4 and 5 each make the receiver repeat "I still need 2".
These **duplicate ACKs** tell the sender two things: segment 2 is
probably gone, and later segments are still getting through. Classic
TCP resends after the third duplicate, without waiting for the timer.
This is **fast retransmit**. Because packets are still flowing, the
congestion window is only halved, not reset.

## SACK: telling the sender what did arrive

A plain ACK is cumulative. It says "I have everything up to here" and
nothing about what's beyond the gap. Lose several segments from one
window and the sender learns about them one per round trip, or it
guesses and resends data that already arrived.

**Selective acknowledgment** (SACK, RFC 2018, 1996) fixes that. A side
that can handle SACK says so in its SYN with a SACK-permitted option.
After that,
an ACK can carry a SACK option listing the blocks of data the receiver
holds past the gap, each as a left edge and a right edge in sequence
numbers. The cumulative ACK number keeps its old meaning.

Take eight 500-byte segments starting at byte 5000, and lose the 2nd,
4th, 6th and 8th:

![Eight 500-byte segments starting at byte 5000, alternately received and lost: 5000 received, 5500 lost, 6000 received, 6500 lost, 7000 received, 7500 lost, 8000 received, 8500 lost. The cumulative ACK points at 5500. Three SACK blocks cover the received segments past the gap: block 1, the newest, is 8000 to 8500; block 2 is 7000 to 7500; block 3 is 6000 to 6500. The ACK on the wire reads ack 5500 with those three blocks. The sender resends only 5500, 6500 and 7500; 8500 has nothing after it, so no ACK shows it missing yet.](img/tcp-retransmission-sack-blocks.svg)

*One ACK with SACK shows every hole below the highest block. Adapted from the examples in RFC 2018, section 7.*

The rules keep the report useful when ACKs get lost too:

- The first block is always the one holding the segment that just
  arrived, so the newest news comes first.
- Older blocks are repeated in later ACKs, so each one is reported
  about three times.
- TCP options have 40 bytes, which fits 4 blocks, or 3 when timestamps
  are also in the header.

The sender marks what's been SACKed and skips it when resending. Any
unmarked segment below the highest SACKed byte is a hole it can fill.
Linux has SACK on by default (`tcp_sack`).

SACK is advice, not a promise. The receiver is allowed to throw away
data it SACKed if it runs short of memory (this is called reneging).
So the sender keeps its copy until the cumulative ACK passes it, and
after a timeout it forgets all SACK information and starts from the
cumulative ACK.

## When counting duplicates fails

Counting to three breaks in three cases:

- **Loss at the tail.** If the last segment of a response is lost,
  nothing comes after it to trigger duplicate ACKs or SACK blocks, like
  byte 8500 in the figure. Only the timer can save it.
  Request-and-response traffic, where every response has a tail, is hit
  hardest.
- **Lost retransmissions.** If the resent segment is lost too, duplicate
  counting doesn't notice, and again it's the timer. Token-bucket
  policers (rate limiters in the network) can lose retransmissions
  again and again.
- **Reordering.** Wi-Fi, bonded links and load-balanced routers can
  deliver segments out of order. Three duplicates may mean "late", not
  "lost", and TCP resends for nothing and cuts its window.

## RACK-TLP: detecting loss by time

**RACK-TLP** (RFC 8985, 2021, written by engineers at Google) replaces
counting with time. RACK remembers when each segment was sent. If a
segment sent later has already been acknowledged (usually through a
SACK block), and this one still hasn't after about a round trip plus a
small reordering allowance, it's lost. Every transmission counts, so a
SACK for a later retransmission can reveal that an earlier
retransmission was lost.

The reordering allowance adapts. It starts at zero, or at a quarter of
the smallest round trip seen, so short flows recover fast. When the
receiver reports that it got a duplicate (a D-SACK, a sign the sender
resent something that wasn't lost), RACK widens the window by
another quarter round trip, up to one smoothed round trip at most.
After 16 recoveries it drops back to the start.

TLP, the tail loss probe, handles the tail. If ACKs stop for about two
round trips, the sender resends its last segment (or sends a new one)
as a probe. The ACK for the probe, with its SACK blocks, gives RACK
what it needs to find the real holes, and recovery proceeds without
waiting for the timer.

In RFC 8985's example, a sender loses the last 3 of 100 segments.
Counting duplicates, recovery takes 3 round trips plus one RTO, with
the window reset. With RACK-TLP it's 4 round trips and only a partial
window cut.

## Retransmissions that weren't needed

The timer can fire when nothing was lost, only delayed. Mobile
handoffs, a switch to a slower path, a burst of competing traffic on a
slow link, or a link layer quietly retrying its own frames can all make
one round trip much longer than the RTO expected. That's a **spurious
timeout**. It costs twice: the window is cut to one segment for no
reason, and when the late ACKs for the originals arrive, a naive sender
reads them as progress in slow start and resends the whole window.

Three ways to catch it after the fact:

- **F-RTO** (RFC 5682, 2009) needs only the sender. After the timeout
  it resends the first segment, then sends new data instead of more
  retransmissions. If the first two ACKs after the timeout both move
  the window forward, and the second covers data that was never
  resent, the originals got through and the timeout was spurious.
- **Eifel** uses timestamps to check the first ACK after the
  retransmission: if it answers the original copy, the timeout was
  spurious.
- **D-SACK** has the receiver report duplicate segments in the first
  SACK block. It also catches resends caused by reordering, which is
  why RACK uses it to size its window.

RACK-TLP doesn't touch the RTO formula and doesn't detect spurious
timeouts itself; it works alongside F-RTO and Eifel.

## What Linux does today

From the kernel's sysctl documentation (the page built from 7.3.0-rc5):

- **RACK is the only loss detection.** `tcp_recovery` can't turn it
  off. One bit makes the reordering window a fixed quarter of the
  minimum round trip instead of adaptive.
- **TLP is on** (`tcp_early_retrans` = 3), and needs RACK.
- **SACK, D-SACK and timestamps are on** (`tcp_sack`, `tcp_dsack`,
  `tcp_timestamps`).
- **F-RTO is on** (`tcp_frto`), aimed at paths whose round trip jumps
  around, like wireless.
- **RTO floor 200 ms, cap 120 s** (`tcp_rto_min_us`,
  `tcp_rto_max_ms`). The floor can also be set per route and per socket
  (`TCP_RTO_MIN_US`), and those win over the sysctl.
- **Giving up**: `tcp_retries2` = 15 backed-off timeouts, which the
  docs put at a lower bound of about 924.6 seconds.

## Where it gets tricky

**Linux and the spec disagree on the floor.** RFC 6298's 1-second
minimum is a "should", and the RFC itself says research might justify
less. Linux's 200 ms default is well below it, and the kernel docs now
call 200 ms or less the recommended practice. Going lower still trades
faster recovery for more resends of data that was only delayed.

**Time beats counting, but it isn't free.** RACK needs the send time of
every segment, at a clock resolution finer than a quarter of the
minimum round trip. RFC 8985 itself points out that inside a data
center, where the round trip can be shorter than the sender's clock
tick, the older SACK-scoreboard method needs less state. And the
reordering timer can fire early like any other timer, especially if
the receiver doesn't send D-SACKs.

**Fast and careful pull in opposite directions.** RFC 6298 builds the
timer to be conservative: a TCP may be slower than its rules but never
more aggressive, and the floor is there to avoid needless resends. RACK
deliberately starts
with a tiny reordering window on short flows and accepts some
unnecessary resends, betting they cost less than waiting. F-RTO, Eifel
and D-SACK exist to clean up after that kind of bet.

**SACK can be taken back.** Because a receiver may drop data it
SACKed, the sender can't free those buffers early, and after a timeout
it throws the SACK picture away.

**Retransmission blocks the stream.** While a segment is being resent,
everything after it waits, because TCP delivers in order. That's
[[head-of-line-blocking]].

## What this means when you build

- A lost last packet can cost a full RTO (at least 200 ms on Linux)
  unless TLP catches it. Short responses feel losses more than bulk
  transfers.
- On a fast internal network, the 200 ms floor dominates any timeout.
  If that matters to you, measure before lowering `tcp_rto_min_us` or
  setting `TCP_RTO_MIN_US` on a socket, and watch for spurious
  retransmissions after.
- Leave SACK, D-SACK, timestamps, RACK, TLP and F-RTO on. They're the
  defaults, and each fixes a specific way the timer alone fails.
- Retransmission counters rising doesn't always mean loss. Reordering
  and delay spikes cause resends too.

## Further reading

- [RFC 6298](https://www.rfc-editor.org/rfc/rfc6298), Paxson, Allman, Chu and Sargent, IETF, 2011. How the RTO is computed and backed off, the 1-second floor, and Karn's rule.
- [RFC 5681](https://www.rfc-editor.org/rfc/rfc5681), Allman, Paxson and Blanton, IETF, 2009. Fast retransmit on three duplicate ACKs, and what a timeout does to the congestion window.
- [RFC 2018](https://www.rfc-editor.org/rfc/rfc2018), Mathis, Mahdavi, Floyd and Romanow, IETF, 1996. The SACK option, its block rules, reneging, and worked examples.
- [RFC 8985](https://www.rfc-editor.org/rfc/rfc8985), Cheng, Cardwell, Dukkipati and Jha, IETF, 2021. Why duplicate-ACK counting fails, how RACK and TLP detect loss by time, and the tradeoffs.
- [RFC 5682](https://www.rfc-editor.org/rfc/rfc5682), Sarolahti, Kojo, Yamamoto and Hata, IETF, 2009. What causes spurious timeouts and how F-RTO detects them; compares Eifel and D-SACK.
- [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel docs, 2026. Linux's RTO limits and the RACK, TLP, SACK, D-SACK and F-RTO defaults.
- [When TCP sockets refuse to die](https://blog.cloudflare.com/when-tcp-sockets-refuse-to-die/), Marek Majkowski, Cloudflare, 2019. A packet trace of exponential backoff on a connection whose packets are all dropped.
