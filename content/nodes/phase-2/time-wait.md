---
id: time-wait
title: TIME_WAIT
depth: short
phase: 2
note: >-
  Why a closed TCP connection lingers, and how that can run a busy
  client out of ports.
needs: [tcp-handshake]
leads_to: []
compare_with: []
---

# TIME_WAIT

When a TCP connection closes, the side that closed first doesn't forget
it right away. It keeps the connection in the TIME_WAIT state for a
while, 60 seconds on Linux, and during that time the same four numbers
(two addresses, two ports) can't be used for a new connection. Most of
the time that's harmless. For a client opening many short connections
to one server, it can use up every port it has.

## How a connection gets there

[[tcp|TCP]] closes each direction separately, with a FIN that the other
side acknowledges. Say the client closes first:

![Sequence diagram of a normal close. Client and server start ESTABLISHED. The client sends FIN and enters FIN-WAIT-1; the server ACKs it and enters CLOSE-WAIT, and the client moves to FIN-WAIT-2. The server's application closes, the server sends its FIN and enters LAST-ACK. The client ACKs, enters TIME-WAIT and waits (2 MSL in the spec, a fixed 60 s on Linux) before CLOSED. The server goes to CLOSED when the ACK arrives.](img/time-wait-close-sequence.svg)

*A normal close. Only the side that closes first waits. Adapted from Wesley Eddy (editor), RFC 9293, "Transmission Control Protocol (TCP)", figure 12 (2022).*

The server is done the moment it receives the last ACK. The client,
which sent that ACK, has to wait. Which side ends up in TIME_WAIT
depends only on who called `close` first, not on who is client or
server.

## Why wait at all

TIME_WAIT has two jobs.

**Catch a lost last ACK.** If the client's final ACK is lost, the
server is still in LAST-ACK and will resend its FIN. The client has to
still remember the connection so it can ACK again. Without that, a new
connection on the same four numbers could run into a server that still
thinks the old one is open, and get reset.

**Let old segments die.** A segment from the old connection can be
delayed in the network. If a new connection with the same addresses and
ports started right away, that stray segment could arrive with a
sequence number that happens to fit, and be taken as new data. Waiting
long enough lets every such segment expire first.

The spec sets the wait at twice the maximum segment lifetime (MSL), and
defines MSL as 2 minutes. That's an engineering choice, not a
measurement. Linux uses a fixed 60 seconds, and there's no setting to
change it.

## When it bites

Each TIME_WAIT entry holds its four numbers for a minute. Picture a
[[load-balancing|load balancer]] opening a fresh connection to one backend for every
request. The backend's address and port are fixed, the load balancer's
address is fixed, so only the load balancer's source port changes. With
Linux's default ephemeral range of 28,232 ports (see
[[ports-and-sockets]]), that allows about 470 new connections a second
(28,232 ÷ 60 s) before `connect` starts failing with `EADDRNOTAVAIL`.

The memory cost, on the other hand, is small. A TIME_WAIT socket is a
cut-down structure, 168 bytes in the kernel Vincent Bernat measured in
2014, against 1,776 for a full TCP socket. By his count, 40,000 of them
take less than 10 MiB.

## What actually helps

- **Reuse connections.** A pool of long-lived connections creates
  hardly any TIME_WAIT at all, and skips a [[tcp-handshake|handshake]]
  per request too. This is the real fix.
- **More four-number combinations.** More source addresses, more
  backend ports or addresses, or a wider ephemeral range.
- **`net.ipv4.tcp_tw_reuse`.** Lets a new *outgoing* connection take
  over a TIME_WAIT slot after about 1 second, when TCP timestamps prove
  that old segments can be told apart. The current default is 2, which
  means loopback traffic only; 1 turns it on everywhere. It does nothing
  for incoming connections.
- **Let the server close first,** if you design the protocol. Then the
  TIME_WAIT lands on the server, which is usually better placed to hold
  it than a client with a limited supply of ports.

## Where it gets tricky

**A big TIME_WAIT count isn't a problem by itself.** `ss` showing tens
of thousands of TIME_WAIT sockets is normal on a busy machine. It
matters only when you run out of ports toward one destination.

**Old tuning advice is dangerous.** `net.ipv4.tcp_tw_recycle` shortened
TIME_WAIT for incoming connections too, and broke clients behind
[[nat|NAT]], because hosts behind one address don't share a timestamp
clock. Linux removed it in 4.12. Lowering `tcp_max_tw_buckets` just
destroys TIME_WAIT sockets early; the kernel docs say not to.

**Wrong knob.** `net.ipv4.tcp_fin_timeout` (60 seconds by default) is
about orphaned sockets stuck in FIN-WAIT-2. It doesn't change TIME_WAIT.

**Skipping it with a reset.** Disabling lingering with `SO_LINGER` can
make `close` send RST instead of FIN. There's no TIME_WAIT, but unsent
data is thrown away and the other side sees an error.

## Further reading

- [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293), Wesley Eddy (editor), IETF, 2022. Section 3.6: closing, TIME-WAIT and the 2 MSL rule.
- [Coping with the TCP TIME-WAIT state on busy Linux servers](https://vincent.bernat.ch/en/blog/2014-tcp-time-wait-state-linux), Vincent Bernat, 2014 (updated 2017). Why TIME_WAIT exists, what it costs on Linux, and what each fix really does.
- [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel docs, 2026. Current defaults for `tcp_tw_reuse`, `tcp_fin_timeout`, `tcp_max_tw_buckets` and the port range.
- [include/net/tcp.h](https://raw.githubusercontent.com/torvalds/linux/master/include/net/tcp.h), Linux kernel source, 2026. `TCP_TIMEWAIT_LEN`, the fixed 60-second TIME_WAIT, still hard-coded in the current kernel.
