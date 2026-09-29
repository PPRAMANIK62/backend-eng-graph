---
id: object-storage
title: Object storage
depth: deep
phase: 16
note: >-
  S3's model: keys and objects, the consistency it promises, conditional
  writes, and the cost model.
needs: [http-semantics, conditional-requests]
leads_to: [open-table-formats, transactional-sinks]
compare_with: [filesystem]
---

# Object storage

An object store keeps whole blobs of bytes under string keys, grouped
into buckets, and you reach it over HTTP. Amazon S3 is the one everyone
copies, and it holds everything from [[backups]] to the [[parquet|Parquet]] files of a
data lake. It looks like a file system with slashes in the names, but
it isn't one, and building on it well means knowing exactly what it
promises about reads, writes and races, and what each request costs.

## A bucket is a map from keys to blobs

Say you upload a photo with `PUT /photos/puppy.jpg` to a bucket. S3
stores an **object**: the bytes, plus metadata as name-value pairs
(defaults like the last-modified time, standard HTTP ones like
`Content-Type`, and any you add). The object is found by its bucket and its **key**,
`photos/puppy.jpg`. Turn on versioning and each write also gets a
version ID, so an object is really named by bucket, key and version.
That's the whole data model: a map from those names to blobs.

The slash in the key means nothing to S3. A general purpose bucket is
flat, with no directories inside it. The console and the SDKs fake
folders by splitting keys on `/`, and a "folder" you create in the
console is just an empty object whose key ends in `/`. Keys are UTF-8
and can be up to 1,024 bytes long.

You talk to it with plain [[http-semantics|HTTP methods]]: PUT to
write, GET to read, HEAD for metadata, DELETE to remove, and LIST to
page through keys in order, starting from a key you give it. Three
things you'd expect from a [[filesystem]] aren't there:

- **No update in place.** To change an object you write the whole thing
  again. Reads can ask for a byte range, so reading part of a big
  object is cheap. Writing part of one generally isn't; at most some
  stores let you append.
- **No cheap rename.** Moving `a/x` to `b/x` means copying the object
  and deleting the old one. Renaming a "folder" means doing that for
  every key under it.
- **No [[transaction|transactions]] across keys.** Each key changes on its own.

Big objects go up with **multipart upload**. You start an upload and
get an ID, send numbered parts (1 to 10,000) in any order and in
parallel, resend any part that fails, and then call complete. S3 builds
the object from the parts in part-number order, and only then does the
object exist. AWS recommends it from about 100 MB up.

## What S3 promises when you read after a write

S3 gives **strong read-after-write consistency** for PUT and DELETE in
every AWS Region. Once your PUT returns success, any GET or LIST that
starts after that sees the new data. Delete an object and read it right
away, and it's gone; list right away, and it's not in the list.

Each key is also **atomic**. If one thread overwrites a key while
another reads it, the reader gets the old object or the new one, never
a mix of the two.

What it doesn't give you is any ordering between writers. S3 has no
locks. If two PUTs to the same key overlap, S3 keeps the one with the
latest timestamp, last writer wins, and you can't predict which that
is, because network delay decides the order S3 sees them in:

![Three timelines of two writes (W1 puts color=ruby, W2 puts color=garnet) and one or two reads. In the first, both writes finish before the reads start, and both reads return garnet. In the second, read R1 starts before W2 has finished, so it may return ruby or garnet, while R2, which starts after both writes finished, returns garnet. In the third, the two writes overlap, so S3 keeps whichever it received last, which the clients can't predict, and a read after both have finished shows which one won.](img/object-storage-concurrent-writes.svg)

*A read that starts after a write finished sees it; overlapping writes are settled by last-writer-wins. Adapted from Amazon Web Services, "Amazon S3 data consistency model", Amazon S3 User Guide.*

So a read-modify-write cycle on one key, run by two clients at once,
can silently drop one client's change. That's a [[lost-update]], the
same bug a database has without locking.

The guarantee also stops at the edge of one key. You can't make one
key's update depend on another's, and there's no way to update two
keys atomically. Bucket settings are a separate case: they're only
eventually consistent, and after turning on versioning AWS asks you to
wait 15 minutes before writing.

This wasn't always true. S3's metadata layer used a cache built to stay
available when parts of it failed, and in rare cases a write went
through one part of the cache while a read hit another, so a read could
return an older version. Customers built their own fixes: Netflix's
s3mper kept a consistent record of objects in DynamoDB, and the Hadoop
community built S3Guard for the same job. When Werner Vogels described
the change in 2021, S3 was strongly consistent for every request, at no
extra cost. The fix added a **witness** that hears about every write,
and a read checks with it whether the cached copy is stale. It was
checked with proofs and model checking, not only tests. The history
matters because older papers and blog posts still describe the
eventually consistent S3 (see [[eventual-consistency]]).

## Conditional writes make a bucket a place to coordinate

S3 supports the HTTP [[conditional-requests|precondition headers]] on
writes, and they're what makes it safe for several writers:

- **`If-None-Match: *`** writes only if the key doesn't exist yet. If
  it does, you get `412 Precondition Failed`. When several clients race
  to create the same key, the first to finish wins and the others get
  412. This is put-if-absent.
- **`If-Match: <etag>`** writes only if the object's current ETag is
  the one you read. Someone changed it in between, and you get 412.
  This is compare-and-swap, the object-storage form of
  [[optimistic-concurrency]].

Both work on PutObject, CopyObject and CompleteMultipartUpload. A
conditional PUT can also get `409 Conflict` if a delete raced it, and
can be retried. Bucket owners can use a policy to require conditional
writes, so no client can skip the check.

With put-if-absent you can build a commit on top of a bucket: write the
data objects under fresh random names, then create one small object
with a well-known name (the next version number, say) that points at
them. Whoever creates that object first has committed; everyone else
gets 412 and tries again with the next number. That's how
[[open-table-formats]] turn a pile of files into a table with atomic
commits.

## How fast it is, and where it slows down

S3's request limits are per **prefix**, the leading part of the key.
You can get at least 3,500 writes (PUT, COPY, POST, DELETE) or
5,500 reads (GET, HEAD) per second per prefix, and there's no limit on
the number of prefixes. Spread keys over ten prefixes and you can reach
ten times the reads. The scaling is gradual: while S3 scales up to a new, higher request
rate you may see some `503 Slow Down` errors, which go away once it's
done. Have your client [[retries-with-backoff|retry them with backoff]].

Each request is slow next to a local disk (see [[latency-numbers]]).
AWS puts small-object latency, and first-byte latency for large ones,
at roughly 100 to 200 ms. The Delta Lake paper (2020) gives a base cost
of 5 to 10 ms per read, after which a single read streams at roughly 50
to 100 MB/s. Either way, the lesson is the same: each request should
move a lot of bytes (several hundred kilobytes at least, megabytes to
get near full speed), and you get throughput by running many requests
in parallel. Data lake jobs on a single EC2 instance can reach up to
100 Gb/s this way.

LIST is the slow part. It returns at most 1,000 keys per call, and
each call takes tens to hundreds of milliseconds, so listing millions
of objects one page at a time takes minutes. Systems that need to know
"which objects make up this dataset" quickly keep that list somewhere
else rather than asking LIST every time.

## The bill has several lines

S3 pricing is pay-per-use, and the bill is split into parts. The ones
that matter most when you design:

- **Storage**, charged by how much you store, for how long in the
  month, and in which storage class.
- **Requests**, charged per request and by type. LIST is charged at
  the PUT rate. DELETE is free. In AWS's worked example for S3 Tables
  in US West (Oregon), when this was written, PUTs cost $0.005 per
  1,000 and GETs $0.0004 per 1,000, so a write cost 12.5 times a read.
- **Data transfer.** Uploads from the internet are free, and so is
  traffic to other AWS services in the same Region. Downloads to the
  internet are charged.
- **Minimums in the cheaper classes.** Standard-IA and One Zone-IA bill
  any object smaller than 128 KB as 128 KB, and charge for at least 30
  days of storage even if you delete sooner.

Two consequences. Millions of tiny objects cost you in requests, and
in the IA classes, in minimum sizes too. And an abandoned multipart
upload keeps its parts, and keeps being billed for them, until you
complete or stop it; there's no expiry.

## Where it gets tricky

**Folders aren't real, so neither is a folder rename.** Because the
namespace is flat and there's no atomic multi-key update, "renaming a
directory" is a copy and a delete for every object under it. A reader
in the middle sees some objects moved and some not, and a crash leaves
it half done. Tools built for file systems, which assume rename is
atomic (see [[atomic-rename]]), break on this. Directory buckets are the
exception: they organize objects into real
directories, and S3 Express One Zone, the class that uses them, is the
only one with a rename call.

**Strong consistency isn't concurrency control.** A read after a write
sees that write, but two clients updating the same key still overwrite
each other without an error. You need `If-Match` for that.

**Old sources describe a different S3.** The Delta Lake paper (2020)
says S3 LIST was eventually consistent and S3 had no put-if-absent.
Both have changed for S3: LIST is now strongly consistent, and
`If-None-Match: *` is put-if-absent. Other object stores, and
S3-compatible servers, document their own guarantees, so check them
rather than assuming S3's.

**The latency numbers don't agree.** 5 to 10 ms of base latency per
read and "roughly 100 to 200 ms" for small objects come from different
sources, measured differently, years apart. Neither is a spec. Measure
the store you actually use, from where you actually run.

## What this means when you build

- Treat objects as write-once. Write new keys instead of overwriting,
  and use `If-None-Match: *` to make "create" really mean create.
- When you must update a key that others update too, read its ETag and
  write with `If-Match`, and retry on 412.
- Don't expect atomicity across keys. Write the data objects first,
  then publish them with one conditional write to a single pointer or
  manifest object.
- Keep LIST out of hot paths. Keep your own index of what's in a
  dataset.
- Size objects for the store: not tiny (request cost and per-request
  latency dominate), and use multipart upload for big ones. Clean up
  uploads you abandon.
- Spread busy keys over prefixes, and retry 503s with backoff.

## Further reading

- [What is Amazon S3?](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html), Amazon Web Services. The data model, and the "data consistency model" section with the concurrent-writer timelines.
- [Naming Amazon S3 objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html), Amazon Web Services. Keys, the flat namespace and how folders are faked.
- [How to prevent object overwrites with conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html), Amazon Web Services. `If-None-Match` and `If-Match` on S3, and what each race returns.
- [Uploading and copying objects using multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html), Amazon Web Services. How multipart upload works and how unfinished uploads are billed.
- [Best practices design patterns: optimizing Amazon S3 performance](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html), Amazon Web Services. Request rates per prefix, 503 Slow Down, latency and throughput.
- [Amazon S3 Pricing](https://aws.amazon.com/s3/pricing/), Amazon Web Services. The parts of the bill, what's free, and the minimums in each storage class.
- [Diving Deep on S3 Consistency](https://www.allthingsdistributed.com/2021/04/s3-strong-consistency.html), Werner Vogels, 2021. Why S3 used to be eventually consistent and how it became strongly consistent.
- [Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores](https://www.vldb.org/pvldb/vol13/p3411-armbrust.pdf), Michael Armbrust and others, VLDB 2020. Section 2 is a clear account of object store APIs and performance, from people who built a table format on them.
