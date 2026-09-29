---
id: symmetric-encryption
title: Symmetric encryption
depth: short
phase: 3
note: >-
  One shared key to encrypt and decrypt. AES-GCM and ChaCha20-Poly1305
  at concept level.
needs: []
leads_to: [tls, envelope-encryption]
compare_with: [public-key-crypto]
---

# Symmetric encryption

Symmetric encryption uses one secret key for both directions: the key
that locks the data also unlocks it. It's what protects the data itself
in protocols like [[tls|TLS]], once both sides have a key. Today it almost always
comes as AEAD, encryption that also detects tampering, and the one rule
you must not break is: never reuse a nonce with the same key.

## Encryption alone isn't enough

Picture a service that encrypts a session cookie and sends it to the
browser. Encryption keeps the browser from reading it. But an attacker
who flips bits in the ciphertext may change what the server decrypts,
without ever knowing the key. Secrecy and integrity are two different
jobs.

For years protocols did the two jobs with two tools: a cipher for
secrecy and a separate message authentication code (MAC) for integrity.
The modern answer is one algorithm that does both, called **authenticated encryption with associated data**,
AEAD.

## What an AEAD takes and gives back

![An AEAD encrypt box takes four inputs: a secret key, a nonce that must never repeat under that key, the plaintext, and associated data that stays readable. It outputs ciphertext plus a 16-byte tag. The decrypt box takes the key, the same nonce, the associated data and the ciphertext with its tag, and returns either the plaintext or FAIL if anything was changed.](img/symmetric-encryption-aead.svg)

*The AEAD interface. Adapted from David McGrew, RFC 5116, "An Interface and Algorithms for Authenticated Encryption", section 2 (2008).*

Encrypting takes four inputs:

- **The key.** Random, and the same on both sides.
- **A nonce.** A "number used once", usually 12 bytes. It isn't
  secret: it's usually stored or sent right next to the ciphertext. It
  must never repeat for the same key.
- **The plaintext.** What you want hidden.
- **Associated data.** Bytes that stay readable but are still protected
  from change, like a header or a record's ID. If someone moves your
  encrypted cookie onto another user's ID, decryption fails.

It returns the ciphertext with a short tag attached. For AES-GCM the
output is exactly 16 bytes longer than the input.

Decrypting takes the key, nonce, associated data and ciphertext, and
returns one of two things: the original plaintext, or FAIL. There's no
"mostly decrypted". If anyone without the key changed the ciphertext,
tag, nonce or associated data, you almost certainly get FAIL.

## The two you'll meet

**AES-GCM.** AES is the standard block cipher, with 128- or 256-bit
keys, and GCM is the mode that turns it into an AEAD. On CPUs with
AES instructions it's very fast.

**ChaCha20-Poly1305.** ChaCha20 is a stream cipher and Poly1305 a fast
MAC, joined into one AEAD. It exists for two reasons. Without AES
hardware, ChaCha20 runs about three times as fast as AES, and unlike
many software AES implementations it isn't open to cache-timing
attacks. And if AES were ever broken, the internet needed a second
cipher standing by, since the only other widely supported one, 3DES,
is much slower.

In your own code, both are good choices.

## Where it gets tricky

**Nonce reuse is a disaster, not a small weakness.** If AES-GCM ever
encrypts two different messages with the same key and nonce, an
attacker who sees both learns the XOR of the two plaintexts. Worse, they
can recover the internal key GCM uses for integrity, and from then on
forge messages under that key at will. One repeat breaks integrity
for everything that key protects.

**Random nonces run out.** A 12-byte random nonce sounds endless, but
random values collide sooner than you'd think. Go's
`NewGCMWithRandomNonce` (Go 1.24) caps a key at 2^32 messages for that
reason. Past that, rotate the key.

**Counters need coordination.** The recommended nonce is a fixed part
plus a counter that goes up by one. If several machines share a key,
each needs its own fixed part, or two of them will count through the
same nonces. A counter that restarts from zero after a crash is the
same bug, so a long-lived key needs its counter saved to disk.

**The key still has to get there.** Symmetric encryption assumes both
sides already share a secret key. Agreeing on one over an open network
is the job of [[public-key-crypto|public-key cryptography]], which is
why TLS uses both.

## What this means when you build

- Use an AEAD: AES-GCM or ChaCha20-Poly1305 from your standard library.
  Don't combine a cipher and a MAC yourself.
- Decide where nonces come from before you write the first line: a
  counter you can't reset, or random nonces with a key rotation limit.
- Put anything that binds the message to its context (user ID, record
  ID, version) into the associated data.
- Treat a decryption failure as an attack or corruption, not something
  to retry around.
- Keep keys out of code and config files. The encryption is only as
  secret as the key.

## Further reading

- [RFC 5116](https://www.rfc-editor.org/rfc/rfc5116), David McGrew, IETF, 2008. The AEAD interface, the rules for nonces, and exactly what nonce reuse in GCM costs.
- [RFC 8439](https://www.rfc-editor.org/rfc/rfc8439), Yoav Nir and Adam Langley, IRTF, 2018. ChaCha20-Poly1305, and why a second cipher next to AES was worth having.
- [crypto/cipher](https://pkg.go.dev/crypto/cipher), the Go authors, Go 1.27. The AEAD interface in real code, and the limit on random nonces.
