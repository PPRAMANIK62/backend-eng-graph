---
id: microsoft-azure-api-guidelines
title: Microsoft Azure REST API Guidelines
author: Microsoft (Azure HTTP/REST API Stewardship Board)
url: https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md
kind: docs
primary: true
---

## Summary

The rules Azure service teams must follow for data-plane HTTP APIs, as
a list of DO, SHOULD and DO NOT items: URL shapes, methods, field
mutability, actions, collections and paging, versioning with a
required `api-version` query parameter, long-running operations and
conditional requests. Read from the vNext branch when this was written.

## Key claims

- Two goals for a versionable API contract: never break workloads, and let customers adopt a version without code changes. "Customer workloads must never break due to a service change" (Introduction)
- Model state, not behavior. "Note, it's important to model resource state, not behavior." (REST)
- Use the same JSON schema across PUT, PATCH, GET and POST on one path. "DO use the same JSON schema for PUT request/response, PATCH response, GET response, and POST request/response on a given URL path." (Resource Schema & Field Mutability)
- Required fields can only appear in version 1. "required fields can only be introduced in the 1st version of a service; it is a breaking change to introduce required fields in a later version." (Resource Schema & Field Mutability)
- PATCH with JSON Merge Patch to create and update; PUT for create-or-replace; DELETE to remove. "DO create and update resources using PATCH [RFC 5789] with JSON Merge Patch" (Resource Schema & Field Mutability)
- Reject fields the service version doesn't understand. "DO fail an operation with `400-Bad Request` if the request is improperly-formed or if any JSON field name or value is not fully understood by the specific version of the service." (Resource Schema & Field Mutability)
- Actions use a colon and POST. "https://.../users/Bob:grant?access=read" (Performing an Action)
- Don't use an action for something CRUD could express. "DO NOT use an action operation when the operation behavior could reasonably be defined as one of the standard REST Create, Read, Update, Delete, or List operations." (Performing an Action)
- Adding paging later is breaking. "NOTE: It is a breaking change to add paging in the future" (Collections)
- Tell clients that items can be skipped or duplicated across pages. "DO clearly document that resources may be skipped or duplicated across pages of a paginated collection unless the operation has made special provisions to prevent this" (Collections)
- Return a `nextLink` URL, and leave it out on the last page. "DO return a `nextLink` field with an absolute URL that the client can GET in order to retrieve the next page of the collection." (Collections)
- Avoid a total count, which can be expensive. "YOU SHOULD NOT return a `count` of all objects in the collection as this may be expensive to compute." (Collections)
- Every request carries a required `api-version` query parameter. "DO use a required query parameter named `api-version` on every operation for the client to specify the API version." (API Versioning)
- Versions are dates, with `-preview` for previews. "DO use `YYYY-MM-DD` date values, with a `-preview` suffix for preview versions, as the valid values for `api-version`." (API Versioning)
- No version in the path. "DO NOT include a version number segment in any operation path." (API Versioning)
- No breaking changes at all. "DO NOT introduce any breaking changes into the service." (API Versioning)
- Old previews can be retired after at least 90 days. "the service team may completely retire any previous preview versions after giving customers at least 90 days to upgrade their code" (API Versioning)
- Removing an enum value breaks clients; extensible enums let you add values. "YOU SHOULD use extensible enums unless you are positive that the symbol set will **NEVER** change over time." (Use Extensible Enums)

Added for `error-design`, `long-running-operations` and `conditional-requests`:

Errors (Handling Errors):

- Two kinds of errors: ones code should recover from at runtime, and bugs the caller must fix. "An error indicating a bug in customer code that is unlikely to be recoverable at runtime; the customer must just fix their code" (Handling Errors)
- The error code string is part of the contract and can't change. "`x-ms-error-code` values are part of your API contract (because customer code is likely to do comparisons against them) and cannot change in the future." (Handling Errors)
- Adding codes is fine; giving the same condition a different code is breaking. "it's only a breaking change if the same conditions result in a different top-level error code." (Handling Errors)
- New top-level codes need a new API version. "YOU SHOULD NOT add new top-level error codes to an existing API without bumping the service version." (Handling Errors)
- Unique codes for recoverable errors, shared ones for usage errors. "DO carefully craft unique `x-ms-error-code` string values for errors that are recoverable at runtime." (Handling Errors)
- Body shape: `{"error": {"code", "message", "target", "details", "innererror"}}`, with `code` required and equal to the header. (Handling Errors, ErrorResponse table)
- Only the top-level code is contract; other fields can change. "they are not considered part of your service's API contract and customers should not take a dependency on them or their value." (Handling Errors)
- Put data values in extra properties so nobody parses the message, e.g. `"maximumKeys": 16` next to the message "A maximum of 16 keys are allowed per account." (Handling Errors)
- Back off on Retry-After, not on message text. "the error message can give details about why you've been throttled, but the `Retry-After` should be what developers rely on to back off" (Handling Errors, note)

Long-running operations (Long-Running Operations & Jobs):

- Why LROs exist: long-lived connections and load-balancer timeouts. "due to services not wanting to maintain long-lived connections (>1 seconds) and load-balancer timeouts, the operation must execute asynchronously." (Long-Running Operations & Jobs)
- The client starts the work, then polls. "the client initiates the operation on the service, and then the client repeatedly polls the service (via another API call) to track the operation's progress/completion." (Long-Running Operations & Jobs)
- Many clients can poll one operation. "LROs are always started by 1 logical client and may be polled (have their status checked) by the same client, another client, or even multiple clients/browsers." (Long-Running Operations & Jobs)
- Threshold: p99 above 1 second. "DO implement an operation as an LRO if the 99th percentile response time is greater than 1 second" (Long-Running Operations & Jobs)
- Validate up front. "DO perform as much validation as practical when initiating an LRO operation to alert clients of errors early." (Patterns to Initiate a Long-Running Operation)
- Return the status monitor's URL in a header. "DO include an `operation-location` response header with the absolute URL of the status monitor for the operation." (Patterns to Initiate a Long-Running Operation)
- The client may name the operation with `Operation-Id`; reusing an id with a different request is a conflict. "DO fail a request with a `409-Conflict` if the `Operation-Id` header matches an existing operation unless the request is identical to the prior request (a retry scenario)." (LRO action on a resource pattern)
- Return 202 even if the work already finished. "return `202-Accepted` and a status monitor even if processing was completed before the initiating request returns." (DELETE LRO pattern)
- Status monitor fields: id, kind, status ("NotStarted", "Running", "Succeeded", "Failed", "Canceled"), error, result. (The Status Monitor Resource, table)
- Polling returns 200, with Retry-After while not finished. "DO include a `retry-after` header in the response if the operation is not complete." (Obtaining status and results of long-running operations)
- Keep the monitor after completion. "DO retain the status monitor resource for some publicly documented period of time (at least 24 hours) after the operation completes." (Obtaining status and results of long-running operations)
- No PATCH as an LRO. "DO NOT implement PATCH as an LRO." (Long-Running Operations & Jobs)

Conditional requests (Conditional Requests):

- Honor every precondition header. "DO honor any precondition headers received as part of a client request." (Conditional Requests)
- Ignoring preconditions isn't allowed. "The HTTP Standard does not allow precondition headers to be ignored, as it can be unsafe to do so." (Conditional Requests)
- ETags over dates. "entity tags (\"ETags\") are strongly preferred since last modified dates cannot distinguish updates made less than a second apart." (Conditional Requests)
- PUT/PATCH with a non-matching If-Match gets 412; `If-None-Match: *` creates only if nothing exists; success returns the new ETag. (Conditional Request behavior, table)
- Prefer a hash of the resource to a version number. "YOU SHOULD use a hash of the representation of a resource rather than a last modified/version number" (Computing ETags)
- Why: a version-number ETag makes a retried update look like a conflict. "If a client sends a conditional update request, the service acts on the request, but the client never receives a response, a subsequent identical update will be seen as a conflict even though the retried request is attempting to make the same update." (Computing ETags)
- Different encodings need different ETags. "DO, when supporting multiple representations (e.g. Content-Encodings) for the same resource, generate different ETag values for the different representations." (Computing ETags)
- Why one schema: one SDK type, and a response can be sent back as a request. "This allows one SDK type for input/output operations and enables the response to be passed back in a request." (Resource Schema & Field Mutability)
- Disallow ":" in resource ids so they can't collide with actions. "To avoid potential collision of actions and resource ids, you should disallow the use of the \":\" character in resource ids." (Performing an Action)
- PUT for create-or-replace. "DO use PUT with JSON for wholesale create/replace operations." (Resource Schema & Field Mutability)
- An extensible enum is a string marked with `modelAsString`. "An extensible enum is a string value that has been marked with a special marker - setting `modelAsString` to true within an `x-ms-enum` block." (Use Extensible Enums)
- REST in Azure terms: resources as collections of items, reached by URL paths for CRUD. "When applying REST to your API, you define your service’s resources as a collections of items." (REpresentational State Transfer (REST))
- A fixed URL pattern ending in collection then id. "https://<tenant>.<region>.<service>.<cloud>/<service-root>/<resource-collection>/<resource-id>" (Uniform Resource Locators (URLs))
- A request without `api-version` gets a 400. "DO return HTTP 400 with error code \"MissingApiVersionParameter\"" (API Versioning)
- An identical retry (same operation-id) gets the same response. "For an idempotent PUT (same `operation-id` or same request body within some short time window), the service should return the same response as shown above." (Create or replace operation with additional long-running processing)

## Visuals worth redrawing

None.

## My notes

- Azure puts the version in a query parameter and forbids it in the
  path; Google puts `v1` in the path; Stripe uses a header and an
  account pin. Three big providers, three places.
