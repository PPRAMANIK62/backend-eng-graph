---
id: hashicorp-vault-leases
title: Lease, renew, and revoke (Vault documentation)
author: HashiCorp
url: https://developer.hashicorp.com/vault/docs/concepts/lease
kind: docs
primary: true
---

## Summary

How HashiCorp Vault attaches a lease to every dynamic secret: a time to
live, renewal, and revocation, alone or by path prefix. Read from the
Vault v2.x docs.

## Key claims

- Every dynamic secret and service token gets a lease with a TTL. "With every dynamic secret and service type authentication token, Vault creates a lease: metadata containing information such as a time duration, renewability, and more." (first paragraph)
- After the lease expires, Vault can revoke the secret. "Once the lease is expired, Vault can automatically revoke the data, and the consumer of the secret can no longer be certain that it is valid." (first paragraph)
- Leases force consumers to check in, which makes audit logs useful and rolling keys easier. "This makes the Vault audit logs more valuable and also makes key rolling a lot easier." (second paragraph)
- Even long-valid data gets a lease. "Even if the data is meant to be valid for eternity, a lease is required to force the consumer to check in routinely." (third paragraph)
- Revoking a lease invalidates the secret at the source; with the AWS engine the keys are deleted from AWS. "For example, with the AWS secrets engine, the access keys will be deleted from AWS the moment a lease is revoked." (revocation paragraph)
- Revoking a token revokes all leases created with it. "When a token is revoked, Vault will revoke all leases that were created using that token." (revocation paragraph)
- The key/value store does not issue leases. "The Key Value Backend which stores arbitrary secrets does not issue leases" (note)
- A renewal increment is counted from now, and it's only advisory: the backend may give less. "The requested increment is completely advisory." (renewals)
- Lease IDs start with the path the secret came from, so a whole tree can be revoked at once, useful after an intrusion. "This lets you revoke trees of secrets." (prefix-based revocation)

## Visuals worth redrawing

None on the page.

## My notes

- The "static secrets in KV have no lease" note matters: only dynamic
  secrets get the automatic expiry.
