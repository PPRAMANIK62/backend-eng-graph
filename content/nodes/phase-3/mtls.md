---
id: mtls
title: Mutual TLS
depth: short
phase: 3
note: >-
  Both sides show a certificate. How services prove who they are to each
  other.
needs: [certificates-and-pki, tls]
leads_to: [zero-trust, service-mesh, sender-constrained-tokens]
compare_with: []
---

# Mutual TLS

In ordinary [[tls|TLS]] only the server proves who it is. In mutual TLS
(mTLS) the server also asks the client for a certificate, and the
client proves it holds the matching private key. Both ends then know
who's on the other side. It's a common way for services inside a
system to prove who they are to each other, with certificates instead
of shared passwords or [[api-keys|API keys]].

## What changes in the handshake

Everything from the normal TLS 1.3 handshake stays. Two things are
added:

1. In its encrypted flight, right after EncryptedExtensions, the server
   sends a **CertificateRequest**, saying which signature algorithms it
   accepts and optionally which CAs.
2. After checking the server, the client answers with its own
   **Certificate** and **CertificateVerify** (a signature over the
   handshake with its private key) before its Finished.

The server then checks the client's chain against its own set of
trusted CAs, the same way the client checks the server's, as described
in [[certificates-and-pki]]. In TLS 1.3 the client's certificate travels
encrypted, so someone watching the network can't read who connected.

If the client sends no certificate, or one the server doesn't trust,
TLS leaves it to the server: carry on treating the client as
anonymous, or abort. Your configuration makes that choice.

## Server policy is a setting, and the default is off

Go's `crypto/tls` shows the range of choices clearly. `ClientAuth`
defaults to `NoClientCert`. The other values are:

- `RequestClientCert`: ask, but don't require one.
- `RequireAnyClientCert`: require a certificate, but **don't check it's
  valid**.
- `VerifyClientCertIfGiven`: optional, but checked if sent.
- `RequireAndVerifyClientCert`: require one, and check it against the
  roots in `ClientCAs`.

For mTLS between services you want the last one. The second one sounds
right and authenticates nothing, since any self-made certificate
passes.

## Where the identity comes from

A verified certificate proves the client holds a key some CA you trust
vouched for. What that key *is* depends on the names inside it. For
services, a common scheme is SPIFFE:

- Each workload gets an ID in URI form, like
  `spiffe://acme.com/billing/payments`.
- The ID goes into a short-lived X.509 certificate called an
  X.509-SVID, together with a private key.
- Each **trust domain**, such as production, has its own root keys.
  Workloads get a **trust bundle** of those roots to check each other's
  certificates. Staging and production belong in separate trust
  domains.
- Keys and certificates are short-lived and rotated automatically; the
  Workload API hands out fresh ones before the old ones expire.

This is where [[certificates-and-pki|PKI]] for internal traffic differs
from the public web: you run the CA, you pick the lifetimes, and no
browser needs to trust your root.

Knowing who the caller is doesn't say what it's allowed to do. After
the handshake, your service still has to check that
`spiffe://acme.com/billing/payments` may call this endpoint.

## Where it gets tricky

**Proxies in the middle break it.** mTLS authenticates one TLS
connection. If a [[reverse-proxy|reverse proxy]] or
[[l4-vs-l7|L7 load balancer]] terminates TLS, the backend sees the
proxy's identity, not the original caller's. SPIFFE offers tokens
(JWT-SVIDs) for that case, but a stolen token can be replayed, which is
why SPIFFE prefers certificates wherever they work.

**Checks that skip resumed connections.** In Go, a custom
`VerifyPeerCertificate` callback isn't called on resumed connections,
so an extra check placed there can be silently skipped;
`VerifyConnection` runs on every connection. A server resuming a
session doesn't ask for the client certificate again;
[[tls-resumption|resumption]] carries the earlier authentication
forward.

**Rotation is the real work.** Short-lived client certificates are the
point: a leaked key stops working soon, without depending on
revocation. That means every service must pick up new certificates
without a restart, and an expired certificate on one service fails
every call it makes.

**One certificate for both roles.** It's common for a service to use the
same certificate as a client and as a server. That setup hasn't been
analyzed much; the higher-level protocol has to make
sure the two roles can't be confused.

## What this means when you build

- Require and verify client certificates (`RequireAndVerifyClientCert`
  in Go), against a CA pool that contains only your internal roots.
- Authorize on the identity in the certificate, per endpoint, after the
  handshake.
- Automate issuance and rotation, with short lifetimes, and alert on
  certificates close to expiry.
- Decide where TLS terminates. If a proxy sits between services, either
  run mTLS on each hop or pass the caller's identity on in a way the
  backend can check.

## Further reading

- [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846), Eric Rescorla, IETF, 2026. CertificateRequest (4.4.2), what a server may do without a client certificate (4.5.1.3), and post-handshake authentication (4.7.2).
- [SPIFFE Concepts](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/), SPIFFE project. Workload IDs, X.509-SVIDs, trust domains and automatic rotation.
- [crypto/tls](https://pkg.go.dev/crypto/tls), the Go authors, Go 1.27. The client-certificate policies in a real server, and the resumption caveat.
