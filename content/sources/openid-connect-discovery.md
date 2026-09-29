---
id: openid-connect-discovery
title: OpenID Connect Discovery 1.0 incorporating errata set 2
author: Nat Sakimura, John Bradley, Michael B. Jones, Edmund Jay, OpenID Foundation
url: https://openid.net/specs/openid-connect-discovery-1_0.html
kind: spec
primary: true
---

## Summary

How a client finds a provider's endpoints and signing keys: a JSON
document at `/.well-known/openid-configuration` under the issuer URL.

## Key claims

- The metadata document lives at a well-known path under the issuer. "OpenID Providers supporting Discovery MUST make a JSON document available at the path formed by concatenating the string /.well-known/openid-configuration to the Issuer." (4)
- `jwks_uri` points to the signing keys. "This contains the signing key(s) the RP uses to validate signatures from the OP." (3, jwks_uri)
- The `issuer` in metadata must equal `iss` in ID tokens. "This also MUST be identical to the iss Claim value in ID Tokens issued from this Issuer." (3, issuer)

## Visuals worth redrawing

None.

## My notes

- Key rotation happens by publishing new keys at jwks_uri.
