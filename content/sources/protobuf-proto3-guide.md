---
id: protobuf-proto3-guide
title: Language Guide (proto 3)
author: Google (Protocol Buffers team)
url: https://protobuf.dev/programming-guides/proto3/
kind: docs
primary: true
---

## Summary

The official guide to writing `.proto` files in the proto3 syntax. How
fields get numbers, what the default values are, which schema changes
are safe on the wire, what happens to fields a reader doesn't know, and
how a `service` block describes RPC methods. A living doc with no
version on the page.

## Key claims

- Field numbers run from 1 to 536,870,911, and 19,000 to 19,999 are reserved. "You must give each field in your message definition a number between 1 and 536,870,911" and "Field numbers 19,000 to 19,999 are reserved for the Protocol Buffers implementation." (Assigning Field Numbers)
- The number can't change once the message is in use, because it identifies the field on the wire. "This number cannot be changed once your message type is in use because it identifies the field in the message wire format." (Assigning Field Numbers)
- Numbers 1 to 15 take one byte, 16 to 2047 two. "For example, field numbers in the range 1 through 15 take one byte to encode. Field numbers in the range 16 through 2047 take two bytes." (Assigning Field Numbers)
- Reusing a number makes decoding ambiguous, and the format can't detect it. "The protobuf wire format is lean and doesn’t provide a way to detect fields encoded using one definition and decoded using another." (Consequences of Reusing Field Numbers)
- Possible results of reuse include leaked PII and data corruption. (Consequences of Reusing Field Numbers, list)
- Common causes: renumbering fields, and deleting a field without reserving its number. "deleting a field and not reserving the number to prevent future reuse." (Consequences of Reusing Field Numbers)
- The field number is 29 bits because 3 bits hold the wire type. "The field number is limited to 29 bits rather than 32 bits because three bits are used to specify the field’s wire format." (Consequences of Reusing Field Numbers)
- Deleted numbers go in a `reserved` list and protoc then rejects them. "The protoc compiler will generate error messages if any future developers try to use these reserved field numbers." (Reserved Field Numbers)
- Missing fields read back as type defaults: empty string, empty bytes, false, zero, first enum value (which must be 0). (Default Field Values)
- For implicit-presence scalars you can't tell "set to the default" from "not set". "once a message is parsed there’s no way of telling whether that field was explicitly set to the default value (for example whether a boolean was set to false) or just not set at all" (Default Field Values)
- A scalar set to its default isn't serialized. "Also note that if a scalar message field is set to its default, the value will not be serialized on the wire." (Default Field Values)
- `optional` fields track whether they were set, and are recommended over implicit ones. "optional is recommended over implicit fields for maximum compatibility with protobuf editions and proto2." (Specifying Field Cardinality)
- Adding fields is wire-safe: old code ignores new fields. "old binaries simply ignore the new field when parsing." (Binary Wire-safe Changes)
- Removing fields is safe as long as the number isn't used again. "The same field number must not used again in your updated message type." (Binary Wire-safe Changes)
- Wire-safe changes can still break application code, such as an exhaustive switch over an enum. "Note that any wire-safe changes may be a breaking change to application code in a given language." (Binary Wire-safe Changes)
- Changing a field number is wire-unsafe. "Changing field numbers for any existing field is not safe." (Binary Wire-unsafe Changes)
- int32 to int64 is compatible but can lose data: a large value read as int32 gets truncated. "if a 64-bit number is read as an int32, it will be truncated to 32 bits" (Binary Wire-compatible Changes)
- Proto3 keeps unknown fields and writes them back out. "Proto3 messages preserve unknown fields and include them during parsing and in the serialized output, which matches proto2 behavior." (Unknown Fields)
- Deleted field names should be reserved too, for the JSON and text formats. "You should also reserve the field name to allow JSON and TextFormat encodings of your message to continue to parse." (Deleting Fields)
- Copying a message field by field also loses unknown fields. "Iterate over all of the fields in a message to populate a new message." (Retaining Unknown Fields)
- Converting to JSON loses unknown fields. "Serialize a proto to JSON." is the first item on the list of actions that lose them. (Retaining Unknown Fields)
- A `service` block declares RPC methods, and gRPC generates code from it. "The most straightforward RPC system to use with protocol buffers is gRPC" (Defining Services)

Added for `protobuf` audit:

- Give 1 to 15 to the most-set fields. "You should use the field numbers 1 through 15 for the most-frequently-set fields." (Assigning Field Numbers)
- Changing a number is a delete plus a new field. "“Changing” a field number is equivalent to deleting that field and creating a new field with the same type but a new number." (Assigning Field Numbers)
- The integer types and bool read each other's bytes. "int32, uint32, int64, uint64, and bool are all compatible." (Binary Wire-compatible Changes)

Added for `schema-evolution`:

- JSON and text format have different safe-change rules from binary. "If you use ProtoJSON or proto text format to store your protocol buffer messages, the changes that you can make in your proto definition are different." (Updating A Message Type, note)
- Wire-unsafe means old data under the new parser (or the reverse) breaks. "Only make wire-unsafe changes if you know that all serializers and deserializers of the data are using the new schema." (Binary Wire-unsafe Changes)
- Moving fields into an existing oneof is unsafe. "Moving fields into an existing oneof is not safe." (Binary Wire-unsafe Changes)
- Adding enum values is wire-safe. "Adding additional values to an enum is safe." (Binary Wire-safe Changes)
- Wire-safe can still break code, e.g. an exhaustive switch over an enum. "For example, adding a value to a preexisting enum would be a compilation break for any code with an exhaustive switch on that enum." (Binary Wire-safe Changes)
- New code reading old data sees defaults, so plan for them. "You should keep in mind the default values for these elements so that new code can properly interact with messages generated by old code." (Binary Wire-safe Changes)
- Lossy-but-compatible changes need a staged rollout: keep writing old-range values until every endpoint has the new schema. "you may change an int32 to an int64 but ensure you continue to only write legal int32 values until the new schema is deployed to all endpoints, and then subsequently start writing larger values after that." (Binary Wire-compatible Changes)
- Don't make those changes to schemas used outside your organization. "If your schema is published outside of your organization, you should generally not make wire-compatible changes, as you cannot manage the deployment of the new schema to know when the different range of values may be safe to use." (Binary Wire-compatible Changes)

## Visuals worth redrawing

None.

## My notes

- The JSON (ProtoJSON) mapping has different safe-change rules because
  it uses field names, not numbers. Not needed for the short node.
