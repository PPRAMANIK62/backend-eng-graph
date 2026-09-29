---
id: public-key-crypto
title: Public-key cryptography
depth: short
phase: 3
note: >-
  Key pairs, signatures and key exchange, at concept level.
needs: [cryptographic-hashes]
leads_to: [tls, certificates-and-pki, dnssec, jwt, passkeys]
compare_with: [symmetric-encryption]
---

# Public-key cryptography

Public-key cryptography gives each party two keys that belong together:
a private key it keeps secret and a public key it can hand to anyone.
That split solves the problem [[symmetric-encryption]] can't: two
strangers on an open network agreeing on a secret, and one of them
proving who they are. You'll use it for two jobs, key exchange and
signatures, almost always next to a fast symmetric cipher that does the
bulk of the work.

## Job one: agreeing on a key in public

Your client wants to talk to a server it has never met, over a network
where anyone can read the packets. They need a shared symmetric key,
but they can't just send one.

Diffie-Hellman key agreement solves this. Here's how it works with
X25519, one of the two usual choices in TLS:

![Alice and Bob each generate 32 random bytes as a private key and keep it. Each computes a public value from their private key and sends it across the network, where an eavesdropper can see both public values. Alice combines her private key with Bob's public value, Bob combines his private key with Alice's public value, and both arrive at the same shared secret K, which the eavesdropper can't compute. Both then feed K into a key derivation function to get a symmetric key.](img/public-key-crypto-key-exchange.svg)

*Diffie-Hellman key agreement with X25519. Adapted from Adam Langley, Mike Hamburg and Sean Turner, RFC 7748, "Elliptic Curves for Security", section 6.1 (2016).*

1. Each side picks 32 random bytes. That's its private key.
2. Each side computes its public value from its private key and sends
   it across.
3. Each side combines its own private key with the other's public
   value. The math makes both results come out the same: a shared
   secret nobody watching can compute.
4. Both feed that secret into a key derivation function and get the
   symmetric keys for the rest of the conversation.

If both sides throw away their private values after one exchange, the
exchange is called **ephemeral**, and that gives a property you'll hear
about constantly: **forward secrecy**. Someone who records your traffic
today and steals the server's long-term key next year still can't
decrypt it, because the keys that protected it no longer exist.

The older way was public-key *encryption*: the client picks the secret,
encrypts it with the server's RSA public key, and sends it. Only the
server can decrypt it. It works, but it isn't forward secret. Anyone who
later gets the server's private key can decrypt every recorded
conversation. [[tls|TLS]] 1.3 dropped it and uses only ephemeral
Diffie-Hellman.

## Job two: signatures

A signature is computed with the private key over some data. Anyone
with the public key can check it, and nobody without the private key
can make one that checks out. It proves two things: the holder of the
private key signed it, and the data hasn't changed since.

Key agreement on its own has a gap: you've agreed a secret with
*someone*, but you don't know who. Signatures close it. In TLS, the
server signs the handshake with its long-term private key, and the
client checks the signature with the public key from the server's
certificate. How the client knows that public key really belongs to
that server is the job of [[certificates-and-pki]].

Signature schemes lean on [[cryptographic-hashes]] internally. Ed25519,
a common modern scheme, has 32-byte public keys and 64-byte signatures,
doesn't need a fresh random number for each signature, and is built so
that a collision in its hash doesn't break it.

## Why not use it for everything

Public-key operations are slow: microseconds to milliseconds each,
against nanoseconds for symmetric encryption. So real protocols are
hybrids. Public-key crypto runs once at the start to agree on a key and
prove identity, then symmetric crypto encrypts the data. TLS, SSH,
IPsec, Signal and WireGuard all work this way.

## Where it gets tricky

**"Encrypt with the public key" isn't how most of it works now.** Many
explanations describe public-key crypto only as encrypting with one key
and decrypting with the other. In modern protocols the public keys are
used for key agreement and signatures, and the data is encrypted
symmetrically.

**Agreement without authentication is useless against an active
attacker.** Someone in the middle can run one key exchange with you and
another with the server. Only a signature from a key you have reason to
trust stops that.

**Quantum computers.** A large enough quantum computer would break the
curves behind both X25519 and Ed25519. For key exchange that threatens
old traffic too: a recording keeps the public values from the exchange,
so if those can someday be broken, the shared secret and everything it
protected can be recovered. Post-quantum key exchange in TLS is covered
in [[tls]].

## What this means when you build

- Don't design with raw public-key operations. Use TLS, or a library
  that does key agreement and signing for you.
- Prefer X25519 for key agreement and Ed25519 for signatures when you
  get a choice.
- Guard private keys like passwords, and plan how you'd rotate them.
- If an old system still uses RSA key transport, assume past traffic is
  exposed if its key ever leaks.

## Further reading

- [A Detailed Look at RFC 8446 (a.k.a. TLS 1.3)](https://blog.cloudflare.com/rfc-8446-aka-tls-1-3/), Nick Sullivan, Cloudflare, 2018. Hybrid cryptosystems, RSA vs Diffie-Hellman key exchange, forward secrecy, and why TLS 1.3 dropped RSA key transport.
- [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748), Adam Langley, Mike Hamburg and Sean Turner, IRTF, 2016. X25519, with a Diffie-Hellman exchange spelled out step by step.
- [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032), Simon Josefsson and Ilari Liusvaara, IRTF, 2017. Ed25519 signatures and what makes them easier to use safely.
