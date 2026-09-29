---
id: aws-s3-performance
title: Best practices design patterns, optimizing Amazon S3 performance (Amazon S3 User Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html
kind: docs
primary: true
---

## Summary

AWS's overview of S3 performance: request rates per prefix, scaling by
spreading work over prefixes, 503 Slow Down while S3 scales, typical
latency for small objects, and throughput per instance for data lakes.

## Key claims

- Request rate is per prefix: at least 3,500 writes or 5,500 reads per second. "For example, your application can achieve at least 3,500 PUT/COPY/POST/DELETE or 5,500 GET/HEAD requests per second per partitioned Amazon S3 prefix." (intro)
- No limit on prefixes; more prefixes, more throughput. "There are no limits to the number of prefixes in a bucket." (intro)
- Ten prefixes, ten times the reads. "For example, if you create 10 prefixes in an Amazon S3 bucket to parallelize reads, you could scale your read performance to 55,000 read requests per second." (intro)
- Scaling is gradual, with 503s along the way. "While Amazon S3 is scaling to your new higher request rate, you may see some 503 (Slow Down) errors." (intro)
- Small-object latency is around 100 to 200 ms. "These applications can achieve consistent small object latencies (and first-byte-out latencies for larger objects) of roughly 100–200 milliseconds." (intro)
- Data lake apps can use up to 100 Gb/s per instance. "These data lake applications achieve single-instance transfer rates that maximize the network interface use for their Amazon EC2 instance, which can be up to 100 Gb/s on a single instance." (intro)
- The 503s go away once scaling finishes. "These errors will dissipate when the scaling is complete." (intro)

## Visuals worth redrawing

None.

## My notes

- "Partitioned prefix" isn't defined here. The rate limit isn't per
  bucket, and S3 splits a busy prefix over time, which is where the 503s
  come from.
