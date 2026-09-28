---
id: dns-records
title: DNS record types
depth: short
phase: 2
note: >-
  A, AAAA, CNAME, NS, SOA, MX, TXT, SRV and PTR: what each record type
  holds and what it's for.
needs: [dns]
leads_to: []
compare_with: []
---

# DNS record types

A name in [[dns]] doesn't hold one value. It holds a set of records of
different types, and every query asks for one type: "the A records for
`api.example.com`", "the MX records for `example.com`". Knowing the
common types, and the few rules about how they combine, saves you from
the classic mistakes, like a CNAME where one isn't allowed.

## Every record has the same shape

Every record has the same five parts: the owner name it belongs to, a
type, a class (`IN`, for the internet), a TTL, and data whose
format depends on the type. All the records with the same name and type
form one set, called an RRset. Here's a small zone, in the text format
DNS servers load, with made-up names and documentation addresses:

```
example.com.          3600  IN  SOA    ns1.example.com. admin.example.com. (
                                       2026092801 7200 900 1209600 300 )
example.com.          3600  IN  NS     ns1.example.com.
example.com.          3600  IN  MX     10 mail.example.com.
example.com.          3600  IN  TXT    "any text the domain owner wants"
api.example.com.       300  IN  A      203.0.113.10
api.example.com.       300  IN  A      203.0.113.11
api.example.com.       300  IN  AAAA   2001:db8::10
www.example.com.       300  IN  CNAME  api.example.com.
_sip._tcp.example.com. 300  IN  SRV    10 60 5060 sip1.example.com.
```

The two A records for `api.example.com` are one RRset, and a query for
its A records gets both.

## The types you'll meet

| Type | Number | Holds | Used for |
|---|---|---|---|
| A | 1 | one IPv4 address | "where is this host" over IPv4 |
| AAAA | 28 | one 128-bit IPv6 address | the same over IPv6 |
| CNAME | 5 | another name | "this name is an alias for that one" |
| NS | 2 | a name server's host name | which servers are authoritative for a zone; how delegation works |
| SOA | 6 | zone settings | the start of a zone: its version and timers |
| MX | 15 | a preference and a mail host | where to deliver mail for a domain; lower preference wins |
| TXT | 16 | text strings | anything, by convention of whoever reads it |
| SRV | 33 | priority, weight, port, host | where a named service runs, including its port |
| PTR | 12 | a name | reverse lookups: address back to name |

A few need more than a table row.

**CNAME** says "this name is an alias; the real name is over there".
When a lookup hits a CNAME, it restarts at the canonical name. An alias
has exactly one canonical name. The rule that trips people up: a name
with a CNAME can't hold any other records (DNSSEC signatures aside).

**SOA** marks the start of a zone. Its fields include a serial number
(the version of the zone's data), timers for how often copies of the
zone refresh and when they expire, and a MINIMUM field that
[[dns-caching]] covers.

**TXT** holds free text. The protocol gives it no meaning: what it
says depends on the name it's under and who reads it.

**SRV** lets a client find a service, not only a host. You query a name
like `_sip._tcp.example.com` (the underscores keep service and protocol
labels from clashing with real host names) and get back targets with
ports. The client tries the lowest priority first and spreads load
among equal priorities by weight. A target of `.` means "no such service
here". A client should use SRV only when its protocol's spec says to.

**PTR** runs the other way. The address 10.2.0.52 is looked up as the
name `52.0.2.10.in-addr.arpa`, octets reversed so each network's block
of addresses can be its own zone. IPv6 uses `ip6.arpa`. A name may have
more than one PTR record.

## Where it gets tricky

**No CNAME at the top of a zone.** The zone apex, `example.com` itself,
always holds the zone's SOA record, and a CNAME can't share a name with
anything. So you can't make `example.com` an alias for your hosting
provider's name, which is exactly what people want to do. Since RFC
9460 (2023), the SVCB and HTTPS record types give a standard way to
alias at the apex, and to publish connection settings, such as protocol
configuration, before the client connects.

**MX, NS and SRV must point at real names.** Their targets must have
address records of their own and must not be aliases. An MX pointing at
a CNAME is out of spec and may not work.

## What this means when you build

- Use CNAMEs for subdomains that point at someone else's service, and
  A and AAAA records for the bare domain.
- Publish AAAA next to A if your service listens on IPv6.
- Point MX, NS and SRV at names with A or AAAA records, never at a
  CNAME.

## Further reading

- [RFC 1035: Domain Names, Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035), P. Mockapetris, 1987. The record layout and the original types: A, NS, CNAME, SOA, PTR, MX, TXT.
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181), R. Elz and R. Bush, 1997. RRsets, the CNAME rules, and why MX and NS can't point at aliases.
- [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596), S. Thomson et al., 2003. The AAAA record.
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782), A. Gulbrandsen, P. Vixie and L. Esibov, 2000. SRV names, priority and weight.
- [RFC 9460: SVCB and HTTPS Resource Records](https://www.rfc-editor.org/rfc/rfc9460), B. Schwartz, M. Bishop and E. Nygren, 2023. The newer records that allow aliasing at the zone apex.
