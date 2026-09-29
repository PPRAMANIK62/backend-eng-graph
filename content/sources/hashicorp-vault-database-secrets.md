---
id: hashicorp-vault-database-secrets
title: Database secrets engine (Vault documentation)
author: HashiCorp
url: https://developer.hashicorp.com/vault/docs/secrets/databases
kind: docs
primary: true
---

## Summary

How Vault issues database credentials: dynamic roles create a fresh
database user per request with a lease, static roles map to one
existing user whose password Vault rotates. Vault itself logs in to the
database as a dedicated "root" user to create and revoke the others.
Read from the Vault v2.x docs.

## Key claims

- Credentials are generated on request, so services don't hardcode them. "This means that services that need to access a database no longer need to hardcode credentials: they can request them from Vault, and use Vault's leasing mechanism to more easily roll keys." (overview)
- Unique credentials per service instance make auditing easier. "You can track it down to the specific instance of a service based on the SQL username." (overview)
- Users become invalid soon after the lease expires. "Vault makes use of its own internal revocation system to ensure that users become invalid within a reasonable time of the lease expiring." (overview)
- Vault needs its own privileged database user to create and revoke others. "This user will be used to manipulate dynamic and static users within the database." (Setup)
- Static roles: one existing database user, password rotated on a schedule by Vault. "With static roles, Vault stores and automatically rotates passwords for the associated database user based on a configurable period of time or rotation schedule." (Static roles)
- Rotating root credentials put in a static role breaks everything that depends on them. "any dynamic or static users managed by that database configuration will fail after rotation because the password for config/ is no longer valid." (Static roles)
- Reading `database/creds/<role>` returns a generated username and password with a lease ID, a lease duration and a renewable flag (example shows `lease_duration 1h`). (Usage)

## Visuals worth redrawing

None.

## My notes

- The 1h in the example is example output, not a default. Don't quote it
  as a default.
