---
id: protobuf-encoding
title: Encoding (Protocol Buffers programming guide)
author: Google (Protocol Buffers team)
url: https://protobuf.dev/programming-guides/encoding/
kind: spec
primary: true
---

## Summary

The official description of the protobuf wire format. It explains base-128
varints, ZigZag encoding for signed numbers, fixed-width 4- and 8-byte
numbers, and length-prefixed ("LEN") records for strings, bytes and nested
messages. The page shows no publish date; it's the current living doc.

## Key claims

- A varint takes one to ten bytes for a 64-bit unsigned integer, and small values use fewer bytes. "They allow encoding unsigned 64-bit integers using anywhere between one and ten bytes, with small values using fewer bytes." (Base 128 Varints)
- The top bit of each varint byte is a continuation bit; the low 7 bits are payload. "The lower 7 bits are a payload" (Base 128 Varints)
- The 7-bit groups are stored least significant first. "These 7-bit payloads are in little-endian order." (Base 128 Varints)
- Worked example: 1 is the single byte `01`; 150 is the two bytes `96 01`. (Base 128 Varints)
- Negative numbers in plain `int32`/`int64` are two's complement, so they always take all ten bytes. "this means that all ten bytes must be used." (Signed Integers)
- ZigZag maps positives to even numbers and negatives to odd ones, so small negatives stay small. "Positive integers p are encoded as 2 * p (the even numbers), while negative integers n are encoded as 2 * |n| - 1 (the odd numbers)." (Signed Integers)
- ZigZag table: 0→0, -1→1, 1→2, -2→3; formula `(n << 1) ^ (n >> 63)` for 64-bit. (Signed Integers, table)
- Fixed-width types are 4 or 8 bytes, little-endian. "encoded as 4-byte little-endian" (i32 line in the grammar near the end of the page)
- A LEN record is a varint length followed by that many bytes. "The LEN wire type has a dynamic length, specified by a varint immediately after the tag, which is followed by the payload as usual." (Length-Delimited Records)
- Example: the string "testing" in field 2 is `12 07 74 65 73 74 69 6e 67`: tag, length 7, then 7 bytes. (Length-Delimited Records)

Added for `protobuf`:

- Each record is a tag plus a payload; the tag holds the field number and a wire type. "each key-value pair is turned into a record consisting of the field number, a wire type and a payload." (Message Structure)
- The wire type is what lets old parsers skip new fields. "This allows old parsers to skip over new fields they don’t understand." (Message Structure)
- Tag formula. "(field_number << 3) | wire_type" (Message Structure)
- Six wire types: VARINT, I64, LEN, SGROUP, EGROUP, I32; the group ones are deprecated. (Message Structure, table)
- `int32 a = 1` set to 150 is the three bytes `08 96 01`. (A Simple Message)
- The bytes carry only field numbers; names and types come from the .proto. "the name and declared type for each field can only be determined on the decoding end by referencing the message type’s definition" (Message Structure)
- Missing fields are simply left out. "Missing fields are easy to encode: we just leave out the record if it’s not present." (Missing Elements)
- Nested messages are LEN records: `1a 03 [08 96 01]`. (Submessages)
- If a singular field appears twice, the last value wins (messages merge). "if the same field appears multiple times, the parser accepts the last value it sees." (Last One Wins)
- Parsers must accept fields in any order. "protocol buffer parsers must be able to parse fields in any order." (Field Order)
- Serialization isn't deterministic by default, so don't hash the bytes. "the default serialization is not deterministic." (Field Order, Implications)
- Size limit. "Protos must be smaller than 2 GiB when serialized." (Encoded Proto Size Limitations)
- Many implementations refuse bigger ones. "Many proto implementations will refuse to serialize or parse messages that exceed this limit." (Encoded Proto Size Limitations)
- So concatenating two encoded messages is the same as merging them. "parsing the concatenation of two encoded messages produces exactly the same result as if you had parsed the two messages separately and merged the resulting objects." (Last One Wins)

## Visuals worth redrawing

- The `08 96 01` breakdown: tag byte `08` split into field number 1 and wire type 0, then the varint. (Message Structure)
- The 150 → `10010110 00000001` walk-through (drop continuation bits, reverse the groups, concatenate). (Base 128 Varints)
- `12 07 [74 65 73 74 69 6e 67]` split into tag, length, payload. (Length-Delimited Records)

## My notes

- This is the varint spec Go's encoding/binary points to.
