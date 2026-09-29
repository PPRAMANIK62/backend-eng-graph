---
id: gitlab-authentication-guidelines
title: Authentication development guidelines, GitLab Docs
author: GitLab Authentication team
url: https://docs.gitlab.com/development/authentication/
kind: docs
primary: true
---

## Summary

GitLab's internal-facing guide for developers touching sign-in and
tokens. Includes a table of token prefixes and how each token type is
stored.

## Key claims

- Personal access tokens (glpat-) are stored as a SHA-256 digest. "glpat- Personal, project, or group access token SHA-256 digest" (Token prefixes)
- Tokens GitLab must be able to read back (deploy tokens, CI job tokens) are encrypted instead. "gldt- Deploy token AES-256-GCM encrypted glcbt- CI job token AES-256-GCM encrypted" (Token prefixes)
- New token types must not be stored in plaintext. "Do not add new token types with insecure: true storage strategy. Use digest: true for SHA-256 digest storage or encrypted: :required for AES-256-GCM encryption at rest." (Tokens)
- Prefixes identify token types. "Use token prefixes to identify token types during debugging and code review." (Token prefixes)
- Default expiry for personal access tokens. "MAX_PERSONAL_ACCESS_TOKEN_LIFETIME_IN_DAYS (365) is the default expiration applied when no date is provided." (Tokens)

## Visuals worth redrawing

None.

## My notes

- The digest is a plain SHA-256, not a password hash. That works
  because the tokens are long and random; compare NIST's 112-bit rule
  for look-up secrets in nist-sp-800-63b.
