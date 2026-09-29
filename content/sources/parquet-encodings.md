---
id: parquet-encodings
title: Parquet encoding definitions (Encodings.md)
author: Apache Parquet contributors
url: https://github.com/apache/parquet-format/blob/master/Encodings.md
kind: spec
primary: true
---

## Summary

The part of the Parquet spec that defines how values are laid out in a
page: plain, dictionary, the RLE/bit-packing hybrid, delta encodings,
byte stream split, and (in preview when this was written) ALP for
floating point.

## Key claims

- Plain encoding writes fixed-width numbers little-endian. "INT32: 4 bytes little endian" (Plain)
- Byte arrays in plain encoding are length-prefixed. "BYTE_ARRAY: length in 4 bytes little endian followed by the bytes contained in the array" (Plain)
- Dictionary encoding builds a per-chunk dictionary and stores indexes. "The dictionary encoding builds a dictionary of values encountered in a given column." (Dictionary Encoding)
- The dictionary lives in a dictionary page per column chunk; indexes use the RLE/bit-packing hybrid. "The values are stored as integers using the [RLE/Bit-Packing Hybrid](#RLE) encoding." (Dictionary Encoding)
- If the dictionary grows too big, the writer falls back to plain. "If the dictionary grows too big, whether in size or number of distinct values, the encoding will fall back to the plain encoding." (Dictionary Encoding)
- Delta encoding for INT32 and INT64, adapted from Lemire and Boytsov's binary packing, with varints and zigzag. "In delta encoding we make use of variable length integers for storing various numbers (not the deltas themselves)." (Delta Encoding)
- A block of identical values packs to zero bits wide. "a block containing all the same values will be bit packed to a zero bit width thus being only a header." (Delta Encoding, Characteristics)
- Byte stream split doesn't shrink data but helps a compressor afterwards. "This encoding does not reduce the size of the data but can lead to a significantly better compression ratio and speed when a compression algorithm is used afterwards." (Byte Stream Split)
- BIT_PACKED is deprecated. (Deprecated Encodings table)
- The RLE/bit-packing hybrid is used for booleans and dictionary indices. "RLE = 3 | BOOLEAN, Dictionary Indices" (Supported Encodings table)
- A Preview encoding may not be supported by every reader yet. "The Parquet community recommends only using the encoding when you are sure your reader supports it." (ALP, Preview note)

## Visuals worth redrawing

None.

## My notes

- ALP was marked Preview when read: readers may not support it yet.
