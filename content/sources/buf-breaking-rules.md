---
id: buf-breaking-rules
title: Rules and categories (buf breaking)
author: Buf Technologies
url: https://buf.build/docs/breaking/rules/
kind: docs
primary: true
---

## Summary

Reference for `buf breaking`, a tool that compares two versions of a
set of `.proto` files and reports breaking changes. Its rules are
grouped into four categories, from protecting generated source code
(FILE, PACKAGE) to protecting only the encoded bytes (WIRE_JSON,
WIRE). Read when this was written.

## Key claims

- Four categories from strictest to most lenient: FILE (default), PACKAGE, WIRE_JSON, WIRE. "Buf’s breaking rules fit under four categories, from strictest to most lenient" (Categories)
- FILE and PACKAGE protect generated code. "The FILE and PACKAGE categories protect compatibility in generated code." (FILE and PACKAGE)
- A change can be fine on the wire and still break a build: deleting a deprecated enum value. "This change is perfectly wire compatible, but all code that referred to ARENA_FOO then fails to compile" (FILE and PACKAGE)
- WIRE_JSON is the recommended minimum. "Because JSON is common across many transports, this is the recommended minimum level." (Categories)
- Why: JSON uses names. "Using WIRE_JSON instead of WIRE is safer because Protobuf’s JSON encoding breaks when field names change." (WIRE and WIRE_JSON)
- Wire breakage example: optional to required. "Old messages that don’t have that field encoded fail to read in the new definition." (WIRE and WIRE_JSON)
- WIRE-level checking fits when you are your own client, e.g. reading your own old data from disk. "you’re trying to detect issues reading Protobuf encoded messages from older versions of your program that were persisted to disk or other non-volatile storage." (WIRE and WIRE_JSON)
- Deleted enum values should have their names reserved for JSON. "This is the JSON equivalent of reserving the number, since JSON can use field names rather than numbers for enum values" (ENUM_VALUE_NO_DELETE_UNLESS_NAME_RESERVED)

## Visuals worth redrawing

None.

## My notes

- Shows that "breaking" has more than one meaning: bytes, JSON names,
  and generated code.
