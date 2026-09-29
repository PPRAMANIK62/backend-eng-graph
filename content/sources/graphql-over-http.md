---
id: graphql-over-http
title: GraphQL over HTTP (working draft)
author: GraphQL over HTTP working group (GraphQL Foundation)
url: https://graphql.github.io/graphql-over-http/draft/
kind: spec
primary: true
---

## Summary

The draft spec for serving GraphQL over HTTP, read as the current
working draft when this was written: GET and POST requests, the JSON
request body, the `application/graphql-response+json` media type, and
which HTTP status code to send for each kind of failure.

## Key claims

- The GraphQL spec leaves transport open; HTTP is the common choice. "The GraphQL specification deliberately does not specify the transport layer; however, HTTP is the most common choice when serving GraphQL to remote clients due to its ubiquity." (Introduction)
- GET must not run mutations, to respect HTTP's safe methods. "GET requests MUST NOT be used for executing mutation operations." (4.3)
- A mutation over GET gets 405. "status code 405 (Method Not Allowed) is RECOMMENDED. This restriction is necessary to conform with the long-established semantics of safe methods within HTTP." (4.3)
- Servers must accept POST with a JSON body. "A server MUST support POST requests with a body encoded as UTF-8 JSON, using the application/json media type" (4.4)
- The JSON body has query, operationName, variables and extensions. "query - the string representation of the Source Text of the Document" (4.4.1)
- Clients should read the body, not the status code, when the GraphQL media type is used. "clients know the response is well-formed and should determine the detailed status of the response from the response body alone" (5.4, note)
- Execution errors still get 200. "This is the case even if a GraphQL execution error is raised during GraphQL’s ExecuteQuery() or GraphQL’s ExecuteMutation()." (5.4.1)
- Data plus errors: the draft recommends a new code, 294. "If the GraphQL result contains both the data entry (even if it is null) and the errors entry, then the server SHOULD reply with a 294 status code." (5.4)
- 294 isn't registered with IANA; unknown clients treat it as 200. "although it is not yet registered with IANA, HTTP clients that don’t explicitly recognize status code 294 Partial Success must treat it as equivalent to 200 OK" (6.1)
- 294 is for intermediaries and observability, not for clients. "allows servers to indicate partial success such that intermediaries that do not implement this specification may still track the not-fully-successful request (for example, for observability)." (6.1, note)
- Validation failures get 422, and the request isn't executed. "If a request fails GraphQL validation, the server SHOULD return a status code of 422 (Unprocessable Content) without proceeding to GraphQL execution." (5.4.1)

## Visuals worth redrawing

None.

## My notes

- A working draft, not a final spec; 294 in particular may change.
  Older drafts and many servers answer 200 for everything.
