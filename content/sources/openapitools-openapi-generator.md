---
id: openapitools-openapi-generator
title: OpenAPI Generator (README)
author: OpenAPI Tools community
url: https://github.com/OpenAPITools/openapi-generator
kind: code
primary: true
---

## Summary

The README of OpenAPI Generator, a widely used open-source tool that
reads an OpenAPI description and generates client libraries, server
stubs, documentation and config files for many languages. Master branch
at version 7.26.0 when this was written.

## Key claims

- It generates clients, server stubs, docs and config from an OpenAPI description. "OpenAPI Generator allows generation of API client libraries (SDK generation), server stubs,  documentation and configuration automatically given an [OpenAPI Spec]" (Overview)
- Supported input versions. "(both 2.0 and 3.0 are supported)" (Overview)
- Server stubs include Go (net/http, Gin, Echo) among many others. "**Go** (net/http, Gin, Echo)" (Overview, table)
- Not affiliated with the OpenAPI Initiative. "Both \"OpenAPI Tools\" (https://OpenAPITools.org - the parent organization of OpenAPI Generator) and \"OpenAPI Generator\" are not affiliated with OpenAPI Initiative (OAI)" (top)
- A description from an untrusted source can inject code. "If the OpenAPI spec, templates or any input (e.g. options, environment variables) is obtained from an untrusted source or environment, please make sure you've reviewed these inputs before using OpenAPI Generator" (top)
- It forked from Swagger Codegen, with a migration guide. "To migrate from Swagger Codegen to OpenAPI Generator, please refer to the [migration guide]" (top)

## Visuals worth redrawing

None.

## My notes

- "3.0 supported" in the README; whether 3.1 and 3.2 features are
  handled wasn't checked.
