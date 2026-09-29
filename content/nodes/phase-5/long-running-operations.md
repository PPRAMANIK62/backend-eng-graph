---
id: long-running-operations
title: Long-running operations
depth: short
phase: 5
note: >-
  Accept now, finish later: 202 with a status URL, or a callback.
needs: [api-design, idempotency-keys]
leads_to: []
compare_with: [webhooks, durable-execution]
---

# Long-running operations

Some requests take longer than a client should wait with a connection
open: exporting a big report, provisioning a machine, converting a
video. A long-running operation answers straight away with "accepted,
check here", does the work in the background, and gives the client a
status resource to poll until the work is done.

## Why not just wait

Load balancers time out long requests, and services don't want to
hold connections open for minutes. So big API guidelines set a limit. Azure's makes an operation
long-running if its 99th percentile response time is over 1 second.
Google's rule of thumb is 10 seconds. The numbers differ, but the test
is the same: longer than a client wants to sit and wait.

## The shape

Here's an export, start to finish:

![Sequence diagram between a client and an API. The client sends POST /reports:export. The API validates, records operation 81, and answers 202 Accepted with Operation-Location /operations/81. The export then runs in the background. The client sends GET /operations/81 and gets 200 with status Running and Retry-After 5. It waits 5 seconds, polls again, and gets 200 with status Succeeded and the result.](img/long-running-operations-polling.svg)

*Start, then poll. The status resource carries the outcome, because the first response can't.*

**202 Accepted.** This status means "accepted for processing, not
finished". It's noncommittal on purpose: the work might still fail, or
be refused when it actually runs. HTTP has no way to send a second
status code later for the same request, so the outcome has to live
somewhere the client can fetch it.

**The status resource.** That place is a separate resource for this
one operation, sometimes called a status monitor. The 202 points to
it, here in an `Operation-Location` header. It holds:

- a status: in Azure's version, NotStarted, Running, Succeeded,
  Failed or Canceled;
- the error, if it failed;
- the result, if it succeeded and there is one;
- in Google's version, a metadata field for progress while it runs.

Google compares this to a future or a promise in a programming
language: a handle you hold now for a value that arrives later.

**Retry-After while polling.** Each poll that finds the work unfinished
comes back with a `Retry-After` header saying how many seconds to wait
before asking again. The server controls the polling rate instead of
guessing clients.

## Errors in two places

A request can fail before the work starts or while it runs, and those
are reported differently.

- **Before starting**, return an ordinary error. Validate as much as
  you can up front, so a bad request fails in the first response
  instead of an hour later (see [[validation-at-boundary]]).
- **During the work**, the start request already got its 202. The
  failure goes into the status resource's error field, in the same
  format as your other errors (see [[error-design]]).

## When the start request is retried

The 202 can be lost like any response. If the client retries the
POST, a naive server starts a second export. Azure's answer is to let
the client name the operation with an `Operation-Id` header. A retry
with the same id and the same request gets the same answer back. The
same id with a different request gets 409 Conflict. That's an
[[idempotency-keys|idempotency key]] by another name.

## Polling or a callback

Polling is the simple choice. The client decides when to ask, and
anyone can watch: the client that started the operation, another
client, or a dashboard showing all of them.

The other choice is for the server to call the client when it's done.
That's a [[webhooks|webhook]], and it brings its own problems:
delivering reliably to an endpoint that might be down, and proving the
call really came from you.

## Where it gets tricky

**202 even when it's already done.** If the work finishes before the
first response goes out, Azure still returns 202 and a status
resource, so clients always follow the same path.

**The resource that isn't ready yet.** When an operation creates
something, Google lists it in normal reads straight away, with a state
field showing it can't be used yet.

**Two operations on one resource.** A server can queue them, reject
the second (Google uses ABORTED), or let the newest one replace the
running one. Pick one and document it.

**How long to keep results.** Status resources can't live forever.
Azure keeps them at least 24 hours after completion; Google's rule of
thumb for expiry is 30 days. Whatever you choose, publish it.

**The shape of the result is a contract.** Changing the result or
metadata type of an existing operation breaks clients, like changing
any other response (see [[schema-evolution]]).

**The API is the easy part.** The status resource only reports on
work that something else must do reliably, even if a worker crashes
halfway. That's the job of [[background-jobs]] or
[[durable-execution]].

## What this means when you build

- Validate first, then answer 202 with the URL of a status resource.
- Give the status resource explicit states, an error and a result, and
  send `Retry-After` while it's running.
- Accept a client-chosen operation id so retried starts don't run twice.
- Keep finished operations for a documented time.
- Use one shape for every long-running operation in your
  [[api-design|API]], so clients write the polling code once.

## Further reading

- [AIP-151: Long-running operations](https://google.aip.dev/151), Google. The Operation pattern: response and metadata types, errors, parallel operations and expiry.
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md), Microsoft. The Long-Running Operations section: 202, Operation-Location, Operation-Id, status monitor states and Retry-After.
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham, Reschke (editors), 2022. Section 15.3.3: what 202 Accepted promises and what it doesn't.
