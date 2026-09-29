---
id: google-beyondprod
title: BeyondProd
author: Google Cloud
url: https://cloud.google.com/docs/security/beyondprod
kind: docs
primary: true
---

## Summary

Google's description (2024 version of the paper) of how it applies zero
trust between its own production services: no inherent trust between
services, mutual authentication with service identities (ALTS),
end-user context tickets forwarded along call chains, deploy-time code
provenance checks (Binary Authorization for Borg), and host integrity.

## Key claims

- BeyondProd is the service-side counterpart of BeyondCorp (now Chrome Enterprise Premium): service trust comes from provenance, hardware and identity, not location. "BeyondProd states that service trust should depend on characteristics like code provenance, trusted hardware, and service identity" (Introduction)
- No inherent trust between services; only authenticated and authorized callers get in, which limits blast radius. "Only authenticated, trusted, and specifically authorized callers or services can access any other service." (BeyondProd benefits)
- An edge perimeter is still kept, for DoS protection. "Although a perimeter approach is not a new concept, it remains a security best practice for cloud architectures." (BeyondProd benefits)
- ALTS does mutual authentication and encryption between services, with identities bound to services, not hosts. "In general, identities are bound to services instead of to a specific server name or host." (ALTS section)
- Binding identity to the service lets it move between hosts. "This binding helps seamless microservice replication, load balancing, and rescheduling across hosts." (ALTS section)
- End-user context tickets are integrity-protected credentials that services forward. "These tickets are integrity-protected, centrally-issued, forwardable credentials that attest to the identity of an end user who made a request of the service." (Service access management section)
- Binary Authorization for Borg checks code provenance at deploy time: second-engineer review and binaries built on dedicated infrastructure. "BAB is a deploy-time enforcement check that helps ensure that code meets internal security requirements before the code is deployed." (BAB section)
- End-user context tickets carry the user's identity separately from the service's. "These tickets reduce the need for trust between services, as peer identities using ALTS can be insufficient to grant access" (Service access management section)
- Worked example: GFE terminates TLS, forwards over ALTS; frontend gets a short-lived EUC ticket; backend checks the caller's certificate, that the caller may call it, the ticket, and that the user may see the data. "If any of these checks fail, the request is denied." (Accessing user data)
- Every hop checks. "In many cases, there is a chain of backend calls and every intermediary service does a service access check on inbound RPCs, and the ticket is forwarded on outbound RPCs." (Accessing user data)
- The edge perimeter is kept against DoS. "A perimeter approach helps protect as much infrastructure as possible against unauthorized traffic and potential attacks from the internet, such as volume-based DoS attacks." (BeyondProd benefits)
- A service mesh provides service-to-service security as shared infrastructure. "A service mesh allows for service-to-service communication, which can control traffic, apply policies, and provide centralized monitoring for service calls." (Service mesh)

## Visuals worth redrawing

- "Google's cloud-native security controls accessing user data"
  (Accessing user data): user, GFE, frontend, EUA service, backend.

## My notes

- The page states it describes the status quo when it was written and
  may change.
