---
id: openapi-spec-3-2
title: OpenAPI Specification v3.2.1
author: OpenAPI Initiative (Linux Foundation); editors Henry Andrews, Jeremy Whitlock, Karen Etheridge, Lorna Mitchell, Marsh Gardiner, Miguel Quintero, Mike Kistler, Ralf Handl, Vincent Biret
url: https://spec.openapis.org/oas/v3.2.1.html
kind: spec
primary: true
---

## Summary

The OpenAPI Specification, version 3.2.1 (a patch release of 3.2, which
came out in 2025). It defines a JSON or YAML document that describes an
HTTP API: servers, paths, operations, parameters, request and response
bodies, schemas (a superset of JSON Schema), security and webhooks, so tools
can generate docs, clients, servers and tests from it.

## Key claims

- What it is: a language-agnostic description of an HTTP API that people and machines can read. "The OpenAPI Specification (OAS) defines a standard, language-agnostic interface to HTTP APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection." (2)
- Tools use it for docs, code generation and testing. "An OpenAPI Description (OAD) can then be used by documentation generation tools to display the API, code generation tools to generate servers and clients in various programming languages, testing tools, and many other use cases." (2)
- major.minor names the feature set; patch versions only fix the text. "The major.minor portion of the version string (for example 3.1) SHALL designate the OAS feature set." (2.1)
- Minor versions can still break things. "Occasionally, non-backwards compatible changes may be made in minor versions of the OAS where impact is believed to be low relative to the benefit provided." (2.1)
- The document is JSON, written in JSON or YAML. "An OpenAPI document that conforms to the OpenAPI Specification is itself a JSON object, which may be represented either in JSON or YAML format." (3)
- The API's bodies don't have to be JSON. "the API request and response bodies and other content are not required to be JSON or YAML." (3, note)
- The `openapi` field is the spec version, separate from the API's own version in `info.version`. "This is not related to the info.version string, which describes the OpenAPI document’s version." (4.1.1)
- The entry document is usually named openapi.json or openapi.yaml. "It is RECOMMENDED that the entry document of an OAD be named openapi.json or openapi.yaml." (4.1.2)
- Paths are templated with curly braces. "Path templating refers to the usage of template expressions, delimited by curly braces ({}), to mark a section of a URL path as replaceable using path parameters." (4.8.2)
- 3.2 describes the new QUERY method. "A definition of a QUERY operation, as defined in [RFC10008], on this path." (4.9, Path Item Object)
- operationId is unique and tools use it to name things. "Tools and libraries MAY use the operationId to uniquely identify an operation, therefore, it is RECOMMENDED to follow common programming naming conventions." (4.10, Operation Object)
- Schemas are a superset of JSON Schema (the draft named after its 2020 release). "By default, this object is a superset of the JSON Schema Specification" (4.24)
- It can describe webhooks the provider will call. "The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement." (4.1.1)
- History: it started as the Swagger Specification; Swagger 2.0 was donated to the OpenAPI Initiative, and 3.0.0 was the first OpenAPI-named release. (Appendix A, revision history table)
- A parameter says where it lives. "Possible values are \"query\", \"querystring\", \"header\", \"path\" or \"cookie\"." (4.12, Parameter Object)
- Path parameters are always required. "If the parameter location is \"path\", this field is REQUIRED and its value MUST be true." (4.12, Parameter Object)
- A path template value can't contain a slash. "no values that include a forward slash are matched." (4.8.2)
- Responses are keyed by HTTP status code. "The container maps a HTTP response code to the expected response." (4.16, Responses Object)
- Components hold reusable pieces that do nothing until referenced. "All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object." (4.7, Components Object)
- A description can span several documents. "An OAD MAY be made up of a single document, or be distributed across multiple documents that are connected by various fields using URI references and implicit connections." (4.1.2)
- The querystring location takes the whole query string as one value. "A parameter that treats the entire URL query string as a value" (4.12, Parameter Object)
- QUERY and `querystring` are new in 3.2: the 3.1.2 spec (https://spec.openapis.org/oas/v3.1.2.html) has no QUERY operation in its Path Item Object and no "querystring" parameter location (checked by searching the 3.1.2 page). The QUERY method itself is RFC 10008, "The HTTP QUERY Method" (rfc-editor.org, opened).
- 3.2.1 is a patch release of 3.2.0; the spec index at spec.openapis.org/oas/ lists v3.2.1 as the newest version. "Patch release of the OpenAPI Specification 3.2.1" (Appendix A, revision history)

## Visuals worth redrawing

None.

## My notes

- 3.2.0 and 3.1.2 were released together in 2025; 3.2.1 is a later
  patch. Tool support lags: OpenAPI Generator's README says it supports
  2.0 and 3.0 descriptions.
- The 3.1.1 text (https://spec.openapis.org/oas/v3.1.1.html, also
  opened) has no QUERY operation and no querystring parameter, so both
  are new in 3.2.
