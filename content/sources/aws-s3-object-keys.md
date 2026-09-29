---
id: aws-s3-object-keys
title: Naming Amazon S3 objects (Amazon S3 User Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
kind: docs
primary: true
---

## Summary

How S3 object keys work: UTF-8 names up to 1,024 bytes, a flat
namespace with no real directories, and "folders" that the console and
SDKs fake with prefixes and a `/` delimiter.

## Key claims

- Keys are UTF-8, up to 1,024 bytes. "The object key name consists of a sequence of Unicode characters encoded in UTF-8, with a maximum length of 1,024 bytes or approximately 1,024 Latin characters." (Object key names)
- The data model is flat. "The Amazon S3 data model is a flat structure: You create a bucket, and the bucket stores objects." (Object key naming guidelines)
- There are no sub-folders. "There is no hierarchy of subbuckets or subfolders." (Object key naming guidelines)
- Folders are inferred from prefixes and a delimiter. "However, by using prefixes and delimiters in an object key name, the Amazon S3 console and the AWS SDKs can infer hierarchy and introduce the concept of folders." (Object key naming guidelines)
- A console folder is a zero-byte object. "The Amazon S3 console implements folder object creation by creating a zero-byte object with the folder prefix and delimiter value as the key." (Object key naming guidelines)

## Visuals worth redrawing

None.

## My notes

- Directory buckets (S3 Express One Zone) do have hierarchical
  directories; this page is about general purpose buckets.
