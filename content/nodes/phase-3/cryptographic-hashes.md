---
id: cryptographic-hashes
title: Cryptographic hashes
depth: short
phase: 3
note: >-
  SHA-256 and friends: a short, fixed-size fingerprint of any data that
  nobody can reverse or forge a match for.
needs: []
leads_to: [public-key-crypto, hmac, password-hashing, api-keys, audit-logging, merkle-trees, tamper-evident-logs]
compare_with: [checksums]
---

# Cryptographic hashes

A cryptographic hash takes any amount of data and returns a short,
fixed-size digest, like a fingerprint. SHA-256 turns a byte, a file or
a whole disk image into 256 bits. What makes it cryptographic is that
nobody, not even an attacker trying hard, can find two inputs with the
same digest or work backwards from a digest to an input. Hashes are
inside almost every other piece of security you'll use: signatures,
certificates, TLS, content-addressed storage, and message
authentication.

## Three promises

Say you publish a release tarball and its SHA-256 digest. A good hash
function makes three promises about that digest:

- **Preimage resistance.** Given only the digest, nobody can find an
  input that hashes to it. You can't get the file back from the
  digest.
- **Second preimage resistance.** Given your tarball, nobody can build a
  different file with the same digest. An attacker can't swap in a
  backdoored build that still matches.
- **Collision resistance.** Nobody can find *any* two different inputs
  with the same digest, even inputs they choose freely.

"Can't" here means computationally infeasible: possible in principle,
because there are far more inputs than digests, but far beyond any
realistic amount of computing.

Collision resistance is the weakest of the three, because the attacker
gets to pick both inputs. SHA-256 is rated at 128 bits of strength
against collisions but 256 bits against preimages. It's also the
promise that fell for SHA-1.

## The families you'll meet

The approved hashes are defined in two NIST standards:

- **SHA-2** (FIPS 180-4): SHA-224, SHA-256, SHA-384, SHA-512 and two
  truncated SHA-512 variants. SHA-256 is the default nearly everywhere.
- **SHA-3** (FIPS 202): SHA3-224 to SHA3-512, built on a completely
  different design (Keccak). It's an alternative to SHA-2, not a
  replacement; SHA-2 isn't broken.

And the one you should stop using:

- **SHA-1**, with a collision strength below 80 bits. NIST deprecated
  it in 2011 and disallowed it for digital signatures after 2013.

## How a hash breaks: SHA-1 in 2017

In 2017 researchers at CWI Amsterdam and Google published two PDF files
with different content and the same SHA-1 digest. It took about 9.2
quintillion SHA-1 computations, including 6,500 CPU-years for the first
phase. That's enormous, but still more than 100,000 times faster than
brute force, which is what counts: the function no longer lived up to
its promise.

A collision matters because systems use digests as stand-ins for the
data. If someone signs the digest of a harmless contract, and an
attacker holds a second contract with the same digest, the signature
now covers both. Certificates are signed the same way, which is why the
Chrome team announced in 2014 that it would phase out SHA-1.

Hashes weaken over time from better attacks and cheaper computing. The
practical lesson is to use a hash you can swap out later.

## Where it gets tricky

**A hash isn't a checksum.** Both turn data into a short value. A
[[checksums|checksum]] like CRC32C catches
accidental damage. A cryptographic hash is built to hold up against
someone choosing the input on purpose. Use a checksum for torn writes
and flipped bits, and a hash when an attacker is in the picture.

**A hash alone doesn't stop an attacker.** If the attacker can change
the data, they can usually change the digest next to it too. A hash
protects data only when the digest comes from somewhere the attacker
can't touch: a signed release note, a certificate, a lock file in your
repository. To protect a message in flight you need a key, either a
shared one ([[hmac]]) or a key pair ([[public-key-crypto|a signature]]).

**Don't invent your own keyed hash.** Hashing a secret together with
the message looks like it proves you know the secret, but the obvious
ways of doing it can be forged. The safe construction is [[hmac]].

## What this means when you build

- Default to SHA-256. Use SHA-512 or SHA-3 only if a spec asks for them.
- Never use SHA-1 for anything security-related: signatures,
  certificates, integrity against attackers, deduplication an attacker
  can feed.
- Store which hash you used next to the digest (`sha256:...`), so you
  can change it later.
- Use CRC32C, not SHA-256, for on-disk corruption checks where no
  attacker is involved.
- Remember that a digest only helps if it reached you by a path the
  attacker doesn't control.

## Further reading

- [Hash Functions](https://csrc.nist.gov/projects/hash-functions), NIST. The three security properties, the approved SHA-2 and SHA-3 families, SHA-1's status, and a table of each hash's strength.
- [Announcing the first SHA1 collision](https://security.googleblog.com/2017/02/announcing-first-sha1-collision.html), Marc Stevens, Elie Bursztein et al., Google Security Blog, 2017. What a collision is, why it matters, and what it took to find one for SHA-1.
