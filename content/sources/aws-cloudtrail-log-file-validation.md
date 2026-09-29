---
id: aws-cloudtrail-log-file-validation
title: "Validating CloudTrail log file integrity (AWS CloudTrail User Guide)"
author: Amazon Web Services
url: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html
kind: docs
primary: true
---

## Summary

How AWS CloudTrail, the audit log of API calls in an AWS account, lets
you prove its log files weren't changed or deleted: SHA-256 hashes of
each file, an hourly signed digest file listing them, and each digest
carrying the previous digest's signature.

## Key claims

- Algorithms. "This feature is built using industry standard algorithms: SHA-256 for hashing and SHA-256 with RSA for digital signing." (intro)
- What it lets you prove. "The CloudTrail log file integrity validation process also lets you know if a log file has been deleted or changed, or assert positively that no log files were delivered to your account during a given period of time." (Why use it?)
- Hourly digest of hashes. "Every hour, CloudTrail also creates and delivers a file that references the log files for the last hour and contains a hash of each. This file is called a digest file." (How it works)
- Digests are signed with a private key; you check with the public key. Different key pairs per Region. (How it works)
- Digests are chained. "Each digest file also contains the digital signature of the previous digest file if one exists." (How it works)
- Digests live in a separate folder so they can have separate access policies. (How it works)
- S3 MFA Delete can protect the digest files. "To enhance the security of the digest files stored in Amazon S3, you can use Amazon S3 MFA Delete." (Storing log and digest files)
- Turning it on doesn't check anything by itself. "Enabling log file integrity validation allows CloudTrail to deliver digest log files to your Amazon S3 bucket, but does not validate the integrity of the files." (Enabling validation and validating files)

## Visuals worth redrawing

- The chain: log files, hourly digest with their hashes, each digest signed and pointing at the previous digest's signature.

## My notes

- The chain proves order and completeness only if someone runs the
  validation and the signing key isn't held by whoever could rewrite
  the logs.
