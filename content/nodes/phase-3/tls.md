---
id: tls
title: TLS
depth: deep
phase: 3
note: >-
  Encryption and server identity on top of TCP. The TLS 1.3 handshake
  step by step.
needs: [tcp, public-key-crypto, symmetric-encryption]
leads_to: [tls-resumption, mtls, quic, encrypted-dns, connection-pooling, oauth2]
compare_with: []
---

# TLS

TLS (Transport Layer Security) turns a plain [[tcp|TCP]] connection
into a private one with a checked identity on the other end. It's the
"S" in HTTPS, and it belongs on any connection that crosses a network
you don't fully control. TLS 1.3 sets all of that up in one round trip.
You'll never touch the cryptography inside; the checks around it are
where your code can go wrong.

## What TLS promises

TLS needs only a reliable, in-order byte stream underneath, which is
exactly what TCP provides. On top of it, TLS promises three things, even
against an attacker who controls the whole network:

- **Authentication.** The server is always authenticated. The client is
  authenticated only if the server asks for it (that's [[mtls]]).
- **Confidentiality.** After the handshake, only the two ends can read
  the data.
- **Integrity.** Nobody can change, drop, add or reorder data without
  being detected.

And what it doesn't promise:

- **Hiding how much you send.** Record lengths are visible, unless you
  pad them.
- **Hiding which site you're visiting.** The name of the server travels
  in the clear in the first message (more below).
- **Protection past the other end.** TLS protects one connection. If a
  proxy terminates TLS and opens a new connection to your backend, that
  second hop is protected only if it runs its own TLS.

TLS has two parts. The **handshake** agrees on keys and checks
identity. The **record layer** then cuts your data into records and
protects each one with those keys.

## A short history

TLS began as SSL at Netscape in the mid-1990s. The IETF took it over at
the end of that decade and renamed it. TLS 1.0 was RFC 2246, 1.1 was
RFC 4346, and 1.2 was RFC 5246. TLS 1.3 came out as RFC 8446 in 2018,
the first real redesign.

In 2026 RFC 9846 replaced RFC 8446. It's the same TLS 1.3, with the same
version number and backward compatible, with a few tightened rules: TLS 1.0 and
1.1 may no longer be negotiated, a key share can't be reused across
connections, and the word "master" in secret names became "main". Older
tutorials cite RFC 8446, and that's fine for the protocol itself.

## The TLS 1.3 handshake, step by step

Say your service calls `https://api.example.com`. The TCP
[[tcp-handshake|handshake]] has finished. Here's what happens next:

![Timeline between client and server. After the TCP handshake, the client sends ClientHello with a random value, supported versions, cipher suites, the server name, and a key share it guessed. The server replies with ServerHello and its own key share; from here both sides can compute handshake keys. Still in the same flight, encrypted with those keys, the server sends EncryptedExtensions, Certificate, CertificateVerify (a signature over the handshake so far) and Finished (a MAC over the handshake). The client checks the certificate and signature, sends its own Finished, and can send its first request right after. The TLS part takes one round trip.](img/tls-handshake-1-3.svg)

*The TLS 1.3 full handshake. Adapted from Eric Rescorla, RFC 9846, "The Transport Layer Security (TLS) Protocol Version 1.3", figure 1 (2026).*

**1. ClientHello (in the clear).** The client sends:

- a fresh random value;
- the TLS versions it supports;
- the cipher suites it supports, each an AEAD cipher plus a hash;
- the server name it wants, in the SNI extension, so one IP address can
  host many sites, each with its own certificate;
- one or more **key shares**: the public half of a fresh
  [[public-key-crypto|Diffie-Hellman]] key pair, in a group it guesses
  the server supports, like X25519.

**2. ServerHello (in the clear).** The server picks the version and
cipher suite and sends its own key share in the same group. Now both
sides can combine their private key with the other's share and get the
same secret. From it they derive the handshake keys. Everything after
this point is encrypted.

**3. The server's encrypted flight.** In the same round trip the server
sends:

- **EncryptedExtensions**: the rest of its answers, like which
  application protocol it picked. In TLS 1.2 these went in the clear.
- **Certificate**: its certificate chain, which says "this public key
  belongs to api.example.com". Whether to believe that is the job of
  [[certificates-and-pki]].
- **CertificateVerify**: a signature, made with the private key that
  matches the certificate, over a [[cryptographic-hashes|hash]] of the
  whole handshake so far. It proves the server holds that key, and that
  nobody tampered with any earlier message, including the cipher
  negotiation.
- **Finished**: a MAC (see [[hmac]]) over the whole handshake. It
  confirms both sides computed the same keys.

**4. The client checks and finishes.** The client verifies the
certificate chain, checks the name matches, checks the signature, then
sends its own Finished. It can send its HTTP request right behind it.

The server may even start sending data after its first flight, before
the client's Finished arrives, but at that point it's talking to a peer
it hasn't authenticated.

If the client guessed the wrong key share group, the server answers with
a **HelloRetryRequest** naming a group it supports, and the client
starts over. That costs an extra round trip, but it's rare because the
list of groups is short.

## Why one round trip instead of two

TLS 1.2 needed two round trips before encrypted data could flow. On a
mobile network, where a round trip can take 200 ms, that's a lot of
waiting before the first byte.

TLS 1.3 cut the choices down so far that the client can guess. There's
no RSA key transport and no custom Diffie-Hellman parameters, so the
server almost certainly supports X25519 or P-256. The client sends a key
share for its guess in the very first message, and the server can reply
with its share and encrypted data at once.

Add the TCP handshake and a fresh HTTPS connection costs two round trips
before the request goes out. [[tls-resumption|Resumption and 0-RTT]]
can shave that further for repeat visits. [[quic|QUIC]], which
requires TLS 1.3, changes the picture again.

## The record layer

After the handshake, your bytes are cut into records, each encrypted
and authenticated with an [[symmetric-encryption|AEAD]] cipher:
AES-GCM or ChaCha20-Poly1305. Every TLS 1.3 implementation must support
AES-128-GCM with SHA-256.

The AEAD needs a nonce that never repeats. TLS never sends one: each
side keeps a 64-bit record counter, starting at zero, and XORs it with a
per-direction value derived from the handshake. Because the counter
never repeats, neither does the nonce, and a record that's replayed,
dropped or reordered is rejected.

Keys also wear out. For AES-GCM, the spec allows about 24 million
full-size records under one key before an implementation must switch to
fresh keys with a KeyUpdate message, or close the connection.

## What TLS 1.3 took out

A big part of TLS 1.3's design was deleting things that had been
attacked for years:

- **RSA key transport.** The client used to encrypt the secret to the
  server's RSA key. Anyone who later stole that key could decrypt every
  recorded session, and the padding was easy to get wrong. Now every key
  exchange is ephemeral Diffie-Hellman, so every connection has forward
  secrecy.
- **Old ciphers and MAC-then-encrypt.** RC4 had exploitable biases, and
  CBC mode with a MAC applied before encryption led to a string of
  padding attacks. Only AEAD ciphers remain.
- **Unsigned negotiation.** In TLS 1.2 the server's signature didn't
  cover the cipher negotiation, so an attacker in the middle could
  quietly downgrade both sides to weak export ciphers. In TLS 1.3 the
  signature covers the whole handshake.
- **Plaintext handshake messages.** Everything after ServerHello is
  encrypted, including the server's certificate.

## Where it gets tricky

**Encryption without a name check is worth little.** A valid certificate
and a correct signature prove the other side holds *some* key that
*some* CA vouched for. Only checking the name in the certificate against
the name you meant to reach proves you got the right server. Libraries
do this by default; the classic bug is turning it off. In Go,
`InsecureSkipVerify: true` accepts any certificate for any name and
opens you to a machine in the middle. It's meant for tests, or for code
that runs its own verification callback instead.

**SNI leaks the name.** Because ClientHello is sent before any keys
exist, anyone on the path can read which host you asked for. Encrypted
Client Hello (RFC 9849, 2026) closes that gap: the client encrypts the
ClientHello under a public key the server publishes, so it only works
with servers that publish one. Plain [[dns|DNS]] lookups and a server's own IP
address can still give the name away.

**Middleboxes shaped the protocol.** When TLS 1.3 was being deployed,
many firewalls and proxies broke on anything that didn't look like TLS
1.2. So TLS 1.3 disguises itself: it sends fake ChangeCipherSpec
messages and a legacy session ID so it looks like TLS 1.2 resumption on
the wire. That's why a [[packet-capture|packet capture]] of TLS 1.3 shows fields that do
nothing.

**TLS 1.2 is still around, and still acceptable if configured well.**
Go's `crypto/tls` still defaults to a minimum of TLS 1.2. It can be run
securely, but that's much harder than with TLS 1.3, and since 2026 the
IETF requires new protocols to default to TLS 1.3. TLS 1.2 also won't
get post-quantum key exchange.

**Post-quantum has already arrived in the defaults.** Since Go 1.24,
Go's TLS offers X25519MLKEM768, a hybrid of X25519 and a post-quantum
key exchange, by default.

**Termination moves the trust boundary.** Put a
[[reverse-proxy|reverse proxy]] or [[load-balancing|load balancer]] in front and TLS ends
there. Everything behind it is plain TCP unless you add TLS again.

## What this means when you build

- Use TLS 1.3. Allow 1.2 only when old clients need it; never 1.0 or
  1.1.
- Let the library pick cipher suites. In Go you can't even configure the
  TLS 1.3 ones.
- Never ship `InsecureSkipVerify` or its equivalent. For internal
  services, give the client the right root certificates instead.
- Make sure the client knows the name it expects (in Go, `ServerName`).
- The handshake costs a round trip plus public-key work on the server,
  so keep connections open and reuse them with
  [[connection-pooling|connection pooling]].
- Decide where TLS terminates, and whether the hops behind that need
  their own TLS or [[mtls]].

## Further reading

- [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846), Eric Rescorla, IETF, 2026. The current TLS 1.3 spec: handshake, record layer, key limits, what changed from RFC 8446.
- [A Detailed Look at RFC 8446 (a.k.a. TLS 1.3)](https://blog.cloudflare.com/rfc-8446-aka-tls-1-3/), Nick Sullivan, Cloudflare, 2018. Why TLS 1.3 removed what it removed, the attacks behind each change, and how the handshake got to one round trip.
- [RFC 9325](https://www.rfc-editor.org/rfc/rfc9325), Yaron Sheffer, Peter Saint-Andre and Thomas Fossati, IETF, 2022. How to deploy TLS safely: versions, SNI, and why host name validation matters.
- [RFC 9849](https://www.rfc-editor.org/rfc/rfc9849), Eric Rescorla, Kazuho Oku, Nick Sullivan and Christopher A. Wood, IETF, 2026. Encrypted Client Hello: hiding SNI, and what it can't hide.
- [RFC 9852](https://www.rfc-editor.org/rfc/rfc9852), Rich Salz and Nimrod Aviram, IETF, 2026. Why new protocols must require TLS 1.3, and what's wrong with TLS 1.2.
- [crypto/tls](https://pkg.go.dev/crypto/tls), the Go authors, Go 1.27. A real implementation's defaults: versions, cipher suites, post-quantum key exchange, and the verification switches.
