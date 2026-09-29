---
id: audit-logging
title: Audit logging
depth: short
phase: 15
note: >-
  An append-only record of who did what, that holds up later.
needs: [structured-logging, append-only-log, cryptographic-hashes]
leads_to: [tamper-evident-logs]
compare_with: []
---


# Audit logging

An audit log is a record of who did what to which thing, when, and
whether it worked. It's kept so that later, maybe months later, you
can reconstruct what happened and show that the record hasn't been
changed since. Debug logs help you fix the system; an audit log has to
stand up when someone asks what a particular user or admin did.

## What goes in an entry

An audit entry is a [[structured-logging|structured]] event, one per
action, with fields rather than a sentence. It has to answer when,
where, who and what:

```json
{
  "time": "…",
  "app": "billing-api v4.2",
  "actor": { "user_id": "u_812", "tenant_id": "t_acme", "ip": "…" },
  "action": "invoice.approve",
  "object": "invoice:42",
  "result": "denied",
  "reason": "not an approver for this department",
  "request_id": "…"
}
```

The application is the right place to write it. Only the app knows
the user, their roles, the object and what they meant to do; a
[[load-balancing|load balancer]] or database log sees much less. An ID that ties together all
the events from one request helps later.

Some events are always worth recording:

- Authorization failures (see [[authorization-models]]).
- Logins, successful and failed.
- Changes to users and permissions: adding or deleting users,
  granting or revoking roles or access.
- Anything an administrator does, and any use of a shared or
  break-glass account.
- Exports and access to sensitive data.

And some things shouldn't go in as they are: passwords, session IDs,
access tokens, keys, connection strings, payment card data. Mask, hash
or leave them out.

Keep the audit trail separate from general application logs. They're
collected for different purposes, and mixing them makes both harder to
use and protect.

## Making it hold up later

An audit log is only useful if nobody could have quietly edited it.
That means [[append-only-log|append-only]], restricted and
tamper-evident.

**Limit who can write and read.** Write audit events through a
separate account that can only insert, and restrict and review who can
read them. Access to the logs is itself worth logging.

**Make tampering detectable.** Chain the log with
[[cryptographic-hashes|hashes]] and signatures, so that changing,
deleting or reordering an entry breaks something anyone can check.
AWS CloudTrail does this with hourly signed digests of its log files;
[[tamper-evident-logs]] explains how such chains work and what they
can prove.

**Copy it somewhere else, early.** Store audit data on write-once or
read-only storage as soon as you can, and keep the digests apart from
the logs, with their own access rules.

## Where it gets tricky

**Turning on integrity checks doesn't check anything.** A chain of
hashes proves nothing until someone verifies it. CloudTrail says so
plainly: enabling validation only makes it deliver digests. Schedule
the check.

**Proving who did it is hard.** A log shows that an account did
something, and a signed chain shows the log wasn't changed. It's
still only as trustworthy as the system writing it, which is why
non-repudiation from logs is considered hard.

**Logging failures.** OWASP's advice is that a broken logging system
shouldn't stop the application, and that you should detect when
logging stops. For an audit trail, silently losing events is the
worse outcome, so alert on it.

**Retention cuts both ways.** Audit data must be kept as long as the
rules require, and not longer. Keeping it past that is a liability of
its own.

**Log injection.** User input inside a log line can forge fake
entries if it contains line breaks or delimiters. Structured fields
help; sanitize anything that ends up in a text format.

## Further reading

- [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), OWASP Cheat Sheet Series. What to log, the when/where/who/what fields, what never to log, and how to protect logs.
- [Validating CloudTrail log file integrity](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html), AWS CloudTrail User Guide. A real tamper-evident design: hashed log files, signed hourly digests, chained signatures.
