---
id: merkle-trees
title: Merkle trees
depth: short
phase: 11
note: >-
  A tree of hashes that lets two replicas find which key ranges differ
  by comparing a few hashes.
needs: [cryptographic-hashes]
leads_to: []
compare_with: [tamper-evident-logs]
---

# Merkle trees

A Merkle tree is a tree of hashes. Each leaf is the hash of one piece of
data, and each parent is the hash of its children, up to a single root
hash that stands for everything below it. Two things follow. If two
trees have the same root, their data is the same, so replicas can
compare huge data sets by exchanging a handful of hashes. And you can
prove that one item is in the set by showing only the hashes along its
path to the root. Replicated databases use the first; append-only logs
like Certificate Transparency use the second.

## Building one

Take a list of entries, d0 to d3. Hash each entry to make a leaf. Hash
pairs of leaves together to make their parents, and keep going until
one hash is left: the root. Any [[cryptographic-hashes|cryptographic
hash]] works, as long as nobody can find two inputs with the same hash.

Certificate Transparency (RFC 9162, 2021) spells out a careful version.
A leaf is `HASH(0x00 || entry)` and an interior node is
`HASH(0x01 || left || right)`. The different first byte for leaves and
interior nodes stops an attacker from passing off an interior node as
if it were a leaf; the RFC calls it domain separation, and it's needed
for second-preimage resistance. The number of entries doesn't have to
be a power of two: the tree just isn't perfectly balanced, and its
shape is fixed by the number of leaves.

## Comparing two replicas

Two replicas of a key range want to know which keys differ, without
sending every key across the network. Dynamo's answer: each replica builds a Merkle tree over the range, where each
leaf is the hash of one key's value.

1. Exchange root hashes. Equal roots mean every key matches, and you're
   done.
2. If not, exchange the children's hashes and descend only into the
   branches that differ.
3. At the bottom you're left with exactly the keys that are out of
   sync.

Each branch can be checked on its own, without downloading the whole
tree or the data. That saves network traffic and disk reads, which is
why [[anti-entropy]] can afford to compare whole replicas at all.

## Proving one entry is there

The same structure lets a server prove a claim to someone who doesn't
trust it. Say you already hold the root of a log with four entries, and
you want to know that d2 is in it. The server sends only L3 and N01.

![A Merkle tree over four entries d0 to d3. Each entry is hashed into a leaf L0 to L3 with a leading 0; pairs of leaves are hashed into N01 and N23 with a leading 1; those two are hashed into the root. The path from d2 through L2 and N23 to the root is highlighted. L3 and N01 are outlined as the two hashes sent in the proof.](img/merkle-trees-inclusion-proof.svg)

*An inclusion proof: the hashes needed to rebuild the root from one entry. The prefixes follow RFC 9162.*

You hash d2 into L2, combine it with L3 to get N23, combine that with
N01 to get the root, and compare with the root you trust. If they match,
d2 is in the log, and you never saw d0, d1 or d3. RFC 9162 defines this
inclusion proof as the shortest list of extra nodes needed to compute
the root.

A second kind, the consistency proof, shows that a newer, bigger log
begins with exactly the entries of an older one: nothing was changed or
removed, only appended. That's what makes a log provably append-only,
the idea behind [[tamper-evident-logs]].

## Where it gets tricky

**The tree has to match the partitioning.** Dynamo kept one tree per key
range a node held. When nodes joined or left, the key ranges moved and
many trees had to be recomputed, which the Dynamo paper calls a
non-trivial operation on a production system.

**A root is only as good as the trust in it.** A proof shows an entry is
in the tree whose root you hold. If a dishonest server shows different
roots to different people, each proof still checks out. RFC 9162 says
as much: a log that shows inconsistent views to different clients gets
around its checks, so each log still has to be treated as a trusted
third party.

**Hashing isn't free.** Building a tree means reading and hashing all the
data, and keeping it current as data changes costs more.

## What this means when you build

- Use a Merkle tree when two parties need to find differences in a large
  data set cheaply, or when a server must prove membership to a client
  that doesn't trust it.
- Use distinct prefixes for leaf and interior hashes, as RFC 9162 does.
- Align trees with how data is partitioned, so moving a partition moves
  a tree instead of forcing a rebuild.

## Further reading

- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), DeCandia et al., SOSP 2007. Section 4.7: Merkle trees for comparing replicas, and the cost of rebuilding them when ranges move.
- [RFC 9162: Certificate Transparency Version 2.0](https://www.rfc-editor.org/rfc/rfc9162), B. Laurie, E. Messeri, R. Stradling, IETF, 2021. The exact tree hash, inclusion proofs and consistency proofs.
