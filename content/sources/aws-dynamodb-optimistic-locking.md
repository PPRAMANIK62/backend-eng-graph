---
id: aws-dynamodb-optimistic-locking
title: DynamoDB and optimistic locking with version number
author: Amazon Web Services
url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBMapper.OptimisticLocking.html
kind: docs
primary: true
---

## Summary

The DynamoDB developer guide page on optimistic locking with a version
attribute, as done by the Java SDK's DynamoDBMapper on top of
DynamoDB's conditional writes. A clear, small, real example of version
checks at write time.

## Key claims

- What it protects. "If you use this strategy, your database writes are protected from being overwritten by the writes of others, and vice versa." (intro)
- One attribute acts as a version number. "With optimistic locking, each item has an attribute that acts as a version number." (intro)
- Update only if the server's version hasn't changed. "You can update the item, but only if the version number on the server side has not changed." (intro)
- A mismatch means someone else wrote first. "If there is a version mismatch, it means that someone else has modified the item before you did." (intro)
- The mapper increments the version on every save. "The DynamoDBMapper assigns a version number when you first save the object, and it automatically increments the version number each time you update the item." (intro)
- On a mismatch, re-read and retry. "If this happens, try again by retrieving the item and then trying to update it." (intro)
- A failed check raises an exception. "You use optimistic locking with @DynamoDBVersionAttribute and the version value on the server is different from the value on the client side." (ConditionalCheckFailedException list)
- Built on conditional writes. "The internal implementation of optimistic locking within DynamoDBMapper uses conditional update and conditional delete support provided by DynamoDB." (delete)
- Doesn't work with multi-region last-writer-wins. "If you use global tables, last writer policy wins. So in this case, the locking strategy does not work as expected." (Note)
- It can be switched off per request (SaveBehavior.CLOBBER). "To disable optimistic locking, you can change the DynamoDBMapperConfig.SaveBehavior enumeration value from UPDATE to CLOBBER." (Disabling optimistic locking)

## Visuals worth redrawing

None.

## My notes

- None.
