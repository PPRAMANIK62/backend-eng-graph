---
id: google-aip-158
title: "AIP-158: Pagination"
author: Google API Improvement Proposals (AIP) authors
url: https://google.aip.dev/158
kind: docs
primary: true
---

## Summary

How Google APIs page through collections: `page_size` and
`page_token` in the request, `next_page_token` in the response, tokens
that are opaque, and pagination from the first version because adding
it later breaks clients.

## Key claims

- Collections grow, so they must be paginated. "However, collections can often be arbitrarily sized, and also often grow over time, increasing lookup time as well as the size of the responses being sent over the wire." (intro)
- Paginate from the start: adding it later is breaking. "RPCs returning collections of data must provide pagination at the outset, as it is a backwards-incompatible change to add pagination to an existing method." (Guidance)
- If no page size is given, the API picks a documented default and doesn't error. "If the user does not specify page_size (or specifies 0), the API chooses an appropriate default, which the API should document." (Guidance)
- Too-large page sizes are coerced down. "If the user specifies page_size greater than the maximum permitted by the API, the API should coerce down to the maximum permitted page size." (Guidance)
- A page can be short, even empty, before the end. "The API may return fewer results than the number requested (including zero results), even if not at the end of the collection." (Guidance)
- Other parameters must stay the same across pages. "The user is expected to keep all other arguments to the RPC the same; if any arguments are different, the API should send an INVALID_ARGUMENT error." (Guidance)
- An empty next token is the only end signal. "If the end of the collection has been reached, the next_page_token field must be empty. This is the only way to communicate \"end-of-collection\" to users." (Guidance)
- A total count is optional and may be an estimate. "This total may be an estimate (but the API should explicitly document that)." (Guidance)
- Tokens must be opaque, because users will parse anything they can. "Page tokens provided by APIs must be opaque (but URL-safe) strings, and must not be user-parseable. This is because if users are able to deconstruct these, they will do so." (Opacity)
- Base64 alone isn't opaque enough. "Base-64 encoding an otherwise-transparent page token is not a sufficient obfuscation mechanism." (Opacity)
- A token is not authorization. "They must not provide any form of authorization to the underlying resources" (Opacity)
- Stored tokens may expire; a rule of thumb is three days. "a good rule of thumb is three days." (Expiring page tokens)
- Why adding pagination later breaks a client: the 75-item example. "Consider a user whose collection has 75 resources, and who has already written and deployed code." (Backwards compatibility)
- Client libraries treat paginated methods differently, so adding pagination breaks them too. "adding pagination to a previously-unpaginated method causes a breaking change in those libraries." (Backwards compatibility)
- An in-memory implementation is fine to start with, but the default must be finite. "Implementing an in-memory version (which might fetch everything then paginate) is reasonable for initially-small collections." (Backwards compatibility, warning)
- In the 75-item example the API adds pages with a default of 50, and the old code silently gets only 50. "If the API later adds pagination fields, and sets the default to 50, then that user's code breaks" (Backwards compatibility)

## Visuals worth redrawing

None.

## My notes

- An optional `skip` field counts resources, not pages.
