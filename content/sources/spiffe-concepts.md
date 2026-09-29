---
id: spiffe-concepts
title: SPIFFE Concepts
author: SPIFFE project (CNCF)
url: https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/
kind: docs
primary: true
---

## Summary

The SPIFFE project's overview of workload identity: every service gets
an ID (a URI), and an identity document (SVID), usually a short-lived
X.509 certificate used for mutual TLS. Keys and trust bundles are
handed out and rotated automatically by the Workload API.

## Key claims

- A SPIFFE ID is a URI naming a workload. "For example, spiffe://acme.com/billing/payments is a valid SPIFFE ID." (SPIFFE ID)
- A trust domain is a trust root, and workloads in it are verified against its root keys. "All workloads identified in the same trust domain are issued identity documents that can be verified against the root keys of the trust domain." (Trust Domain)
- Keep different environments in separate trust domains. "such as a staging or lab environment compared to a production environment) in distinct trust domains." (Trust Domain)
- An SVID is the document a workload proves its identity with. "An SVID is the document with which a workload proves its identity to a resource or caller." (SVID)
- X.509 SVIDs are preferred to JWTs because tokens can be replayed. "As tokens are susceptible to replay attacks, in which an attacker that obtains the token in transit can use it to impersonate a workload, it is advised to use X.509-SVIDs whenever possible." (SVID)
- JWTs may be needed when an L7 proxy sits between services. "when your architecture has an L7 proxy or load balancer between two workloads." (SVID)
- Short lifetimes are there to limit a leaked key. "In order to minimize exposure from a key being leaked or compromised, all private keys (and corresponding certificates) are short lived, rotated frequently and automatically." (Workload API)
- Keys and certificates are short-lived and rotated automatically. "all private keys (and corresponding certificates) are short lived, rotated frequently and automatically." (Workload API)
- An X.509-SVID comes with a private key tied to the ID. "A private key tied to that ID that can be used to sign data on behalf of the workload." (Workload API)
- Workloads fetch new keys before the old ones expire. "Workloads can request new keys and trust bundles from the Workload API before the corresponding key(s) expire." (Workload API)
- A trust bundle is the set of CA roots a workload trusts. "A trust bundle is a collection of one or more certificate authority (CA) root certificates that the workload should consider trustworthy." (Trust Bundle)

## Visuals worth redrawing

- Two workloads each holding an X.509-SVID and a trust bundle, verifying
  each other.

## My notes

- SPIRE is the reference implementation; not opened.
