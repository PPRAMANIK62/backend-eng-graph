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

## Visuals worth redrawing

- The 150 → `10010110 00000001` walk-through (drop continuation bits, reverse the groups, concatenate). (Base 128 Varints)
- `12 07 [74 65 73 74 69 6e 67]` split into tag, length, payload. (Length-Delimited Records)

## My notes

- This is the varint spec Go's encoding/binary points to.
