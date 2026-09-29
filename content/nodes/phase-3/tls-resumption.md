---
id: tls-resumption
title: TLS session resumption
depth: short
phase: 3
note: >-
  Skipping most of the handshake on a repeat visit, and the replay risk
  of 0-RTT.
needs: [tls]
leads_to: []
compare_with: []
---

# TLS session resumption

When a client comes back to a server it has talked to recently, it
doesn't need the whole [[tls|TLS]] handshake again. Resumption reuses a
secret from the last connection, so the server skips sending its
certificate chain and signing the handshake. TLS 1.3 adds a riskier
step on top, 0-RTT, where the client sends its request in the very
first message. That saves a round trip, and in exchange the request can
be replayed.

## Tickets: a secret for next time

After a full handshake, the server sends the client a
**NewSessionTicket**. It carries an identity for a secret derived from
this connection, a pre-shared key (PSK). The server can keep that PSK in
its own session store and hand out a lookup key, or encrypt the state
with a key only it knows and hand out the whole thing as the ticket.
The second, stateless kind is the popular one. The client stores the ticket. A ticket may live at most
7 days.

Next time, the client's ClientHello includes the ticket. If the server
accepts it, both sides already share a secret, so the server doesn't
send a Certificate or CertificateVerify. The handshake shrinks to
hellos and Finished messages.

In TLS 1.3 a resumed handshake still takes one round trip, the same as
a full one. What it saves is work: no certificate chain on the wire and
no public-key signature on the server. For a busy server that adds up,
which is why resumption counts as an essential performance feature.

The client should also send a fresh Diffie-Hellman key share alongside
the ticket. Then the resumed connection mixes in a new key exchange and
keeps forward secrecy. Resuming with the PSK alone skips that, and
loses it.

## 0-RTT: the request in the first packet

With a ticket in hand, the client can go further: encrypt application
data with a key derived from the PSK and send it right behind the
ClientHello, before any reply. This is **early data**, or 0-RTT.

![Timeline of a 0-RTT resumption. The client sends ClientHello with the ticket, a key share and an early_data flag, and immediately after it the first request encrypted with the early data key. The server replies with ServerHello, EncryptedExtensions accepting early data, Finished, and the response to the early request. The client sends EndOfEarlyData and Finished. The early request arrives before any round trip has completed. An attacker who copied the first flight can send it again to the server.](img/tls-resumption-0rtt.svg)

*A 0-RTT handshake. Adapted from Eric Rescorla, RFC 9846, "The Transport Layer Security (TLS) Protocol Version 1.3", figure 4 (2026).*

When Cloudflare launched 0-RTT in 2017, about 40% of the HTTPS
connections it saw were resumptions, so a round trip saved there
mattered.

The early data has weaker guarantees than anything else in TLS:

- **It can be replayed.** Nothing from the server goes into the early
  data's keys, so an attacker who copies the first flight can send it
  to the server again, on a new connection, and the server may process
  it twice.
- **It isn't forward secret** by default. Its key comes from the ticket
  alone.

Within one connection, TLS still won't process the same early data
twice, and an attacker can't make 0-RTT data pass as normal data.

## Stopping replays

Each server instance must accept a given 0-RTT handshake at most once.
There are two main ways to do that:

- **Single-use tickets.** Keep every outstanding ticket in a database
  and delete it on use. Strong, but every server in the fleet has to
  share that database.
- **Recording ClientHellos.** Remember a unique value from each recent
  ClientHello and reject repeats. To keep the record bounded, the client
  reports how old its ticket is, and the server only accepts 0-RTT
  inside a freshness window, on the order of ten seconds for internet
  clients.

Even then, "at most once per instance" means a fleet of servers can
still see one replay per instance, unless one place is in charge of
each ticket. And one kind of replay can't be stopped by TLS at all: a
client whose 0-RTT data is rejected may resend it after the handshake,
so the same request arrives once as early data and once as normal data.

## Where it gets tricky

**Only replay-safe requests belong in 0-RTT.** The client can't know
which anti-replay method the server uses, so clients must send only
data that's safe to replay. Cloudflare took the strict line
at launch: it answered only GET requests without query parameters over
0-RTT, capped their size, and added a header so the origin could spot
replays. It later turned 0-RTT off by default. A GET that changes
state is exactly the request 0-RTT can hurt.

**Ticket keys are a secret worth stealing.** Whoever has the key that
encrypts tickets can decrypt the resumption secrets inside them. Rotate
ticket keys regularly (the IETF's example is weekly) and destroy old
ones, or resumption quietly undoes forward secrecy.

**A fleet needs shared ticket keys.** If each server behind a
[[load-balancing|load balancer]] has its own ticket key, a ticket from one server is useless on
the next, and clients fall back to full handshakes.

**Tickets can track clients.** A reused ticket links two connections
for anyone watching, so clients shouldn't reuse them and servers should
issue a fresh one on every connection.

## What this means when you build

- Leave resumption on, and share and rotate ticket keys across every
  server that answers for the same name.
- Keep 0-RTT off unless you've checked that every request that could
  land in it is safe to run twice.
- Make state-changing endpoints idempotent anyway. Clients retry, with or
  without 0-RTT.

## Further reading

- [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846), Eric Rescorla, IETF, 2026. Sections 2.2 and 2.3 for resumption and 0-RTT, 4.7.1 for tickets, and 8 for anti-replay.
- [Introducing Zero Round Trip Time Resumption (0-RTT)](https://blog.cloudflare.com/introducing-0-rtt/), Nick Sullivan, Cloudflare, 2017. How often resumption happens in practice and how one large deployment limited replay risk.
- [RFC 9325](https://www.rfc-editor.org/rfc/rfc9325), Yaron Sheffer, Peter Saint-Andre and Thomas Fossati, IETF, 2022. Rules for session tickets: encryption, key rotation, and lifetimes.
- [crypto/tls](https://pkg.go.dev/crypto/tls), the Go authors, Go 1.27. Ticket key rotation in a real server, and sharing keys across servers that answer for the same host.
