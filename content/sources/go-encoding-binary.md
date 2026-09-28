---
id: go-encoding-binary
title: "binary package: encoding/binary"
author: The Go Authors
url: https://pkg.go.dev/encoding/binary
kind: docs
primary: true
---

## Summary

Go's standard library package for turning numbers into bytes and back:
fixed-size values in a chosen byte order, and protobuf-style varints.
The page shows go1.27.1.

## Key claims

- The package covers fixed-size numbers and varints. "Package binary implements simple translation between numbers and byte sequences and encoding and decoding of varints." (package overview)
- Varints use fewer bytes for smaller values, and the package points to the protobuf spec. "smaller values require fewer bytes." (package overview)
- It favors simplicity over speed. "This package favors simplicity over efficiency." (package overview)
- (added in review) For fast serialization of large structures it points to gob or protobuf. "should look at more advanced solutions such as the encoding/gob package or google.golang.org/protobuf for protocol buffers." (package overview)
- Maximum varint sizes: MaxVarintLen16 = 3, MaxVarintLen32 = 5, MaxVarintLen64 = 10. (Constants)
- Three byte orders are provided: `BigEndian`, `LittleEndian`, `NativeEndian`. (Variables)
- "A ByteOrder specifies how to convert byte slices into 16-, 32-, or 64-bit unsigned integers." (type ByteOrder; methods `Uint16/32/64`, `PutUint16/32/64`)
- Little-endian puts the low byte first: `LittleEndian.PutUint16(b, 0x03e8)` writes `e8 03`. "e8 03 d0 07" (type ByteOrder, Example (Put), output for 0x03e8 then 0x07d0)
- `Uvarint` reports errors through its byte count: 0 means the buffer was too small, negative means the value overflowed 64 bits. "n == 0: buf too small" (func Uvarint)
- `PutVarint` encodes an `int64` and panics if the buffer is too small. "If the buffer is too small, PutVarint will panic." (func PutVarint)
- Functions: `PutUvarint`, `AppendUvarint`, `Uvarint`, `ReadUvarint`, and the signed `Varint` versions. (Index)

## Visuals worth redrawing

None.

## My notes

- `NativeEndian` exists, but a file meant to be read on other machines should pick a fixed order.
