---
id: conditional-requests
title: Conditional requests
depth: short
phase: 5
note: >-
  If-Match and 412: stopping two clients from overwriting each other
  over HTTP.
needs: [http-caching]
leads_to: [object-storage]
compare_with: [optimistic-concurrency, lost-update, idempotency]
---

# Conditional requests

A conditional request carries a precondition in a header, and the
server runs the method only if the precondition is true. On a GET,
that's how a cache checks whether its copy is still good (see
[[http-caching]]). On a PUT, PATCH or DELETE, it's how two clients
editing the same thing avoid silently overwriting each other's work.

## Two clients, one document

Alice and Bob both open document 7. Each does a GET and gets the same
content back, with the header `ETag: "a1"`. The ETag
is a label the server chose for this exact version of the document.

Alice saves first. Her PUT carries `If-Match: "a1"`, which means "only
do this if the document is still at version a1". It is, so the server
writes it and answers 200 with a new ETag, `"b2"`.

Bob saves a minute later. His PUT also says `If-Match: "a1"`, because
that's the version he read. The document is now at b2, so the
precondition is false. The server must not perform the PUT. It answers
412 Precondition Failed and changes nothing.

![Sequence diagram with Alice, the server and Bob. Both GET /docs/7 and receive ETag "a1". Alice sends PUT with If-Match "a1"; the server sees a match, writes, and returns 200 with ETag "b2". Bob sends PUT with If-Match "a1"; the server sees the current tag is "b2", writes nothing, and returns 412 Precondition Failed. Bob then re-reads, merges and retries with If-Match "b2".](img/conditional-requests-lost-update.svg)

*Two writers, one precondition. The second writer finds out instead of silently winning.*

Without the header, Bob's PUT would simply replace Alice's version.
Nobody gets an error, and her edit is gone. That's the
[[lost-update|lost update]] problem. Bob's client should now GET the
document again, merge or show him the conflict, and retry with
`If-Match: "b2"`.

## The headers

- **`If-Match: "a1"`** runs the method only if the current ETag is in
  the list. It uses strong comparison: a weak tag (one starting with
  `W/`) never matches. `If-Match: *` means "only if the resource exists
  at all", so an update can't create something by accident.
- **`If-None-Match: *`** is the opposite: "only if nothing exists
  here". It stops two clients that both think they're creating a new
  resource from overwriting each other. On a write, a false result
  gives 412. On a GET, the same header is the cache's question and a
  false result gives 304.
- **`If-Unmodified-Since`** does the job of If-Match with a date, for
  servers that don't send ETags. It's ignored when If-Match is present.
  Dates have one-second resolution, so two updates in the same second
  look like one. ETags don't have that problem, which is why they're
  preferred.

The server checks preconditions after its normal checks and just
before it runs the method. Caches and proxies in between may ignore
If-Match.

## Choosing an ETag

The server picks the ETag. Two common choices are a version number
that goes up on every write, or a hash of the content. A
collision-resistant hash of the representation is enough to make a
strong validator.

The hash has an advantage when a response gets lost. Say Alice's PUT
succeeds but the 200 never reaches her, so she retries the same PUT
with `If-Match: "a1"`. The ETag has moved on, so a strict server
answers 412 and Alice sees a conflict with her own write. HTTP allows
the server to answer 2xx instead when the change looks like it was
already applied. A version number can't show that: all the server
knows is that the number moved. A hash of the content can, because
the retry's content hashes to the ETag the server now holds. That's
the reason Azure's API guidelines give for preferring a content hash
over a version number.

That 2xx shortcut has a cost: with several uncoordinated clients,
"already done" can hide a real conflict. Where every change matters,
a strict 412 is safer.

## The same idea in object storage

Amazon S3 supports both headers on PutObject, CopyObject and
CompleteMultipartUpload, with 412 when the check fails. When several
conditional writes race for one key, the first to finish wins and the
rest get 412. A bucket policy can require conditional writes, so
clients can't skip the check. That makes a bucket something you can
coordinate through, which comes up again in [[object-storage]].

## Where it gets tricky

**A server that ignores the header.** If-Match only helps if the
server checks it. One that just runs the PUT gives the client no
protection and no error.

**Weak ETags.** A tag starting with `W/` is fine for caching, but
If-Match never matches it, so every conditional write against it
fails. And one tag shared by the gzip and plain versions of a resource
is weak in meaning even without the prefix. Give each encoding its own
ETag.

**412 or 409.** 412 means "your precondition was false". 409 Conflict
means the request clashes with the current state in a way the user
may be able to fix. S3 uses 409 when a delete wins a race against a
conditional write.

**It's optimistic concurrency.** No lock is taken between Alice's GET
and her PUT. The ETag plays the part of the version column in
[[optimistic-concurrency]]: check at write time, and let the loser
retry.

## What this means when you build

- Return an ETag on every GET and every successful write, and make it
  strong.
- Compare the ETag and write in one atomic step (a single conditional
  UPDATE, or storage that supports conditional writes). A separate
  read-then-write in your handler has the same race you're trying to
  close.
- For resources several clients edit, reject writes that don't carry a
  precondition.
- On 412, the client re-reads, merges or asks the user, and retries
  with the new ETag. Never retry a 412 blindly with the old one.

## Further reading

- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham, Reschke (editors), 2022. Section 13 defines If-Match, If-None-Match and If-Unmodified-Since, the lost update problem, and the order preconditions are checked in.
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md), Microsoft. The Conditional Requests section: which status each outcome returns, and why a content hash beats a version number as an ETag.
- [How to prevent object overwrites with conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html), Amazon S3 User Guide. Conditional writes in S3, including what happens when writers and deletes race.
