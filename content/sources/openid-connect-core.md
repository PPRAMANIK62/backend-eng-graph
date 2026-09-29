---
id: openid-connect-core
title: OpenID Connect Core 1.0 incorporating errata set 2
author: Nat Sakimura, John Bradley, Michael B. Jones, Breno de Medeiros, Chuck Mortimore, OpenID Foundation
url: https://openid.net/specs/openid-connect-core-1_0.html
kind: spec
primary: true
---

## Summary

The OpenID Connect spec (final 1.0, errata set 2). An identity layer on
OAuth 2.0: the client asks for the `openid` scope and gets back an ID
token, a signed JWT that says who logged in, at which provider, for
which client, and when. Also defines the UserInfo endpoint, standard
claims, and exactly how a client must validate an ID token.

## Key claims

- What OIDC is. "OpenID Connect 1.0 is a simple identity layer on top of the OAuth 2.0 protocol." (Abstract)
- The ID token is the main addition to OAuth. "The primary extension that OpenID Connect makes to OAuth 2.0 to enable End-Users to be Authenticated is the ID Token data structure." (2)
- The ID token is a JWT. "The ID Token is represented as a JSON Web Token (JWT)" (2)
- Requests must carry the openid scope. "OpenID Connect requests MUST contain the openid scope value." (3.1.2.1)
- `sub` is unique within the issuer and never reassigned. "A locally unique and never reassigned identifier within the Issuer for the End-User" (2, sub)
- `aud` must contain the client's client_id. "It MUST contain the OAuth 2.0 client_id of the Relying Party as an audience value." (2, aud)
- ID token expiry isn't the session lifetime. "The ID Token expiration time is unrelated the lifetime of the authenticated session between the RP and the OP." (2, exp)
- The nonce ties the token to the client session and stops replay. "String value used to associate a Client session with an ID Token, and to mitigate replay attacks." (2, nonce)
- In the code flow tokens come from the token endpoint, never through the browser. "This provides the benefit of not exposing any tokens to the User Agent and possibly other malicious applications with access to the User Agent." (3.1)
- Validation: the issuer must match exactly. "The Issuer Identifier for the OpenID Provider (which is typically obtained during Discovery) MUST exactly match the value of the iss (issuer) Claim." (3.1.3.7)
- Validation: the audience must include the client. "The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience." (3.1.3.7)
- If the token came straight from the token endpoint over TLS, TLS can stand in for the signature check. "the TLS server validation MAY be used to validate the issuer in place of checking the token signature." (3.1.3.7)
- Otherwise check the signature with the issuer's keys. "The Client MUST use the keys provided by the Issuer." (3.1.3.7)
- Expiry. "The current time MUST be before the time represented by the exp Claim." (3.1.3.7)
- Nonce must match what was sent. "a nonce Claim MUST be present and its value checked to verify that it is the same value as the one that was sent in the Authentication Request." (3.1.3.7)
- UserInfo is an OAuth protected resource called with the access token. "The UserInfo Endpoint is an OAuth 2.0 Protected Resource that returns Claims about the authenticated End-User." (5.3)
- Only iss plus sub is a stable user identifier; email is not. "the only guaranteed unique identifier for a given End-User is the combination of the iss Claim and the sub Claim." (5.7)
- Email isn't unique. "The RP MUST NOT rely upon this value being unique" (5.1, email)
- `iss` is an https URL. "The iss value is a case-sensitive URL using the https scheme" (2, iss)
- `iat` is the issue time. "Time at which the JWT was issued." (2, iat)
- `auth_time` is when the user authenticated; required when asked for. "Time when the End-User authentication occurred." and "When a max_age request is made or when auth_time is requested as an Essential Claim, then this Claim is REQUIRED" (2, auth_time)
- How an email gets verified is up to the provider's context. "The means by which an e-mail address is verified is context specific, and dependent upon the trust framework or contractual agreements within which the parties are operating." (5.1, email_verified)
- Three flows. "Authentication can follow one of three paths: the Authorization Code Flow ( response_type=code ), the Implicit Flow ( response_type=id_token token or response_type=id_token ), or the Hybrid Flow" (3)

## Visuals worth redrawing

- The claims list in section 2 as a labelled token.

## My notes

- The implicit and hybrid flows are still in the spec; RFC 9700 steers
  away from front-channel tokens.
