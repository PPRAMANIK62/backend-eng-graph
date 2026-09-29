---
id: dnssec
title: DNSSEC
depth: short
phase: 3
note: >-
  Signatures on DNS answers, so a resolver can check an answer came from
  the zone's owner.
needs: [dns, public-key-crypto]
leads_to: []
compare_with: []
---

# DNSSEC

DNSSEC adds signatures to DNS records, so a resolver can check that an
answer really came from whoever runs the zone and wasn't changed on the
way. It protects the records themselves, not the connection that
carries them, and it hides nothing. If your domain is signed, getting
it wrong takes your domain offline for everyone whose resolver checks.

## Signatures on records, not on connections

Say your zone `example.com` has an address record for
`api.example.com`. In plain [[dns]], nothing in the answer lets a resolver check it.

With DNSSEC, the zone owner signs each set of records (all the A
records for one name, say) with the zone's private key. The signature
goes into a new record type, RRSIG, served next to the records it
covers. The matching public key is published in the zone too, as a
DNSKEY record. A resolver that trusts that public key can check the
signature, the way any [[public-key-crypto|digital signature]] is
checked.

The key belongs to the zone, not to the servers that answer for it, so
any server or [[dns-caching|cache]] can hand out signed records without holding a
secret. DNSSEC secures the data, and doesn't care how it travelled.

Each RRSIG has an inception and an expiration time, and a TTL can't
stretch a signature past it. So a signed zone has to be re-signed on a
schedule, work that unsigned DNS never needed.

## A chain of trust from the root

A signature only helps if you trust the key. Anyone who can forge the
address record can forge a key too.

DNSSEC answers this with the delegation. The parent zone (`com`)
publishes a DS (delegation signer) record for `example.com`, which
points at the child's key by a digest of it. The DS record is signed
with `com`'s key. `com`'s key is vouched for the same way by a DS
record in the root, signed with the root's key. The root's key is the
trust anchor: it's configured into the validating resolver ahead of
time.

![Three zones stacked from the root down. The resolver starts from the root key it was configured with. That key signs the root's DS record for com, which points at com's DNSKEY. com's key signs the DS record for example.com, which points at example.com's DNSKEY. That key signs the A record for api.example.com through its RRSIG.](img/dnssec-chain-of-trust.svg)

*The chain a validating resolver builds: DNSKEY, then DS and DNSKEY for each delegation, then the record itself. Adapted from R. Arends et al., RFC 4033, "DNS Security Introduction and Requirements", section 3.1 (2005).*

The resolver walks the same path as normal resolution, checking one
link at a time. The root zone was signed in
2010, and the root's trust anchor key was changed in 2018.

## Proving that a name doesn't exist

Signatures on existing records don't cover "there's no such name",
which is just as easy to forge. DNSSEC handles this with NSEC records. Sort every name in the zone into
a fixed order; each NSEC record names one existing name and the next
one after it, and lists the record types present at that name. Asked
for a name that falls in a gap, the server returns the signed NSEC for
that gap: "nothing exists between these two names".

## What a validating resolver concludes

A validating resolver puts every answer in one of four states:

- **Secure.** A chain from a trust anchor, and every signature checks.
- **Insecure.** A signed proof, somewhere in the chain, that the child
  zone has no DS record. The zone isn't signed, and the resolver can
  prove it.
- **Bogus.** The parent says the zone is signed, but the answer doesn't
  validate: a signature is missing, expired, or uses an algorithm the
  resolver doesn't support.
- **Indeterminate.** No trust anchor covers that part of the tree.

A bogus answer isn't passed on; your program gets SERVFAIL instead.

Most programs don't validate. Their [[dns|stub resolver]] asks a
recursive resolver, which validates and can set the AD bit in its
reply. That bit is only a hint: relying on it means trusting the
recursive resolver and the network path to it. Securing that path is
[[encrypted-dns]].

## Where it gets tricky

**It's not encryption.** DNSSEC deliberately gives no confidentiality.
Anyone on the path still sees every name you look up.

**Mistakes look like outages.** An expired signature or a DS record
that points at the wrong key makes every answer from the zone bogus.
Every validating resolver then returns SERVFAIL for your whole domain,
while non-validating ones keep working.

**NSEC lists your zone.** Anyone can walk the NSEC chain and list
every name in a signed zone. Later RFCs added ways to limit that, such
as generating minimal NSEC records on demand; NSEC3, a hashed variant,
is now part of core DNSSEC too.

**Bigger answers and new attacks.** A resolver sets the DO ("DNSSEC
OK") bit to ask for signatures, and the bigger answers need EDNS0 and a
working fallback to [[tcp]] (see [[dns]]). DNSSEC gives no protection
against denial of service, and adds a new kind: making a validating
resolver burn CPU on bad signatures or needlessly long chains.

**Few domains use it.** When RFC 9364 was written (2023), estimates
were that fewer than 10% of website domain names were signed, and about
a third of queries to recursive resolvers were validated. Nearly all
top-level domains in the root are signed.

## What this means when you build

- If you sign a zone, re-signing and key changes are production
  operations. Automate them, and alert on signatures close to expiry.
- DS records live in the parent zone, which someone else runs. A key
  change has to be matched there. CDS and CDNSKEY records exist to
  automate that handoff.
- If one domain fails with SERVFAIL from some resolvers but works from
  others, suspect a DNSSEC validation failure.
- DNSSEC isn't privacy, and encrypted DNS isn't integrity. You may
  want both.

## Further reading

- [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033), R. Arends, R. Austein, M. Larson, D. Massey, S. Rose, IETF, 2005. The DNSSEC overview: new records, the chain of trust, validation states, and what DNSSEC doesn't do.
- [RFC 9364](https://www.rfc-editor.org/rfc/rfc9364), P. Hoffman, IETF, 2023. A map of all the DNSSEC RFCs, and the state of deployment when it was written.
