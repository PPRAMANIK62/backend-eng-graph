---
id: idempotency
title: Idempotency
depth: deep
phase: 5
note: >-
  Running an operation twice has the same effect as running it once. Why
  retries need it.
needs: [http-semantics]
leads_to: [idempotency-keys, retries-with-backoff, delivery-guarantees, idempotent-producers, transactional-outbox, background-jobs, backfills]
compare_with: [transactional-sinks, conditional-requests, leader-election, control-loops]
---

# Idempotency

An operation is idempotent if doing it twice has the same effect as
doing it once. It matters because a client that doesn't get an answer
can't tell whether its request did anything, and the only way forward
that doesn't lose work is to send it again. If the operation is
idempotent, sending it again is safe. If it isn't, a retry can charge a
card twice or create two of something.

## The call that failed after it worked

Take a client that sends `POST /charges` to a payments API, and never
gets an answer. Three different things could have happened:

![Three sequence diagrams between a client and a server. In the first, the request is lost before reaching the server, so nothing happened. In the second, the server starts the work and fails partway through, leaving it unclear what was done. In the third, the server finishes the work and sends a response that is lost on the way back. In all three the client sees the same thing: no response, then a timeout.](img/idempotency-three-failures.svg)

*Three failures that look the same to the client. Adapted from Brandur Leach, "Designing robust and predictable APIs with idempotency" (Stripe, 2017).*

1. **The request never arrived.** Nothing happened. Sending it again is
   what you want.
2. **The server failed partway through.** Some of the work may be done.
3. **The work finished and the response was lost.** The card was
   charged. Sending it again charges it twice.

From the client's side, all three look the same: a connection error or
a [[timeouts|timeout]]. A timeout tells you that you stopped waiting,
not that nothing happened. So the client has two bad choices. Give up,
and in case 1 the charge is lost. Retry, and in case 3 the customer pays
twice.

Idempotency removes the choice. If sending the request twice has the
same effect as sending it once, the client retries until it gets a clear
answer, and all three cases end in the same place: one charge.

## What idempotent means, exactly

HTTP's definition is precise. A method is idempotent if the *intended
effect on the server* of several identical requests is the same as the
effect of one. Two details in that sentence matter.

**It's about the effect, not the response.** Delete an order twice and
the second call may answer 404, because the order is already gone. The
state of the server is the same either way, so `DELETE` is still
idempotent. The response to a retry can differ from the first one.

**It's about what the client asked for.** "Intended effect" leaves out
side effects nobody requested. HTTP makes the same point about read-only
requests: a server that writes a log line for every `GET` is fine,
because the client didn't ask for the log line.

In [[http-semantics|HTTP]], `GET`, `HEAD`, `OPTIONS` and `TRACE` are
*safe*, meaning read-only in intent, and every safe method is also
idempotent. `PUT` and `DELETE` are idempotent without being safe: a
`PUT` replaces the resource with what you sent, and replacing it twice
with the same thing leaves the same result. `POST` isn't idempotent,
and neither is `PATCH`, which sends a set of changes to apply rather
than a new version.

These are promises your API makes by picking a method. A `PUT` handler
that appends a row every time it's called has broken the promise, and
the clients and proxies that trust it will duplicate your data.

## Why HTTP cares: automatic retries

The idempotent label exists so that software can retry for you. When a
connection fails before the response is read, a client may repeat an
idempotent request automatically. For non-idempotent requests the rules
are stricter: a client shouldn't retry them automatically unless it
knows the request is safe to repeat, and a proxy must never do so.

This happens in real libraries, not just the spec. Go's HTTP client
keeps connections in a [[connection-pooling|pool]], and a pooled
connection can die while it sits idle. Go retries after such a network
error only if the connection had already worked and the request is
idempotent: `GET`, `HEAD`, `OPTIONS`, `TRACE`, or any request that
carries an `Idempotency-Key` header.

## Four ways to make an operation idempotent

**Send the end state, not the change.** "Set the balance to 50" can be
repeated; "add 10" can't. A `PUT` that creates a DNS record with all
its fields is safe to send any number of times. If the record already
exists with those values, the server does nothing and answers success.

**Let the client name the thing.** A create request can't be repeated
safely, because each one makes a new object. It can if the client
includes a unique ID for the request. The server remembers the IDs it
has seen, and a second request with the same ID finds the first one's
result instead of creating a new object. EC2 calls this ID a
`ClientToken`; Stripe calls it an idempotency key. Guessing duplicates
from the request's contents doesn't work, because two identical requests
can be meant: a caller may really want two identical servers. This is a
big enough idea for its own article, [[idempotency-keys]].

**Record the ID and do the work in one transaction.** If the server
writes "seen this ID" in one step and does the work in another, a crash
between them breaks it. Either the ID is saved but the work never
happened, so retries are refused, or the work happened but the ID
wasn't saved, so a retry does it again. The two have to commit together,
as one atomic [[transaction]]. If all the work is local to one
database, the simplest idempotent request is exactly that: one
transaction that checks and writes.

**Make it conditional.** A `PATCH` can be made safe to repeat by sending
it with a condition, such as `If-Match` with the version you read. The
second copy finds the version already changed and fails instead of
applying the change twice. That's [[conditional-requests]].

## Calls you can't roll back

A database transaction can undo local changes. It can't undo a call to
another system. Once your handler has charged a card through a payment
provider, sent an email or written to a message broker, that happened,
whatever your database does next.

So an idempotent endpoint that calls other systems depends on those
calls being idempotent too. Some are by nature (setting a DNS record).
Some can be made so with a key of their own (a charge on Stripe). Some
can't, and then a timeout on that call leaves you not knowing whether
it happened. The safe thing is to mark the request failed rather than
guess, and keep a list of such requests for a person to look at.

## Where it gets tricky

**Same effect, different surprise.** Say a create request succeeds, the
response is lost, and the retry answers "already exists". The server
did nothing twice, so by the letter of the definition it's idempotent.
But the client asked to create something that, from its point of view,
didn't exist, and now it gets an error. It has to write code for a
case it didn't cause. Amazon's answer is to return a response that means
the same as the first one (the same instance, in its current state) for
every retry with the same request ID. The response isn't identical: a
retry a few minutes later shows the instance running instead of
pending.

**Retries that arrive late.** A retry can be delayed in the network and
arrive after someone else has already deleted what the first request
created. EC2 still answers with the original result, now showing the
instance as terminated, rather than creating it again. What's right
depends on the service; the point is to decide on purpose.

**"Exactly once" is the wrong name.** Stripe's post files idempotency
keys under "exactly once". What actually happens is that the client
sends the request at least once and the server makes the extra copies
harmless. That difference is the subject of [[delivery-guarantees]].

**Not every error deserves a retry.** A request that fails validation
will fail the same way every time. An idempotent API lets clients
retry everything *except* errors like that, and the API has to say
which is which.

**It has a price.** Remembering request IDs, storing results and making
the bookkeeping atomic is real work. For some operations a simpler
contract is the better trade.

## What this means when you build

- Assume every request your server gets may be a retry, and every call
  your code makes may need one.
- Use HTTP methods honestly: `GET` reads, `PUT` and `DELETE` must be
  safe to repeat, `POST` is where you need a request ID.
- Prefer operations that state the end result over ones that apply a
  change.
- Commit "I've handled this request" in the same transaction as the
  work.
- For every call to another system, know whether it's idempotent, and
  pass along a key when the other side supports one.
- Only then add [[retries-with-backoff|retries]]; retries without
  idempotency turn one failure into duplicate work.

## Further reading

- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. Section 9.2: the definitions of safe and idempotent methods, and the rules for automatic retries.
- [RFC 5789](https://www.rfc-editor.org/rfc/rfc5789), L. Dusseault, J. Snell, IETF, 2010. Why PATCH isn't idempotent, and how a conditional request makes it so.
- [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/), Malcolm Featonby, Amazon Builders' Library. Client request IDs, atomic bookkeeping, equivalent responses and late retries, with EC2 as the example.
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency), Brandur Leach, Stripe, 2017. The three ways a call can fail, and why idempotent endpoints let clients simply retry.
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys), Brandur Leach, 2017. Local transactions vs calls to other systems, and what to do when those calls aren't idempotent.
- [net/http](https://pkg.go.dev/net/http), The Go Authors, go1.27.1. Which requests Go's HTTP client retries on its own after a dropped connection.
