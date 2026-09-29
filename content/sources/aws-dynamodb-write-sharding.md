---
id: aws-dynamodb-write-sharding
title: Using write sharding to distribute workloads evenly in your DynamoDB table
author: Amazon Web Services
url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html
kind: docs
primary: true
---

## Summary

A DynamoDB Developer Guide best-practice page on spreading writes for a
hot partition key (their example is a date) by adding a suffix to the
key: random, or computed from another attribute. Reads then have to
ask every suffix and merge.

## Key claims

- The idea: expand the key space. "One way to better distribute writes across a partition key space in Amazon DynamoDB is to expand the space." (intro)
- Random suffix, their example 1 to 200 on a date key. "For example, for a partition key that represents today's date, you might choose a random number between 1 and 200 and concatenate it as a suffix to the date." (Sharding using random suffixes)
- Reading a whole day means one query per suffix and a merge. "Finally, your application would have to merge the results from all those Query requests." (Sharding using random suffixes)
- A random suffix makes single items hard to find. "But it's difficult to read a specific item because you don't know which suffix value was used when writing the item." (Sharding using calculated suffixes)
- A suffix computed from an attribute you query on (their example: the order ID) fixes that. "use a number that you can calculate based upon something that you want to query on." (Sharding using calculated suffixes)
- The goal. "The benefit is that you avoid having a single "hot" partition key value taking all of the workload." (Sharding using calculated suffixes)

## Visuals worth redrawing

None.

## My notes

- The page's example keys contain a calendar date; don't copy them.
