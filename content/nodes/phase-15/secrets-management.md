---
id: secrets-management
title: Secrets management
depth: short
phase: 15
note: >-
  Vaults, KMS and rotating secrets.
needs: [configuration]
leads_to: [envelope-encryption]
compare_with: []
---

# Secrets management

A secret is anything that grants access: a database password, an
[[api-keys|API key]], a [[tls|TLS]] private key, a signing key. Secrets
management means keeping them out of code and ordinary config, giving
each program only the secrets it needs, and being able to change or
cancel any of them fast. It matters because a leaked secret is often
the whole breach: nobody has to break in when they can log in.

## Where secrets end up when nobody manages them

Take a service that needs a Postgres password. The quick ways to give it
one are the risky ones:

- **In the repository**, in a config file next to the code. Everyone
  with read access to the repo, and every clone and backup of it, now
  has the password.
- **In the [[container-images|container image]]**, through a Dockerfile `ENV` or `ARG`. The
  secret travels with the image definition to wherever the image goes.
- **In an environment variable** set by hand. Environment variables are
  visible to other processes and can end up in logs and crash dumps.

The other common habit is sharing: five services use the same database
login. When it leaks, you can't tell which one leaked it, and changing it
breaks all five at once. This is why secrets get their own handling,
separate from the rest of [[configuration]].

## A central store that decides who gets what

The usual fix is a secrets store: HashiCorp Vault, or the one your cloud
provider runs (AWS Secrets Manager, Google Secret Manager, Azure Key
Vault). It works like this:

1. The service proves who it is to the store, with its own identity,
   such as its [[kubernetes|Kubernetes]] service account.
2. The store checks a policy: this identity may read these secrets and
   no others.
3. The store returns the secret and writes an [[audit-logging|audit record]]: who asked,
   for what, whether it was allowed.

It's better when the service fetches its own secret at startup than
when a [[ci-cd|deploy pipeline]] pushes it in, because then the
pipeline doesn't need to hold production secrets at all. And whatever
key encrypts the stored secrets shouldn't sit next to them unless that
key is encrypted too, which is [[envelope-encryption]].

## Rotation, and secrets that expire on their own

Every secret goes through the same life: created, rotated, revoked when
it's no longer needed or has leaked, and expired. Rotating on a
schedule means a stolen secret only works for a while.

Dynamic secrets push this further. Instead of storing one database
password, the store creates a new database user for each service
instance when it asks, and revokes it later:

![Sequence between a service, Vault and Postgres. The service logs in to Vault with its own identity. Vault creates a new database user in Postgres and returns the username and password with a lease ID and a time to live. The service renews the lease before the time to live runs out. When the lease expires or is revoked, Vault revokes the user in Postgres and the password stops working.](img/secrets-management-dynamic-secret.svg)

*A dynamic database credential and its lease.*

In Vault every dynamic secret comes with a **lease**: a time to live
(TTL), after which Vault revokes it. The service has to renew the lease
or ask for a new secret, so it checks in regularly, which makes the audit
log more useful. Revoking means the credential is deleted where it
lives: with Vault's AWS engine, the access keys are removed from AWS.
Lease IDs start with the path the secret came from, so after an
intrusion you can revoke every secret under one path at once.

A stolen dynamic credential is only good until its lease ends. And
because every instance gets its own database username, a suspicious
query in the database log points to the one instance that ran it.

## Where it gets tricky

**The store is now a dependency.** If it's down, services that start
can't get their credentials, and neither can the people trying to fix
things. Keep emergency ("break-glass") credentials in a separate place,
and test that they still work.

**Dynamic secrets still need a static one.** To create database users,
the store itself logs in to the database as a privileged user of its
own. That credential needs the most protection and its own rotation
plan, and rotating it the wrong way breaks every user it created.

**Not everything has a lease.** Vault's key/value store, where you put
secrets that someone else issued, doesn't issue leases. Those secrets
don't expire on their own; you rotate them yourself.

**Renewal can come back shorter.** The time you ask for when renewing
is a request, not a promise. Read the TTL in the answer.

**Rotating an encryption key isn't like rotating a password.** Data
encrypted under the old key may need re-encrypting, which is part of why
[[envelope-encryption]] exists.

**User passwords are the exception.** Scheduled rotation is for
machine secrets. People's passwords should only change when there's a
sign they were compromised; see [[password-hashing]].

**A leak in git isn't fixed by deleting the commit.** Revoke and rotate
first. Rewriting history to remove it is possible, but it breaks every
link to the rewritten commits.

## What this means when you build

- Keep secrets out of the repo and the image. Fetch them at startup or
  have them mounted as a file by the orchestrator.
- Give each service its own identity and its own secrets, with a
  policy that allows only what it uses.
- Prefer short-lived, dynamic credentials. Renew them before the TTL
  runs out, and handle a renewal that gives you less.
- Automate rotation, and practice it before you need it after a leak.
- Log every secret read. Alert when a revoked or expired secret is
  still being used.
- Scan for secrets before they're committed, with a pre-commit hook
  or in your editor.

## Further reading

- [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), OWASP Cheat Sheet Series. The whole practice: where secrets leak, the lifecycle, auditing, CI/CD and containers, and what to do after a leak.
- [Lease, renew, and revoke](https://developer.hashicorp.com/vault/docs/concepts/lease), HashiCorp, Vault v2.x docs. How dynamic secrets expire, renew and get revoked, alone or by path.
- [Database secrets engine](https://developer.hashicorp.com/vault/docs/secrets/databases), HashiCorp, Vault v2.x docs. Dynamic and static database credentials in practice, and the privileged user Vault needs to make them.
