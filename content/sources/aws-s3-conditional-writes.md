---
id: aws-s3-conditional-writes
title: How to prevent object overwrites with conditional writes (Amazon S3 User Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html
kind: docs
primary: true
---

## Summary

How Amazon S3 supports HTTP conditional headers on writes: `If-None-Match:
*` to create an object only if the key is free, and `If-Match: <etag>` to
overwrite only the version you read. What each outcome returns (200,
412, 409, 404) and how concurrent writers and deletes are resolved.

## Key claims

- Conditional writes use the standard headers. "To conditionally write objects, add the HTTP If-None-Match or If-Match header." (intro)
- If-None-Match stops you overwriting an existing key. "The If-None-Match header prevents overwrites of existing data by validating that there's not an object with the same key name already in your bucket." (intro)
- If-Match compares ETags and fails on a mismatch. "If the ETag values don't match, the operation fails." (intro)
- Only `*` is accepted for If-None-Match. "The If-None-Match header expects the * (asterisk) value." (How to prevent object overwrites based on key names)
- Supported on PutObject, CompleteMultipartUpload and CopyObject. (both sections)
- An existing key under If-None-Match gives 412. "If there's an existing object, the write operation fails, resulting in a 412 Precondition Failed response." (Conditional write behavior)
- Among several conditional writes to one key, the first to finish wins. "If multiple conditional writes or copies occur for the same object name, the first write operation to finish succeeds." (Conditional write behavior)
- A concurrent delete can produce 409; PutObject can then be retried. "When using conditional writes with PutObject, uploads may be retried after receiving a 409 Conflict error." (Conditional write behavior)
- If-Match with a different ETag gives 412. "If the ETag doesn't match, the write operation fails with a 412 Precondition Failed response." (Conditional write behavior)
- In-progress multipart uploads don't count as existing objects. "Conditional writes do not consider any in-progress multipart uploads requests since those are not yet fully written objects." (Conditional write scenarios)
- Bucket owners can require conditional writes with a bucket policy. "Bucket owners can use bucket policies to enforce conditional writes for uploaded objects." (intro)

## Visuals worth redrawing

- The two-clients scenarios (multipart upload racing a conditional
  PutObject) at the end of the page.

## My notes

- Without the header, an upload to an existing key in an unversioned
  bucket just overwrites it. The page says so under "based on key names".
