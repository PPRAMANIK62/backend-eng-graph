---
id: owasp-jwt
title: JSON Web Token Cheat Sheet
author: OWASP Cheat Sheet Series contributors
url: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's guide to using JWTs safely: when not to use them (stateless
sessions), signatures vs MACs, which claims to check, revocation (Token
Status Lists, deny lists and their pitfalls), and why a signed JWT is
not confidential.

## Key claims

- JWTs for sessions are discouraged. "A JWT is often suggested for “stateless” user sessions. However, this usage is frowned upon." (Introduction)
- Logout needs a deny list, which brings state back. "If your application implements such a deny list, user sessions won't be completely stateless anymore which might defeat the benefits of stateless sessions." (Not using JWTs)
- With a signature, only the issuer can mint tokens; with a MAC, everyone who verifies can. "When using a MAC, a shared secret is shared between the issuer and the audience." (Public-key Signatures vs. MAC)
- Deny list keyed by issuer and jti, not the raw token. "Using the raw JWT or a secure hash of the JWT (SHA-256(token)) as the denylist key is not safe and might expose the application to denylist bypass through JWT malleability." (JWT denylist)
- Key the deny list on jti and iss. "A JWT deny list can typically be implemented based on the jti and iss claims" (JWT denylist)
- Alternatives to deny lists: short expiry, sender-constrained tokens. "Token reuse can be mitigated by using short expiration time in the JWT." (JWT denylist)
- Token Status Lists for issuer revocation. "the TSL aggregates the revocation status of several tokens in compressed form;" (Token Status List)
- Signed JWTs are readable. "The payload is only base64url encoded, not encrypted, so anyone who obtains the token can read every claim." (Signed JWTs are not confidential)
- Claims leak in many places. "TLS prevents the token from being read in transit, but the claims remain exposed elsewhere: in application logs, in browser storage, in referrer headers, and to any intermediary that terminates TLS." (Signed JWTs are not confidential)
- JWTs as workload credentials. "In SPIFFE, a JWT-SVID can be used to authenticate a workload." (Introduction)
- OAuth access tokens can be JWTs. "In OAuth 2, the access token used to obtain access to a protected resource can be a JWT." (Introduction)

## Visuals worth redrawing

None.

## My notes

- The page also covers DPoP and TLS-bound (sender-constrained) tokens.
