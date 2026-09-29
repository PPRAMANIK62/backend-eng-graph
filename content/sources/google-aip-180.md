---
id: google-aip-180
title: "AIP-180: Backwards compatibility"
author: Google API Improvement Proposals (AIP) authors
url: https://google.aip.dev/180
kind: docs
primary: true
---

## Summary

What Google counts as a breaking change to an API: three kinds of
compatibility, what may be added, what must never be removed or
changed, and the subtle cases (defaults, formats, string lengths,
serialization of defaults).

## Key claims

- An API is a contract that running code depends on. "APIs are fundamentally contracts with users, and users often write code against APIs that is then launched into a production service with the expectation that it continues to work" (intro)
- Old clients must work against newer servers of the same major version. "Old clients must be able to work against newer servers (with the same major version number)." (Guidance)
- It isn't always clear what's compatible. "It is not always clear whether a change is compatible or not." (Guidance)
- Three kinds: source, wire, semantic. "Semantic compatibility: Code written against a previous version must continue to receive what most reasonable developers would expect." (Guidance)
- New components may be added in the same major version. "In general, new components (interfaces, methods, messages, fields, enums, or enum values) may be added to existing APIs in the same major version." (Adding components)
- No new required fields in existing requests. "New required fields must not be added to existing request messages or resources." (Adding components)
- A field the server filled before must stay filled. "Any field previously populated by the server must continue to be populated, even if it introduces redundancy." (Adding components)
- New enum values can break code that doesn't expect them. "For enum values specifically, be aware that it is possible that user code does not handle new values gracefully." (Adding components)
- Removing is breaking, and renaming is remove plus add. "Renaming a component is semantically equivalent to \"remove and add\"." (Removing or renaming components)
- Don't change a field's type, even if wire-compatible, because generated code changes. "Existing fields and messages must not have their type changed, even if the new type is wire-compatible, because type changes alter generated code in a breaking way." (Changing the type of fields)
- Raising a string's length limit counts as breaking. "APIs should treat expected size upper bound increases as incompatible changes" (Changing string length)
- Code depends on undocumented behavior too. "Code will often depend on API behavior and semantics, even when such behavior is not explicitly supported or documented." (Semantic changes)
- Changing a value's format is breaking, e.g. IPv4 to IPv6. "changing the format of a field ip_address conforming to IPv4 format to instead contain IPv6 values is a breaking change." (Changing value format or construction)
- Changing a default is breaking. "Changing the default value is considered breaking and must not be done." (Default values must not change)
- Starting to send a field that used to be omitted at its default is breaking. "Clients may depend on the presence or absence of a field in a resource as semantically meaningful" (Serializing defaults)
- The list is a guide, not complete. "The guidance here should be treated as indicative, rather than as a comprehensive list of every possible change." (Guidance)
- The guidance assumes protobuf and JSON. "In general, the specific guidance here assumes use of protocol buffers and JSON as transport formats." (Guidance, note)
- Adding pagination later: old clients think they got everything. "If the default for the new page_size field is less than what was previously returned, older clients will incorrectly assume all results were returned." (Adding components)
- Response enums that will grow should say so. "Enums that are used in response messages or resources and which are expected to receive new values should document this." (Adding components)
- The default example: a book's genre defaulting to FICTION, changed to NONFICTION, "would constitute a breaking change." (Default values must not change)
- Why length limits matter: users store values in sized columns. "End users may store resource properties, like the name, in a dedicated database column with a limited length." (Rationale, Risk of string length changes)
- To rename, add the new component and keep the old one. "In cases where these sorts of changes are desirable, a service may add the new component, but must not remove the existing one." (Removing or renaming components)
- A new field a client can set must default to the old behavior. "Any field being populated by clients must have a default behavior matching the behavior before the field was introduced." (Adding components)
- New enum values are fine in request-only enums. "Enum values may be freely added to enums which are only used in request messages." (Adding components)
- Tightening what's accepted breaks requests that used to work. "If resource name formats become more restrictive, a request that would previously have succeeded will now fail." (Changing resource names)
- APIs with a narrow audience (same team, forced updates) can set their own rules. "Any API which has a more limited scope (for example, an API which is only called by client code written by the same team as the API producer, or deployed in a way which can enforce updates) should carefully consider its own compatibility requirements." (Guidance, note)
- The rule isn't meant to freeze the API. "an expansive reading of this guidance could ostensibly prevent any change (which is not the intent)." (Semantic changes, note)
- Wire compatibility defined. "Code written against a previous version must be able to communicate correctly with a newer server." (Guidance)

## Visuals worth redrawing

None.

## My notes

- Pairs with Hyrum's law: the "semantic compatibility" section is the
  same observation written as a rule.
