---
id: google-aip-122
title: "AIP-122: Resource names"
author: Google API Improvement Proposals (AIP) authors
url: https://google.aip.dev/122
kind: docs
primary: true
---

## Summary

How Google APIs name resources: path-like strings that alternate
collection ids and resource ids, with a `name` field on every resource,
and references to other resources by name rather than by embedding.

## Key claims

- A resource name is its canonical identifier, and what users should store. "these names are what users should store as the canonical names for the resources." (intro)
- Names look like URI paths without the leading slash. "Resource names are formatted according to the URI path schema, but without the leading slash:" (Guidance)
- Example names. "publishers/123/books/les-miserables" (Guidance)
- Segments alternate collection ids and resource ids. "Resource name components should usually alternate between collection identifiers (example: publishers, books, users) and resource IDs (example: 123, les-miserables, vhugo1802)." (Guidance)
- Collection ids are plural, camelCase nouns. "The collection identifier segments in a resource name must be the plural form of the noun used for the resource." (Collection identifiers)
- The full URI adds scheme, host and version; the version is not part of the name because names outlive versions. "The version is not included in the full resource name because the full resource name is expected to persist from version to version." (Resource URIs)
- Example URI with the version in the path. "https://library.googleapis.com/v1/publishers/123/books/les-miserables" (Resource URIs)
- A field pointing at another resource holds that resource's name. "When a field represents another resource, the field should be of type string and accept the resource name of the other resource." (Fields representing another resource)
- Reasons not to embed another resource: lifecycle, permissions, coupling. "Bypasses permissions: If every resource has its own set of permissions, a user with read permission on the dependent resource that doesn't have the same permission on the dependency resource suddenly cannot see the full resource." (Rationale, Disallow embedding of resources)
- Why names instead of ID tuples. "Developers have to understand and remember such anonymous tuples." (Rationale, Using names instead of IDs)
- Embedding complicates lifecycle. "Complicates the resource lifecycle: If the dependency resource is deleted, what happens to the embedded reference in the dependent resource?" (Rationale, Disallow embedding of resources)
- Embedding couples the two resources. "Tightly couples resources in all aspects: Changing the requirements in the schema, permissions, or otherwise for either resource impacts the other" (Rationale, Disallow embedding of resources)

## Visuals worth redrawing

None.

## My notes

- Aliases like `users/me` are allowed, but responses must use the
  canonical name.
