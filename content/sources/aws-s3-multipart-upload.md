---
id: aws-s3-multipart-upload
title: Uploading and copying objects using multipart upload in Amazon S3 (Amazon S3 User Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html
kind: docs
primary: true
---

## Summary

How S3 multipart upload works: start an upload, send numbered parts in
any order and in parallel, then complete it, at which point S3 builds
the object. Unfinished uploads keep costing money, and the object isn't
there until the complete call.

## Key claims

- A big object goes up as parts, sent independently and in any order. "You can upload these object parts independently, and in any order." (intro)
- A failed part can be resent alone. "If transmission of any part fails, you can retransmit that part without affecting other parts." (intro)
- Use it from 100 MB up. "It's a best practice to use multipart upload for objects that are 100 MB or larger instead of uploading them in a single operation." (intro)
- Three steps: initiate, upload parts, complete. "Multipart upload is a three-step process: You initiate the upload, upload the object parts, and—after you've uploaded all the parts—complete the multipart upload." (Multipart upload process)
- Starting an upload returns an upload ID used by every later call. "Amazon S3 will then return a response with an upload ID, which is a unique identifier for your multipart upload." (Multipart upload initiation)
- Complete concatenates the parts by part number. "When you complete a multipart upload, Amazon S3 creates an object by concatenating the parts in ascending order based on the part number." (Multipart upload completion)
- Part numbers run from 1 to 10,000. "You can choose any part number between 1 and 10,000." (Parts upload)
- Parts cost money until you complete or stop the upload; there's no expiry. "After you initiate a multipart upload, there is no expiry; you must explicitly complete or stop the multipart upload." (intro, Pause and resume)
- Billing continues for parts. "Only *after* you complete or stop a multipart upload will Amazon S3 free up the parts storage and stop billing you for the parts storage." (Multipart upload process)
- Conditional writes work on CompleteMultipartUpload. "You can use conditional writes for [PutObject](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html) or [CompleteMultipartUpload](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html) requests." (Conditional writes)

## Visuals worth redrawing

None.

## My notes

- The companion limits page (qfacts) gives 48.8 TiB as the maximum
  object size and 5 MiB to 5 GiB per part; the upload page says 5 GB in
  a single PUT and "up to 50 TB" with multipart. Older sources (the
  Delta Lake paper, 2020) say 5 TB. Not cited separately.
