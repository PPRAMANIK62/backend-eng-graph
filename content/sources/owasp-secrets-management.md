---
id: owasp-secrets-management
title: Secrets Management Cheat Sheet
author: OWASP Cheat Sheet Series
url: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's practical guide to handling secrets (API keys, database
passwords, certificates, SSH keys): centralize them, give each consumer
only what it needs, automate rotation, prefer dynamic secrets, audit
every access, and plan for leaks. Also covers where secrets should live
in CI/CD and containers, and envelope encryption at the cloud provider.

## Key claims

- The usual starting point is secrets scattered in code and config. "Many organizations have them hardcoded within the source code in plaintext, littered throughout configuration files and configuration management tools." (1 Introduction)
- Shared secrets hide where a leak came from. "Often, services share the same secrets, which makes identifying the source of compromise or leak challenging." (1 Introduction)
- Anyone who can read a secret is a path for it to leak, so apply least privilege. "When users can read and/or update the secret in a secret management system, it means that the secret can now leak through that user and the system they used to touch the secret." (2.3 Access Control)
- Dynamic secrets: credentials created per application start and expired afterwards. "Should the application's database credentials be stolen, upon reboot they would be expired." (2.4 Automate Secrets Management)
- Rotating an encryption key may mean re-encrypting data. "Rotating certain keys, such as encryption keys, might trigger full or partial data re-encryption." (2.4)
- Rotation limits how long a stolen secret works. "You should regularly rotate secrets so that any stolen credentials will only work for a short time." (2.7.2 Rotation)
- User passwords are the exception to scheduled rotation. "User credentials are excluded from regular rotation." (2.7.2)
- The lifecycle is creation, rotation, revocation, expiration. (2.7)
- Audit who requested which secret, whether it was approved, when it was used, expired, reused after expiry, updated. (2.6 Auditing)
- The secrets service is a dependency: if it's down you may not get the credentials to recover. "It could be impossible to retrieve the credentials required to restore the service if you did not previously acquire them." (2.9)
- Break-glass credentials kept in a secondary system and tested. (2.9)
- Prefer that the consumer fetches its own secret rather than CI/CD pushing it. "It is even better when the consumer of the secret retrieves the secret." (3.2.3)
- Secrets baked into images leak. "secrets themselves should never be hardcoded using docker ENV or docker ARG commands, as these can easily leak with the container definitions." (5.1)
- Environment variables are discouraged. "Additionally, environment variables are generally accessible to all processes and may be included in logs or system dumps." (5.1)
- If the orchestrator stores secrets (Kubernetes Secrets), make sure its storage backend is encrypted. (5.3)
- Don't store keys next to what they encrypt, unless those keys are encrypted too. "You should not store keys next to the secrets they encrypt, except if those keys are encrypted themselves (see envelope encryption)." (7.3)
- Dynamic secrets are usually made with a long-lived static secret. "To create these types of dynamic secrets, we usually require long-term static secrets to create the dynamic secrets themselves." (6.2)
- KMS API limits: you can DoS yourself; data key caching helps. "You could potentially (D)DoS yourself when you run into these limits." (4.4)
- On a leak: revoke, rotate, delete from the exposed place, and have the logs to know who used it. (9.2 Remediation)
- Rewriting git history to remove a secret is possible but breaks links to commits. (9.2)
- Secrets detection: pre-commit hooks, IDE checks, consistent secret formats are easier to detect. (8.1)
- Example stores. "such as facilities provided by a cloud provider (AWS Secrets Manager, Azure Key Vault, Google Secret Manager), or other third-party facilities (Hashicorp Vault, Conjur, Keeper)" (3.2.3)
- A workload proves who it is with its own identity, e.g. a Kubernetes service account. "The sidecar container authenticates with the secrets manager (e.g., using a Kubernetes Service Account)." (2.4.1, Example 1)
- Mounting secrets as a file, done by the orchestrator. "Ensure that these mounts are mounted in by the orchestrator and never built-in, as this will leak the secret with the container definition." (5.1)
- Audit at least who requested what and whether it was allowed. "Who requested a secret and for what system and role. Whether the secret request was approved or rejected." (2.6)
- Detect secrets before commit. "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR either in the IDE, as part of test-driven development, or via pre-commit hook." (8.1)

## Visuals worth redrawing

None. The lifecycle list (2.7) is simple enough to draw fresh.

## My notes

- The cheat sheet is broad; the vendor sections (4.1) name current
  products and will go stale. Use it for the principles.
- Dynamic secrets and leases are described concretely in the Vault docs
  (hashicorp-vault-leases).
