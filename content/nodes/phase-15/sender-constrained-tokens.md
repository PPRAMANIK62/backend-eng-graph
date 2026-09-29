---
id: sender-constrained-tokens
title: Sender-constrained tokens
depth: short
phase: 15
note: >-
  Access tokens bound to the client's key (DPoP, mTLS), so a stolen
  token is useless on its own.
needs: [oauth2, mtls]
leads_to: []
compare_with: []
---

# Sender-constrained tokens

A plain [[oauth2|OAuth]] access token is a bearer token: whoever holds
it can use it. Tokens leak, through logs and through bugs in other layers of the
stack, and a leaked bearer token works for the
attacker exactly as it did for you. A sender-constrained token is bound
to a key that only the legitimate client holds. Presenting it isn't
enough; the client must also prove, on each request, that it has the
key. OAuth's current security advice (RFC 9700) says servers should
use sender-constrained tokens.

## The idea: prove you hold the key

When the authorization server issues the token, it writes into the token
a fingerprint of the client's public key (or certificate). When the
client uses the token, it also proves possession of the matching
private key. The resource server checks that the key proved matches the
key named in the token. A thief with the token but not the private key
fails that check.

There are two standard ways to do the proving.

## Mutual TLS: bind the token to a certificate

With RFC 8705 (2020), the client authenticates with a TLS client
certificate, [[mtls|mutual TLS]]. The authorization server puts the
certificate's SHA-256 hash in the token, in a confirmation claim called
`x5t#S256`. Every request to the API must then arrive over a mutual-TLS
connection made with that same certificate, and the resource server
rejects the request if the certificate doesn't match.

It's simple for services that already use mTLS. The costs: tokens stop
working the moment the client rotates its certificate, so it has to
fetch new ones; and if TLS ends at a load balancer or
[[reverse-proxy]], the certificate details have to be passed to the
application somehow, which the RFC leaves out of scope.

## DPoP: bind the token to a key, in HTTP

DPoP (Demonstrating Proof of Possession, RFC 9449, 2023) works at the
application layer, with no special TLS. The client holds a key pair.
With each request it sends a `DPoP` header containing a fresh
[[jwt|JWT]] signed with its private key, holding:

- `htm` and `htu`: the HTTP method and the URL (without the query) of
  this request;
- `iat`: when the proof was made;
- `jti`: a unique id, so a server can spot a replayed proof;
- `ath`: a hash of the access token it's used with.

The access token records the public key's thumbprint in a `jkt` claim.
The resource server checks the proof's signature, method, URL, age and
token hash, then confirms the key matches the one bound to the token.
A stolen token is useless without the key, and a stolen proof only
works for that one method and URL, for a short time.

## Where it gets tricky

**The key has to stay secret too.** DPoP moves the problem from the
token to the private key. If an attacker can run code inside the client,
for example through XSS in a browser app, they can make valid proofs
themselves; RFC 9449 considers that out of scope, beyond preventing XSS.

**DPoP doesn't protect the request body.** The proof covers the method
and URL, not the body or other headers. An attacker who can change a
request in flight could keep the proof and alter the contents. That's a
deliberate trade to keep DPoP simple.

**Replay needs server state.** Stopping a proof from being reused means
remembering `jti` values for the window proofs are accepted, or using
server-issued nonces.

## What this means when you build

- For APIs that hold anything valuable, don't rely on bearer tokens
  alone. Use mTLS-bound tokens between services, DPoP for clients that
  can't do client certificates.
- If TLS ends at a proxy, decide how the client certificate reaches the
  application before choosing mTLS binding.
- Plan for certificate and key rotation: bound tokens die with the key.
- Still keep tokens short-lived and narrowly scoped.

## Further reading

- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700), T. Lodderstedt et al., IETF, 2025. The recommendation to sender-constrain access and refresh tokens.
- [RFC 9449: OAuth 2.0 Demonstrating Proof of Possession (DPoP)](https://www.rfc-editor.org/rfc/rfc9449), D. Fett et al., IETF, 2023. The DPoP proof JWT, the jkt binding, and its security considerations.
- [RFC 8705: OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens](https://www.rfc-editor.org/rfc/rfc8705), B. Campbell et al., IETF, 2020. Binding tokens to a client certificate, and what happens on rotation and TLS termination.
