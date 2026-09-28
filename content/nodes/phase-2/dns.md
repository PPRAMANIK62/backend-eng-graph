---
id: dns
title: DNS
depth: deep
phase: 2
note: >-
  How a name like api.example.com becomes an address: your stub
  resolver asks a recursive resolver, which walks from the root to the
  TLD to the authoritative servers.
needs: [udp, tcp]
leads_to: [dns-records, dns-caching, dnssec, encrypted-dns]
compare_with: []
---

# DNS

The Domain Name System turns a name like `api.example.com` into the
records your program asks for, most often an IP address. Almost every
outbound connection your service makes starts with a DNS lookup, so when
DNS is slow, wrong or down, everything that depends on names fails with
it, often in ways that look like some other bug.

## One lookup, from your program's side

Say your service calls `getaddrinfo("api.example.com", ...)` before
connecting to a partner's API. Your program doesn't speak to the
internet's name servers itself. The call goes to a **stub resolver**: a
set of routines in the C library that knows only one thing: the
address of a server that will do the real work.

On Linux with glibc, the stub reads `/etc/resolv.conf` the first time
your process uses it. That file lists up to three `nameserver` addresses.
The stub sends your question to the first one, and if that times out, to
the next, and so on, then goes round again until it runs out of
attempts. The defaults in man-pages 6.19 (2026) are a 5-second timeout
per try and 2 attempts.

The server the stub asks is a **recursive resolver**: your cloud's
resolver, your company's, your ISP's, or a public one. The stub marks
its question "recursion desired" (the RD bit) and expects a final
answer back, never a "go ask someone else". Resolution is the recursive
resolver's job.

## Names are paths in a tree

To see what the recursive resolver does, look at the name first. DNS
names form a tree. Each node has a label of up to 63 bytes, and the root
has an empty label. A name is the list of labels from a node up to the
root, most specific first: `api`, `example`, `com`, and the root. That's
why a complete name is written with a trailing dot, `api.example.com.`:
the dot is the root. A whole name is at most 255 bytes.

The tree is cut into **zones**, and each zone is run by its own
**authoritative servers**, which hold the real data for their part of
the tree:

- The **root zone** sits at the top. It knows who runs each top-level
  domain.
- A **top-level domain (TLD)** zone, like `com`, is one level down. To
  the protocol there's nothing special about it; it's a zone that mostly
  hands out pointers to the zones below it.
- The `example.com` zone holds the records for `api.example.com`.

A parent passes part of its tree to a child by **delegation**: it adds
NS records to its own zone naming the child's servers. The `com` zone
holds NS records for `example.com`.

## Walking the tree

Now the recursive resolver has a question it can't answer, and suppose
its cache is empty. It needs somewhere to start, so it ships with the
addresses of the root servers built in (a "root hints" file). From
there:

1. It asks a root server for `api.example.com`. The root doesn't know,
   but it's authoritative for the level above `com`, so it replies with
   a **referral**: the NS records for `com` and their addresses.
2. It asks a `com` server the same question. Another referral: here are
   the servers for `example.com`.
3. It asks an `example.com` server. This one is authoritative, so it
   answers with the A record and sets the "authoritative answer" (AA)
   bit.
4. It sends the answer back to your stub, with the "recursion
   available" (RA) bit set, and keeps everything it learned in its
   cache.

![Sequence diagram with five columns: your program's stub resolver, a recursive resolver with a cache, a root server, a .com server and the example.com authoritative server. The stub asks the recursive resolver for api.example.com with RD=1. The resolver asks the root and gets a referral to .com, asks .com and gets a referral to example.com's servers, asks the authoritative server and gets the answer with AA=1 and a TTL, then returns it to the stub with RA=1.](img/dns-resolution-walk.svg)

*A cold-cache lookup. The recursive resolver follows referrals down the tree; your program sees one question and one answer. Adapted from the resolver walk-through in Julia Evans, "What happens when you update your DNS?" (2020), and the algorithm in RFC 1034 section 5.3.3.*

You can watch this happen. Julia Evans did it by hand in 2020 with
`dig`: ask `198.41.0.4` (a root server) about `github.com` and you get
NS records for `com`; ask `192.5.6.30` (a `com` server) and you get NS
records for `github.com`; ask one of those and you get the A record.
`dig +trace` runs the same walk for you.

Two details make the walk work:

- **Referrals carry addresses, not just names.** A referral puts the NS
  records in the response's authority section and, when it can, their
  IP addresses in the additional section, so the resolver doesn't need a
  separate lookup to find the next server.
- **Glue breaks a loop.** If `example.com`'s name server is
  `ns1.example.com`, you'd need to resolve `example.com` to find it.
  So the parent zone also holds that server's address. Those address
  records are called glue.

The full walk from the root is rare in practice. A busy resolver almost
always has the `com` servers cached already, so a lookup for a new
`.com` name starts there, and a repeated lookup doesn't leave the
resolver at all. How long each answer stays cached is the TTL, which has its own
page, [[dns-caching]]. The records you can ask for (A, AAAA, CNAME, MX
and the rest) are in [[dns-records]].

## Recursive and iterative are two ways of answering

The same protocol carries both kinds of question. A server in
**recursive mode** does the chasing for you and returns either the
answer or an error. A server in **iterative mode** answers only from
what it has, which may be a referral that says "ask over there". Every
name server must support iterative answers; recursive service is
optional, and a server can refuse it to anyone it likes.

So in the diagram, your stub asks recursively and the recursive resolver
asks the root, TLD and authoritative servers iteratively. An
authoritative-only server goes further: it serves its own zones and
ignores requests for recursion.

## What goes over the wire

A DNS message is small and has a fixed shape: a header, then a question,
then three lists of records, the answer, the authority section and the
additional section. The header has a 16-bit ID that the client picks
and the server copies into its reply, so the client can match replies to
questions, and the flag bits from above: RD, RA, AA, and TC for
"truncated".

Ordinary queries go over [[udp]] to port 53. One question fits in one
datagram and the answer comes back in another, with no connection to
set up, which is why UDP was the recommended transport from the start.
The price is the usual UDP price: a lost packet is simply gone, so the
client has to time out and retry.

The original rules (RFC 1035, 1987) capped a UDP answer at 512 bytes.
If an answer didn't fit, the server sent what fit, set the TC bit, and
the client asked again over [[tcp]], also on port 53. Over TCP each
message is prefixed with a 2-byte length, so the receiver can collect a
whole message from the stream before it starts parsing.

An extension called EDNS lifted that cap: the client advertises a
buffer size, the largest UDP answer it will take. That raised a new
problem. A big UDP answer gets split into IP fragments, and fragments
are unreliable on today's internet and can be spoofed ([[mtu-and-fragmentation]] explains
why). So on DNS Flag Day 2020, a community effort of DNS
software and service providers, DNS software moved to a default EDNS
buffer size of 1232 bytes: the IPv6 minimum
link MTU of 1280 bytes minus 48 bytes of IPv6 and UDP headers, which
fits in one packet on nearly every network. Anything bigger goes over
TCP.

TCP has also stopped being optional. The older host requirements
(RFC 1123) said resolvers SHOULD support it, and some implementers read
that as "may skip it". Since RFC 7766 (2016), every general-purpose DNS
implementation, stub resolvers included, MUST support both UDP and TCP.
DNSSEC and IPv6 made answers bigger, and TCP also protects against
spoofed source addresses, which attackers use to aim DNS answers at a
victim.

## The root is thirteen names, not thirteen machines

Everything starts at the root, so it's reasonable to worry about how
much load it takes. There are 13 root servers, lettered A to M, run by
12 independent organizations. But each letter is served from many
places at once. When this was written, the operators' own site counted 2,045
operational instances around the world. The trick that lets one address
live in many places at once is [[anycast]].

## Where it gets tricky

**"Resolver" means three different things.** People say "resolver" for
the stub in your process, for the recursive server it talks to, and
sometimes for a forwarder in between, a server that passes questions on
to a recursive resolver. "Recursive server" and
"recursive resolver" are used interchangeably, and the IETF's own
glossary (RFC 9499, 2024) says some terms, like "full resolver", have no
agreed meaning. When a colleague says "the resolver is slow", ask which
one.

**A dead first nameserver costs seconds per lookup.** The glibc stub
tries servers in order and waits the full timeout on each. With the
default 5 seconds, a first `nameserver` line that points at a dead
server adds about 5 seconds to lookups before the second server is even
tried. The man page also warns that the timeout isn't the total time of
one call.

**Short names turn into several queries.** A name with fewer dots than
`ndots` (default 1) is tried with each domain from the `search` list
appended first. A lookup for `db` with three domains in the `search` list
can mean several failed queries before one works. A name written in
full with a trailing dot, `db.internal.example.com.`, is already
complete, so there's nothing for the search list to add.

**Different askers can get different answers.** Split DNS, or
split-horizon, means authoritative servers answer differently depending
on where the query comes from, for example internal addresses to
queries from inside a company network. It isn't part of the standard,
but server software widely supports it. So "it resolves on my laptop"
and "it resolves in production" can both be true, with different
addresses.

**TCP port 53 gets blocked.** Firewall rules written for "DNS is UDP"
break the fallback. Small answers keep working and large ones (many
addresses, DNSSEC signatures) fail, which looks random until you notice
it's size-dependent.

## What this means when you build

- A lookup is a network round trip, sometimes several. Treat it like
  one: it can be slow, it can fail, and it needs a timeout you chose.
- Know what your hosts' `/etc/resolv.conf` points at.
- Put a working, nearby resolver first in the `nameserver` list. The
  first entry is the one every lookup waits on.
- Use full names with a trailing dot for internal services when you
  don't want the search list to add queries.
- Allow DNS over TCP port 53, not only UDP, in every firewall and
  security group.
- When a name resolves wrong, use `dig +trace` to see each step, and
  `dig @server` to ask one specific server.

## Further reading

- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), P. Mockapetris, 1987. The design: the tree, zones, recursive and iterative service, stub resolvers and the resolver algorithm. Still the base document.
- [RFC 1035: Domain Names, Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035), P. Mockapetris, 1987. The message format, header bits, size limits, and UDP and TCP on port 53.
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499), P. Hoffman and K. Fujiwara, 2024. The current meaning of stub, recursive, referral, delegation, glue and the rest, including where terms have no agreed meaning.
- [RFC 7766: DNS Transport over TCP](https://www.rfc-editor.org/rfc/rfc7766), J. Dickinson et al., 2016. Why TCP support became mandatory for every DNS implementation.
- [DNS Flag Day 2020](https://www.dnsflagday.net/2020/), DNS software vendors and operators, 2020. Why large UDP answers break, and where the 1232-byte default comes from.
- [Root Server Technical Operations Association](https://root-servers.org/), root server operators. The 13 root servers, their 12 operators, and a live count of instances.
- [resolv.conf(5)](https://man7.org/linux/man-pages/man5/resolv.conf.5.html), Linux man-pages, 2026. How the glibc stub resolver picks servers, retries, and uses the search list.
- [What happens when you update your DNS?](https://jvns.ca/blog/how-updating-dns-works/), Julia Evans, 2020. A resolution walked through by hand with `dig`, easy to repeat yourself.
