---
id: certificates-and-pki
title: Certificates and PKI
depth: deep
phase: 3
note: >-
  How a chain of certificates proves a server is who it claims. CAs,
  ACME, revocation, certificate transparency.
needs: [public-key-crypto]
leads_to: [mtls]
compare_with: []
---

# Certificates and PKI

A certificate is a signed statement: "this public key belongs to
api.example.com, until this date", signed by a certificate authority
(CA). Your client trusts a small, fixed set of CAs, and follows a chain
of such statements from the server's certificate back to one of them.
That system, the public key infrastructure (PKI), is what lets
[[tls|TLS]] tell the real server from an impostor. For a backend
engineer, the day-to-day problems are operational: expired
certificates, missing intermediates, and renewals nobody automated.

## The problem certificates solve

In a TLS handshake the server proves it holds a private key by
[[public-key-crypto|signing]] the handshake. That proves nothing useful
unless you know the matching public key really belongs to the server
you meant to reach. An attacker in the middle can sign handshakes too,
with their own key.

You could carry every server's public key around, but that doesn't
scale. Instead you carry the public keys of a small set of CAs, and each
server shows you a CA's signed statement tying its key to its name.

## What's inside a certificate

A certificate (an X.509 v3 certificate, in the format from RFC 5280)
holds:

- **Subject names.** The [[dns|DNS]] names (and sometimes IP addresses) it's
  valid for, in the *subject alternative name* extension. Clients check
  the name they connected to against this list.
- **The public key.** The key the server will sign with.
- **Validity.** A `notBefore` and `notAfter` time. Outside that window,
  the certificate is invalid.
- **Issuer.** Which CA signed it.
- **Extensions.** Among them *basic constraints*, which says whether
  this certificate belongs to a CA. Only a certificate marked as a CA
  may be used to check signatures on other certificates.
- **The CA's signature** over all of the above.

Because the whole thing is signed, a certificate doesn't need to travel
over a secure channel, and anyone may cache or forward it. Changing any
byte breaks the signature.

## Following the chain

Real servers don't get certificates straight from a root CA. The root
keys are kept in vault-like facilities and used to sign
**intermediate** CA certificates. The intermediates sign server
certificates day to day.

![A certificate chain. At the bottom, the leaf certificate for api.example.com holds the server's public key and is signed by an intermediate CA. The intermediate certificate, marked as a CA, holds the intermediate's public key and is signed by the root. The root certificate is self-signed and sits in the client's trust store. The server sends the leaf and the intermediate; the client already has the root. The client checks each signature with the key one level up, checks every certificate is within its validity period, checks the CA flag on the intermediate, and checks the name it dialed is in the leaf.](img/certificates-and-pki-chain.svg)

*A certificate chain from leaf to trust anchor.*

When your client connects, the server sends its own certificate (the
**leaf**) plus the intermediates. The client:

1. checks the leaf's signature with the intermediate's public key, and
   the intermediate's with the root's;
2. stops at a root it already trusts, a **trust anchor** from its trust
   store;
3. checks every certificate in the chain is inside its validity period
   right now;
4. checks that each issuer is allowed to be a CA;
5. checks the name it dialed is in the leaf's subject alternative
   names.

Any failure, and the handshake should stop. A certificate with a
critical extension the client doesn't understand is rejected too.

## How a CA decides to sign: ACME

Most server certificates are **domain validated** (DV). The CA checks
only that whoever asks controls the domain, not who they are. That
check used to be manual: generate a request, paste it into the CA's
web page, put a file on your server or answer an email, download the
result. In informal tests by the people who designed ACME, webmasters
often needed one to three hours for it.

ACME (RFC 8555, 2019), the protocol Let's Encrypt and others use, makes
it a machine-to-machine exchange. Your ACME client holds an account key,
asks for a certificate for a name, and proves control with a challenge:

- **http-01**: serve a token at
  `http://<name>/.well-known/acme-challenge/<token>`. It runs over plain
  HTTP on purpose.
- **dns-01**: publish a [[dns-records|TXT record]] at `_acme-challenge.<name>` holding a
  SHA-256 hash of the token and your account key. Since nothing is fetched from
  the server itself, it also works for servers the CA can't reach.

Then it finalizes the order with a certificate signing request carrying
the server's public key, and downloads the certificate. Renewal is the same steps again,
which is the point: a cron job can do it.

## Certificates are getting much shorter

Certificate lifetimes are set by the CA/Browser Forum, the group where
CAs and browser makers agree the rules for publicly trusted
certificates. Under its Baseline Requirements the maximum lifetime is:

| Issued | Maximum lifetime |
|---|---|
| until 2026 | 398 days |
| from 2026 | 200 days |
| from 2027 | 100 days |
| from 2029 | 47 days |

Each step takes effect partway through its year, not on the first day.

Let's Encrypt's default is 90 days, moving to 45 days over the next few
years. Since 2026 it also offers opt-in certificates that last 160
hours, just over six days.

Shorter lifetimes mean the CA re-checks domain control more often, and
a leaked key or a wrongly issued certificate stops working sooner on
its own. That matters because the usual way to kill a bad certificate
early, revocation, doesn't work well.

## Revocation, and why it's being replaced

When a key is stolen or a certificate was issued wrongly, the CA
**revokes** it. There are two ways to tell clients:

- **CRLs** (certificate revocation lists): the CA regularly publishes a
  signed list of revoked serial numbers. Clients download it. A
  revocation only reaches clients when the next list comes out.
- **OCSP** (Online Certificate Status Protocol): the client asks the CA
  about one certificate when it connects. That tells the CA which site
  each user is visiting, from which IP address.

Both share one weakness: in practice many clients stay exposed to a
revoked certificate until it expires anyway. Let's
Encrypt, whose OCSP service handled around 340 billion requests a month
at its peak, turned it off in 2025 and now publishes CRLs only. The
Baseline Requirements made OCSP optional and CRLs mandatory back in
2023, and certificates that last 7 days or less don't have to be
revocable at all. The idea is that expiry becomes the revocation.

## Certificate transparency: catching the wrong certificate

The chain check only asks whether *some* trusted CA signed the
certificate. Nothing in it stops a CA from signing one for your name
that you never asked for. Certificate transparency (CT) is how you'd
find out.

- Before issuing, the CA submits a **precertificate** (the certificate
  with a "poison" extension so nobody can use it) to public CT logs.
- Each log replies with a **signed certificate timestamp** (SCT), a
  promise to add the certificate within the maximum merge delay,
  usually 24 hours.
- The CA puts the SCTs inside the final certificate. Chrome and Safari
  require at least two SCTs, depending on the certificate's lifetime.
- The logs are [[append-only-log|append-only]], built as Merkle trees
  of [[cryptographic-hashes|hashes]], so anyone can check a log hasn't
  quietly removed or rewritten an entry.
- **Monitors** read every log and alert domain owners about new
  certificates for their names.

CT doesn't stop a bad certificate from being issued. It makes every
publicly trusted certificate visible, so a wrong one gets noticed.

## Where it gets tricky

**Expiry is an outage you schedule in advance.** A certificate works
perfectly until the second it expires, then every client refuses it at
once. With 47-day lifetimes coming, renewing by hand stops being an
option.

**Missing intermediates.** If the server sends only its leaf, a client
that doesn't already hold the intermediate can't build the chain, and
fails. It can work from one machine and fail from the next. Always
serve the full chain (minus the root).

**DV proves control of a name, nothing more.** A valid certificate for
`paypa1-login.com` says nothing about who runs it.

**CT logs are public.** Every publicly trusted certificate, with every
name in it, ends up in a log anyone can read. Don't put internal
hostnames in public certificates if the names themselves are secret.

**Internal services don't need the public PKI.** The Baseline
Requirements, including the lifetime limits, apply to certificates for
servers on the public internet. For service-to-service traffic you can
run a private CA and ship its root only to your own clients, the same
setup you'd use for [[mtls]] between your own services.

## What this means when you build

- Automate issuance and renewal with ACME. Renew well before expiry, not
  the day before.
- Alert on certificate expiry, from outside, on every endpoint.
- Serve the full chain. Test from a fresh client, not your browser.
- Watch CT for your domains so you hear about certificates you didn't
  request.
- Use a private CA for internal traffic, with short lifetimes and
  automatic rotation.
- Don't build on OCSP. Plan for short lifetimes instead.

## Further reading

- [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), David Cooper et al., IETF, 2008. The X.509 certificate and CRL profile: fields, extensions, chains and path validation.
- [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555), Richard Barnes et al., IETF, 2019. ACME: how a CA checks domain control and issues certificates automatically.
- [How CT works](https://certificate.transparency.dev/howctworks/), Certificate Transparency project. Precertificates, SCTs, logs and monitors, step by step, and how CT fits into the Web PKI.
- [TLS Baseline Requirements](https://github.com/cabforum/servercert/blob/main/docs/BR.md), CA/Browser Forum, version 2.3.0, 2026. The rules for publicly trusted certificates, including the lifetime schedule and revocation rules.
- [OCSP Service Has Reached End of Life](https://letsencrypt.org/2025/08/06/ocsp-service-has-reached-end-of-life), Let's Encrypt, 2025. Why Let's Encrypt turned off OCSP, and how much traffic it carried.
- [6-day and IP Address Certificates are Generally Available](https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability), Let's Encrypt, 2026. Short-lived certificates, and why revocation isn't enough.
