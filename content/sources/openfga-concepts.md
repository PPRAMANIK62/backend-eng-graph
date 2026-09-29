---
id: openfga-concepts
title: "Concepts (OpenFGA documentation)"
author: OpenFGA authors
url: https://openfga.dev/docs/concepts
kind: docs
primary: true
---

## Summary

OpenFGA is an authorization engine whose API syntax follows the
Zanzibar paper. This page defines its vocabulary: types, authorization
models, relationship tuples, direct and implied relationships,
conditions, and the check request.

## Key claims

- A check asks whether a relationship exists between a user and an object. "The OpenFGA service answers authorization checks by determining whether a relationship exists between an object and a user." (intro)
- The API's JSON syntax follows the Zanzibar paper; there's also a simpler DSL. "A JSON syntax accepted by the OpenFGA API that closely follows the original syntax in the Zanzibar Paper." (What Is An Authorization Model?)
- A user can be a single user, an object, a userset like organization:org_ajUc9kJ#members, or everyone (`*`). (What Is A User?)
- A relationship tuple is user, relation, object, plus an optional condition. "A relationship tuple is a base tuple/triplet consisting of a user, relation, and object." (What Is A Relationship Tuple?)
- Conditions are boolean functions written in Google's Common Expression Language (CEL). "expressions are defined using Google's Common Expression Language (CEL)." (What is a Condition?)
- Implied relationships: with `define viewer: [user] or editor`, an editor tuple makes the user a viewer without a viewer tuple. (What Are Direct And Implied Relationships?)
- Store data can't be shared across stores. "Store data cannot be shared across stores; we recommended storing all data that may be related or affect your authorization result in a single store." (What Is A Store?)
- Check returns `{ "allowed": true }` or `{ "allowed": false }`. (What Is A Check Request?)
- A tuple can carry a condition that must evaluate true. "If a relationship tuple is conditioned, then that condition must to a truthy outcome for the relationship tuple to be permissible." (What Is A Conditional Relationship Tuple?)

## Visuals worth redrawing

None.

## My notes

- Conditions (CEL) are how OpenFGA mixes ABAC-style attributes into a
  ReBAC model. SpiceDB calls the same idea caveats.
