---
id: nodejs-stream-api
title: Stream (Node.js API documentation)
author: Node.js project
url: https://nodejs.org/api/stream.html
kind: docs
primary: true
---

## Summary

The Node.js stream API reference, read at v26.10.0. The "Buffering"
section explains highWaterMark, and `getDefaultHighWaterMark` records
that Node 22 raised the default.

## Key claims

- Writable: write() returns false once the buffer reaches highWaterMark. "Once the size of the internal buffer reaches or exceeds the highWaterMark, false will be returned." (Buffering)
- Readable: at highWaterMark the stream stops reading from the source. "the stream will temporarily stop reading data from the underlying resource until the data currently buffered can be consumed" (Buffering)
- The goal of pipe() is to keep buffering bounded between different speeds. "A key goal of the stream API, particularly the stream.pipe() method, is to limit the buffering of data to acceptable levels such that sources and destinations of differing speeds will not overwhelm the available memory." (Buffering)
- highWaterMark is a threshold, not a hard limit. "The highWaterMark option is a threshold, not a limit: it dictates the amount of data that a stream buffers before it stops asking for more data." (Buffering)
- It doesn't enforce a memory cap. "It does not enforce a strict memory limitation in general." (Buffering)
- A socket has separate read and write buffers. "net.Socket instances are Duplex streams whose Readable side allows consumption of data received from the socket and whose Writable side allows writing data to the socket." (Buffering)
- Default highWaterMark: 64 KiB for byte streams on non-Windows, 16 KiB on Windows, 16 objects in object mode. "For byte streams, it defaults to 65536 (64 KiB) on non-Windows platforms and 16384 (16 KiB) on Windows." (stream.getDefaultHighWaterMark)
- Changed in v22.0.0: "bump default highWaterMark." (stream.getDefaultHighWaterMark, History)

## Visuals worth redrawing

None.

## My notes

- "Threshold, not a limit": write() returning false is advice. Code
  that keeps writing still buffers without bound.
