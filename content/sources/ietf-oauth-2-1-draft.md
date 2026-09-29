---
id: ietf-oauth-2-1-draft
title: "The OAuth 2.1 Authorization Framework (draft-ietf-oauth-v2-1-16)"
author: Dick Hardt, Aaron Parecki, Torsten Lodderstedt, IETF OAuth WG
url: https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
kind: spec
primary: true
---

## Summary

The working draft that folds RFC 6749, RFC 6750, PKCE, the native apps
BCP and the security BCP into one document. Read at revision -16; still
an Internet-Draft, not an RFC, when this was written.

## Key claims

- It would obsolete RFC 6749 and RFC 6750. "This specification replaces and obsoletes the OAuth 2.0 Authorization Framework described in RFC 6749 and the Bearer Token Usage in RFC 6750." (Abstract)
- PKCE becomes part of the default code flow. "the default method of using the authorization code grant according to this specification requires the addition of the PKCE parameters" (10)
- Implicit grant removed. "The Implicit grant (response_type=token) is omitted from this specification" (10)
- Password grant removed. "The Resource Owner Password Credentials grant is omitted from this specification" (10)
- PKCE plain removed. "The PKCE plain method is removed" (10)
- Why implicit went: tokens in the front channel. "such tokens are vulnerable to leakage and injection, and are unable to be sender-constrained to a client." (10.1)
- The client credentials grant stays, for a client acting for itself. "The client can request an access token using only its client credentials (or other supported means of authentication) when the client is requesting access to the protected resources under its control" (4.2)
- Bearer tokens no longer in query strings. "Bearer token usage omits the use of bearer tokens in the query string of URIs" (10)
- Exact redirect matching. "Redirect URIs must be compared using exact string matching" (10)

## Visuals worth redrawing

None.

## My notes

- Drafts expire and change; pin to revision -16.
