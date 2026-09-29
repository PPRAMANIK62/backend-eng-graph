---
id: ietf-rfc8725bis-draft
title: "JSON Web Token Best Current Practices (draft-ietf-oauth-rfc8725bis-10)"
author: Yaron Sheffer, Dick Hardt, Michael B. Jones, IETF OAuth working group
url: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-rfc8725bis-10
kind: spec
primary: true
---

## Summary

The update to RFC 8725. When read, draft 10 was in the RFC Editor queue.
It keeps the old threats and practices and adds attacks found since:
huge PBES2 iteration counts, blocklists bypassed with odd casing, JWE
decompression bombs, and confusion between the compact and JSON
serializations.

## Key claims

- It will obsolete RFC 8725. "This BCP specification furthermore obsoletes RFC 8725 to provide additional actionable guidance covering threats and attacks that have been discovered since RFC 8725 was published." (Abstract)
- A blocklist bypassed with "noNE". "The end result was that an attacker could change the "alg" value to "noNE" and bypass the security check." (2.11)
- Serialization confusion. "an attacker can craft a valid JSON JWS with a forged payload." (2.13)
- Restrict algorithms explicitly. "Libraries MUST provide a mechanism that enables developers to explicitly restrict the set of algorithms permitted for use and MUST NOT employ any algorithms outside this configured set when performing cryptographic operations." (3.1)
- Allowlists, not blocklists. "In particular, libraries should use allowlists for critical parameters such as "alg" instead of blocklists, because blocklists cannot anticipate every unsafe or misspelled value an attacker might use." (3.1)
- Claims are attacker input. "Treat claim values as being potentially attacker-provided input." (3.10)
- Reject anything that isn't base64url and dots. "Content with any other characters - especially braces and quotation marks - is not a JWT and MUST be rejected." (3.14)
- Cap PBES2 counts. "Rejecting inputs with a p2c (PBES2 Count) value larger than twice that figure is RECOMMENDED" (3.13)
- Huge PBES2 counts burn CPU. "Attackers can use a very large count, thereby imposing an unreasonable computational burden on recipients." (2.10)
- JWE decompression bombs. "an attacker can craft a malicious JWE with a highly compressed, arbitrarily large payload." (2.12)
- Status when re-opened: the datatracker page for draft-ietf-oauth-rfc8725bis showed IESG state "RFC Ed Queue" (document page, not the draft text).

## Visuals worth redrawing

None.

## My notes

- Once it has an RFC number, update this note and the url.
