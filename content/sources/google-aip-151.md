---
id: google-aip-151
title: "AIP-151: Long-running operations"
author: Google (API Improvement Proposals)
url: https://google.aip.dev/151
kind: docs
primary: true
---

## Summary

Google's API design rule for methods that take a long time. The method
returns an `Operation` object right away instead of the final result;
the client polls it (through a standard Operations service) until it's
done, then reads the response or the error from it. Covers metadata for
progress, parallel operations, expiry and errors. Read as the approved
AIP when this was written.

## Key claims

- Blocking on a long task is a poor experience; return something to check back on. "it is often a poor user experience to simply block while the task runs; rather, it is better to return some kind of promise to the user and allow the user to check back in later." (intro)
- It works like a future or a promise. "The long-running operations pattern is roughly analogous to a Python Future, or a Node.js Promise." (intro)
- The client gets a token to track progress and fetch the result. "Essentially, the user is given a token that can be used to track progress and retrieve the result." (intro)
- Long methods return an Operation instead of the response. "should return a google.longrunning.Operation object instead of the ultimate response message." (Guidance)
- Each method declares a response type and a metadata type; metadata carries progress. "The metadata type is used to provide information such as progress, partial failures, and similar information on each GetOperation call." (Guidance)
- APIs must use the shared Operations service, not invent their own. "Individual APIs must not define their own interfaces for long-running operations to avoid non-uniformity." (Guidance)
- Rule of thumb for "long": 10 seconds. "A good rule of thumb is 10 seconds." (Guidance, note)
- A resource being created shows up in List and Get, marked not usable. "the resource should indicate that it is not usable, generally with a state enum." (Standard methods)
- Resources can queue parallel operations, reject them with ABORTED, or let the newest preempt the old. "must return ABORTED if a user attempts a parallel operation" (Parallel operations)
- Finished operations may expire; rule of thumb 30 days. "A good rule of thumb for operation expiry is 30 days." (Expiration)
- Errors before starting are ordinary errors; failures during the run go in the operation. "Operations that fail during their execution phase must return an error response (AIP-193), placed in the Operation.error google.rpc.Status field." (Errors)
- Changing the response or metadata type later is breaking. "Changing either the response_type or metadata_type of a long-running operation is a breaking change." (Backwards compatibility)

## Visuals worth redrawing

None.

## My notes

- RPC-first: no HTTP status code for starting the operation is
  discussed. Compare `microsoft-azure-api-guidelines`, which uses 202
  and an `operation-location` header.
