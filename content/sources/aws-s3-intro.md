---
id: aws-s3-intro
title: What is Amazon S3? (Amazon S3 User Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
kind: docs
primary: true
---

## Summary

The front page of the S3 user guide: buckets, objects, keys and
versions, and the "Amazon S3 data consistency model" section, which says
what S3 promises for reads after writes, what happens with concurrent
writers to one key, and that there are no atomic updates across keys.

## Key claims

- An object is found by bucket, key and optionally version; S3 is a map from those to the object. "So you can think of Amazon S3 as a basic data map between \"bucket + key + version\" and the object itself." (How Amazon S3 works, Keys)
- Objects are data plus metadata name-value pairs. "Objects consist of object data and metadata." (How Amazon S3 works, Objects)
- Metadata includes defaults, standard HTTP fields and your own. "These pairs include some default metadata, such as the date last modified, and standard HTTP metadata, such as Content-Type." (How Amazon S3 works, Objects)
- HEAD returns metadata and is strongly consistent. "object metadata (for example, the HEAD object) are strongly consistent." (Amazon S3 data consistency model)
- Reads after writes are strongly consistent in every Region, for new objects, overwrites and deletes. "Amazon S3 provides strong read-after-write consistency for PUT and DELETE requests of objects in your Amazon S3 bucket in all AWS Regions." (Amazon S3 data consistency model)
- A write to one key is atomic: a concurrent reader sees old or new, never a mix. "Updates to a single key are atomic." (Amazon S3 data consistency model)
- LIST is consistent too: a new object shows up in a listing right after the PUT returns. "A process writes a new object to Amazon S3 and immediately lists keys within its bucket. The new object appears in the list." (Amazon S3 data consistency model)
- No locking for concurrent writers; the latest timestamp wins. "If two PUT requests are simultaneously made to the same key, the request with the latest timestamp wins." (Amazon S3 data consistency model, Note)
- No atomic updates across keys. "There is no way to make atomic updates across keys." (Amazon S3 data consistency model, Note)
- Concurrent writes are resolved last-writer-wins, and the order S3 sees them in can't be predicted. "Amazon S3 internally uses last-writer-wins semantics to determine which write takes precedence." (Concurrent applications)
- Bucket configuration is eventually consistent. "Bucket configurations have an eventual consistency model." (Amazon S3 data consistency model)
- After enabling versioning, AWS recommends waiting 15 minutes before writing. "We recommend that you wait for 15 minutes after enabling versioning before issuing write operations (PUT or DELETE requests) on objects in the bucket." (Amazon S3 data consistency model)
- Directory buckets have real directories; general purpose buckets are flat. "Directory buckets organize objects into hierarchical directories (prefixes) instead of the flat storage structure of general purpose buckets." (Buckets, Directory buckets)
- S3 Express One Zone stores data in directory buckets. "data is stored in a new bucket type: an Amazon S3 directory bucket." (Features, Storage classes)
- S3 has several bucket types now: general purpose, directory, table and vector buckets. "Amazon S3 supports four types of buckets—general purpose buckets, directory buckets, table buckets, and vector buckets." (Buckets)
- The order S3 receives concurrent writes in can't be predicted, for example because of network latency. "the order in which applications receive acknowledgments cannot be predicted because of various factors, such as network latency." (Concurrent applications)
- One key's update can't be made to depend on another's. "you cannot make the update of one key dependent on the update of another key unless you design this functionality into your application." (Amazon S3 data consistency model, Note)
- After a delete, a GET returns nothing and a LIST no longer shows the object. "A process deletes an existing object and immediately lists keys within its bucket. The object does not appear in the listing." (Amazon S3 data consistency model)

## Visuals worth redrawing

- The three W1/W2/R1/R2 timelines under "Concurrent applications":
  writes that finish before a read, a write that overlaps a read, and two
  overlapping writes.

## My notes

- The page doesn't give a year for when strong consistency arrived. The
  Vogels post (vogels-s3-consistency-2021) describes the change.
