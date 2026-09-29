---
id: protobuf
title: Protocol Buffers
depth: short
phase: 3
note: >-
  A binary format with a schema and numbered fields.
needs: [binary-encoding]
leads_to: [grpc, schema-evolution]
compare_with: [openapi]
---

# Protocol Buffers

Protocol Buffers (protobuf) is a way to turn structured data into
compact bytes and back. You describe your messages once in a `.proto`
file, give every field a number, and generated code in each language
does the encoding. The numbers are the whole trick: they're what goes
on the wire, and they're what lets old and new versions of a program
keep talking to each other.

## A schema with numbered fields

Here's a small message:

```proto
syntax = "proto3";

message Test1 {
  int32 a = 1;
}
```

The `= 1` isn't a default value. It's the field's number. Set `a` to
150, serialize it, and you get three bytes: `08 96 01`.

Those bytes are built from the pieces in [[binary-encoding]]: varints
and length prefixes. A message is a list of records, and each record
is a tag followed by a payload. The tag is itself a varint that packs
two things together: the field number shifted left by three bits, and
a 3-bit wire type in the low bits.

![The bytes 08 96 01 for a message with field a = 150. The first byte 08 splits into bits 0 0001 000: field number 1 and wire type 0, VARINT. The next two bytes, 96 01, are the varint 150. Below, a nested message: 1a 03 followed by the same 08 96 01. 1a splits into field 3, wire type 2 (LEN), and 03 is the length.](img/protobuf-record-bytes.svg)

*A field, and the same field inside a nested message. Adapted from Google, "Encoding" (Protocol Buffers documentation).*

So `08` means "field 1, wire type 0". Wire type 0 is VARINT, so the
reader decodes a varint next and gets 150. Nested messages, strings and
bytes use wire type 2 (LEN): a varint length, then that many bytes. If
`Test1` sits in field 3 of another message, you get `1a 03` and then
the same `08 96 01` as before. There are six wire types in all, two of
them deprecated.

Notice what's missing. The bytes carry no field names and no types.
`08 96 01` only says "field 1 holds the varint 150". To know that field
1 is an `int32` called `a`, the reader needs the `.proto` file.
Protobuf data doesn't describe itself.

Fields that aren't set are simply left out, so a message with many
fields and few values stays small. Field numbers 1 to 15 fit in a
one-byte tag and 16 to 2047 need two, so give the low numbers to the
fields you set most often.

## How the numbers make old and new code compatible

The wire type tells a reader how long the payload is, even for a field
it has never heard of. That's what lets an old program skip fields a
newer program added. Proto3 goes further: it keeps those unknown fields
and writes them back out when it re-serializes the message, so a
message can pass through an old service without losing data.

The rules for changing a schema follow from this:

- **Adding a field is safe.** Old code ignores it. New code reading old
  data sees the field's default.
- **Removing a field is safe,** as long as its number is never used
  again. Put the number in a `reserved` list and the compiler will
  refuse to let anyone reuse it.
- **Changing a field's number is not safe.** To the wire, it's a
  delete plus a new field.
- **Some type changes are compatible but lossy.** `int32`, `int64`,
  `uint32`, `uint64` and `bool` read each other's bytes, but a 64-bit
  value read as `int32` gets truncated.

Reusing a number is the classic mistake. Say `string email = 4` is
deleted and later someone adds `string ssn = 4`. An old client still
sending emails in field 4 now fills in the new field, and the format
can't notice. The results can include data corruption and
leaked personal data.

Field numbers can go up to 536,870,911, which is 29 bits, since the
other 3 bits of the tag hold the wire type. Numbers 19,000 to 19,999
are reserved for the implementation.

## Where it gets tricky

**Zero and "not set" look the same.** A plain proto3 scalar field has
no presence: if the value is 0, `""` or `false`, it isn't written at
all, and the reader gets the default back. You can't tell "set to
false" from "never set". Mark the field `optional` when the difference
matters. `optional` is now the recommended choice over plain
fields.

**The bytes aren't stable.** Field order on the wire isn't guaranteed,
so parsers must accept any order, and serializing the same message
twice can give different bytes. Don't hash or compare serialized
protobufs to check whether two messages are equal.

**Duplicates are allowed.** If a non-repeated field shows up twice,
the parser keeps the last value (and merges nested messages). That's
why concatenating two encoded messages gives the same result as
merging them.

**JSON drops what it doesn't know.** Converting a message to JSON
loses unknown fields, and so does copying one field by field. The JSON
form also uses names, so reserve deleted field names as well as
numbers.

**It's not for big blobs.** A serialized message must be under 2 GiB,
and many implementations refuse anything larger.

## What this means when you build

- Treat field numbers as permanent. Never renumber, and `reserve` every
  number you delete.
- Use `optional` for any scalar where "unset" means something different
  from zero.
- Add fields freely; remove them carefully; change types only when you
  control every reader and writer.
- Don't compare or hash encoded bytes.
- A `.proto` file can also declare a `service` with methods. That's
  where [[grpc]] starts.

## Further reading

- [Encoding](https://protobuf.dev/programming-guides/encoding/), Google, Protocol Buffers docs. The wire format byte by byte: tags, wire types, nested messages, field order and the last-one-wins rule.
- [Language Guide (proto 3)](https://protobuf.dev/programming-guides/proto3/), Google, Protocol Buffers docs. Field numbers, reserved numbers, defaults and presence, and which schema changes are safe.
