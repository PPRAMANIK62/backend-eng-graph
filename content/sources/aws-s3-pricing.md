---
id: aws-s3-pricing
title: Amazon S3 Pricing
author: Amazon Web Services
url: https://aws.amazon.com/s3/pricing/
kind: docs
primary: true
---

## Summary

The S3 pricing page. The price tables load by script and weren't in the
page text, so this note keeps the shape of the bill: what you pay for,
what's free, and the minimum sizes and durations in the cheaper storage
classes. The only concrete prices kept are from the S3 Tables worked
example.

## Key claims

- The bill has several parts. "Amazon S3 cost components are storage pricing, request and data retrieval pricing, data transfer and transfer acceleration pricing, data management and insights feature pricing, replication pricing, and transform and query feature pricing." (intro)
- Pay per use, no minimum. "Pay only for what you use. There is no minimum charge." (intro)
- Storage is charged by size, time and storage class. "The rate you’re charged depends on your objects' size, how long you stored the objects during the month, and the storage class" (Storage pricing)
- Requests are charged per request, by type. "S3 request costs are based on the request type, and are charged on the quantity of requests as listed in the table below." (Requests & data retrievals)
- LIST costs the same as PUT; DELETE is free. "LIST requests for any storage class are charged at the same rate as S3 Standard PUT, COPY, and POST requests. DELETE and CANCEL requests are free." (Requests & data retrievals)
- Infrequent-access classes bill small objects as 128 KB and keep a 30-day minimum. "S3 Standard-IA and S3 One Zone-IA storage have a minimum billable object size of 128 KB." (Storage pricing, footnote)
- IA classes have a 30-day minimum. "S3 Standard-IA and S3 One Zone-IA storage are charged for a minimum storage duration of 30 days" (Storage pricing, footnote)
- Upload from the internet is one of the free transfers. "Data transferred in from the internet." (Data transfer, exceptions)
- Transfer in from the internet is free, and so is transfer to other AWS services in the same Region; transfer out to the internet is paid. "Data transferred from an Amazon S3 bucket to any AWS service(s) within the same AWS Region as the S3 bucket (including to a different account in the same AWS Region)." (Data transfer, list of exceptions to "You pay for all bandwidth into and out of Amazon S3")
- Only S3 Express One Zone has a rename call. "S3 Express One Zone is the only storage class that supports the RenameObject API" (Requests & data retrievals, footnote)
- Worked example for S3 Tables in US West (Oregon): PUTs at $0.005 per 1,000 and GETs at $0.0004 per 1,000. "S3 Tables - Standard PUT request price is $0.005 per 1,000 requests" (Pricing examples, S3 Tables)
- Same example, GET price. "S3 Tables - Standard GET request price is $0.0004 per 1,000 requests" (Pricing examples, S3 Tables)
- The S3 Tables worked example is priced in US West (Oregon). "This example uses the US-West (Oregon) AWS Region." (Pricing examples, S3 Tables)

## Visuals worth redrawing

None.

## My notes

- The S3 Standard price table didn't come through as text, so no
  storage or request price for plain S3 Standard is in this note. The
  S3 Tables example numbers are for S3 Tables, not general purpose
  buckets.
- Prices differ by Region and change; pin any number to "when this was
  written".
