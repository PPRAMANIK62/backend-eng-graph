---
id: cabforum-baseline-requirements
title: Baseline Requirements for the Issuance and Management of Publicly-Trusted TLS Server Certificates (version 2.3.0)
author: CA/Browser Forum
url: https://github.com/cabforum/servercert/blob/main/docs/BR.md
kind: spec
primary: true
---

## Summary

The rules every publicly trusted CA must follow to issue TLS server
certificates, agreed between CAs and browser makers. Read at version
2.3.0 (2026). Used for the certificate lifetime schedule from ballot
SC-081v3, revocation deadlines, and the change that made OCSP optional
and CRLs mandatory.

## Key claims

- The BRs only cover certificates for servers reachable on the internet. "These Requirements only address Certificates intended to be used for authenticating servers accessible through the Internet." (1.1)
- Maximum lifetime before 2026 is 398 days. "MUST NOT have a Validity Period greater than 398 days." (6.3.2)
- 200 days from 2026. "MUST NOT have a Validity Period greater than 200 days." (6.3.2)
- 100 days from 2027. "MUST NOT have a Validity Period greater than 100 days." (6.3.2)
- 47 days from 2029. "SHOULD NOT have a Validity Period greater than 46 days and MUST NOT have a Validity Period greater than 47 days." (6.3.2)
- Short-lived certificates: 7 days or less for certificates issued from 2026 (10 days before that). "a Subscriber Certificate with a Validity Period less than or equal to 7 days (604,800 seconds)." (1.6.1, Definitions)
- CAs don't have to support revoking short-lived certificates. "The CA MAY support revocation of Short-lived Subscriber Certificates." (4.9.1.1)
- Otherwise CAs must revoke within 24 hours for serious reasons. "With the exception of Short-lived Subscriber Certificates, the CA SHALL revoke a Certificate within 24 hours" (4.9.1.1)
- CRLs must be published over HTTP. "CRLs MUST be available via a publicly-accessible HTTP URL (i.e., \"published\")." (4.10.1)
- Ballot SC063 (2023) made OCSP optional and CRLs required. "Make OCSP optional, require CRLs, and incentivize automation" (1.2, revision table, version 2.0.1)

## Visuals worth redrawing

- The lifetime schedule as a step chart: 398, 200, 100, 47 days.

## My notes

- The schedule came from ballot SC-081v3 (2025, passed with all four
  browser makers voting yes). The ballot page only links the redline.
- Articles may not use calendar dates: say "from 2026", "from 2029".
