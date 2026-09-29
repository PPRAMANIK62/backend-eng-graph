---
id: tamper-evident-logs
title: Tamper-evident logs
depth: short
phase: 15
note: >-
  Logs chained together with hashes, so anyone can tell if an old entry
  was changed or removed.
needs: [audit-logging, cryptographic-hashes]
leads_to: []
compare_with: [merkle-trees]
---

# Tamper-evident logs

A tamper-evident log is one where any change to past entries, including
deleting them, can be detected by someone who checks. It can't stop an
attacker with write access from editing the file, but it guarantees the
edit will show. That's what you want from an [[audit-logging|audit
log]], a financial ledger or a record of issued certificates: a history
that its own keeper can't quietly rewrite.

## The simplest version: a hash chain

Take an [[append-only-log|append-only log]] and give each entry the
[[cryptographic-hashes|hash]] of the entry before it. Now each entry
commits to the entire history behind it. Change entry 5 and its hash
changes, so entry 6's stored hash no longer matches, and so on to the
end. Sign the latest hash with a private key and publish the signature,
and anyone with the [[public-key-crypto|public key]] can check that the
log up to that point is intact.

AWS CloudTrail, which records API activity in AWS accounts, uses this
design for its log files:

1. It hashes each log file with SHA-256.
2. Every hour it writes a digest file listing the hashes of that hour's
   log files, and signs the digest with a private key (SHA-256 with
   RSA).
3. Each digest also includes the signature of the previous digest.

![A row of hourly digest files. Each digest lists the SHA-256 hashes of the log files delivered in its hour, and includes the signature of the previous digest, so the digests form a chain. Each digest is signed with a private key; anyone with the public key can check it. Changing or deleting a log file breaks its hash in the digest; deleting or editing a digest breaks the chain.](img/tamper-evident-logs-digest-chain.svg)

*Hash-chained, signed digests. Adapted from AWS, "Validating CloudTrail log file integrity".*

Changing a log file breaks its hash. Rewriting a digest breaks its
signature. Deleting a digest breaks the chain after it. The chain can
even prove a negative: that no log files were delivered during some
period.

## When chains get too slow: trees

A chain has a cost. To prove that one old entry is really in the log,
and hasn't been changed, you have to hand over everything from that
entry to the latest signed hash. Crosby and Wallach (USENIX Security
2009) put a number on it: proving that one random event is in an
80-million-event log could take an 800 MB trace with a hash chain,
against a 3 KB proof with their tree.

Their idea, a "history tree", is a [[merkle-trees|Merkle tree]] over the
log that grows as entries are appended. After each append the logger
signs the new root, a commitment that covers the entire log so far.
Then it can answer two questions with proofs of logarithmic size:

- **Is this event still here?** A membership proof: the few hashes
  that rebuild the signed root from that one event.
- **Does today's log extend yesterday's?** An incremental proof between
  two commitments, showing nothing earlier was changed or removed.

Certificate Transparency (RFC 9162) uses essentially the same tree,
calling the two proofs inclusion and consistency proofs, so that anyone
can check that the public logs of TLS certificates are append-only.

## Where it gets tricky

**Someone has to check.** Detection only happens if someone verifies
the chain or the proofs. CloudTrail says so plainly: turning on log
file validation only makes it deliver digests, and doesn't validate
anything. Schedule the check.

**The keeper can show different logs to different people.** A logger
could give one auditor one version of history and another auditor a
different one, each internally consistent. The defense is for auditors
to compare the commitments they've been given, for example by gossiping
them, or for the logger to publish each commitment somewhere everyone
sees the same one.

**Signing keys and digests need their own protection.** If the attacker
can also replace the digests or the signing key, they can rebuild a
consistent fake history. Keep digests apart from the logs, with separate
access rules, and protect them from deletion (CloudTrail suggests S3
MFA Delete).

## What this means when you build

- For an audit log, chain entries or files with hashes, sign the
  latest hash regularly, and store the signatures apart from the log.
- Verify on a schedule, and alert when verification fails or doesn't
  run.
- If outsiders need to check individual entries efficiently, use a
  Merkle-tree log with inclusion and consistency proofs instead of a
  plain chain.
- Publish or distribute the signed roots so the log can't show
  different histories to different people.

## Further reading

- [Validating CloudTrail log file integrity](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html), AWS CloudTrail User Guide. A production hash chain: hourly signed digests, chained signatures, and what validation proves.
- [Efficient Data Structures for Tamper-Evident Logging](https://www.usenix.org/legacy/event/sec09/tech/full_papers/crosby.pdf), Scott A. Crosby and Dan S. Wallach, USENIX Security 2009. Untrusted loggers, auditors, and the history tree with logarithmic proofs.
- [RFC 9162: Certificate Transparency Version 2.0](https://www.rfc-editor.org/rfc/rfc9162), B. Laurie, E. Messeri, R. Stradling, IETF, 2021. Merkle-tree logs in production, with inclusion and consistency proofs.
