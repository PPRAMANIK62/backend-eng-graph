---
id: redis-protocol-spec
title: Redis serialization protocol specification
author: Redis
url: https://redis.io/docs/latest/develop/reference/protocol-spec/
kind: spec
primary: true
---

## Summary

The spec for RESP, the protocol Redis clients speak over TCP. Every
value starts with one type byte, parts end in CRLF, and bulk data is
length-prefixed so it's binary-safe. Covers RESP2 (the default) and
RESP3 (opt-in via HELLO since Redis 6.0), pipelining, inline commands
and how to parse it fast. Living doc, undated.

## Key claims

- RESP trades off three goals. "Simple to implement." / "Fast to parse." / "Human readable." (intro list)
- A request is an array of strings: the command and its arguments. "A client sends a request to the Redis server as an array of strings." (intro)
- Binary-safe because bulk data is length-prefixed. "RESP is binary-safe and uses prefixed length to transfer bulk data" (intro)
- Versions: RESP1 in Redis 1.2, RESP2 standard since Redis 2.0, RESP3 opt-in since Redis 6.0. "In Redis 2.0, the protocol's next version, a.k.a RESP2, became the standard communication method for clients with the Redis server." (RESP versions)
- RESP3 is mostly a superset of RESP2. "RESP3 is mostly a superset of RESP2" (RESP versions)
- Default port 6379 over TCP. "A client connects to a Redis server by creating a TCP connection to its port (the default is 6379)." (Network layer)
- Used only over stream connections in practice. "the protocol is used exclusively with TCP connections (or equivalent stream-oriented connections like Unix sockets)" (Network layer)
- Pipelining is allowed. "Pipelining enables clients to send multiple commands at once and wait for replies later." (Request-Response model)
- The first byte gives the type. "In RESP, the first byte of data determines its type." (RESP protocol description)
- It calls itself a binary protocol with ASCII control sequences. "RESP is a binary protocol that uses control sequences encoded in standard ASCII." (RESP protocol description)
- CRLF separates the parts. "The \r\n (CRLF) is the protocol's terminator, which always separates its parts." (RESP protocol description)
- RESP2 type bytes: `+` simple string, `-` simple error, `:` integer, `$` bulk string, `*` array. RESP3 adds `_` null, `#` boolean, `,` double, `(` big number, `!` bulk error, `=` verbatim string, `%` map, `|` attribute, `~` set, `>` push. (table of data types)
- `OK` as a simple string is 5 bytes. "+OK\r\n" (Simple strings)
- Simple strings can't contain CR or LF. "The string mustn't contain a CR (\r) or LF (\n) character and is terminated by CRLF (i.e., \r\n)." (Simple strings)
- Error prefix like ERR or WRONGTYPE is a Redis convention. "Note that the error prefix is a convention used by Redis rather than part of the RESP error type." (Simple errors)
- Integers are signed 64-bit, base 10. "This type is a CRLF-terminated string that represents a signed, base-10, 64-bit integer." (Integers)
- Bulk strings are limited to 512 MB by default. "by default, Redis limits it to 512 MB (see the proto-max-bulk-len configuration directive)." (Bulk strings)
- "hello" as a bulk string is `$5\r\nhello\r\n`. (Bulk strings)
- RESP2's null is a bulk string of length -1. "$-1\r\n" (Null bulk strings)
- Array example. "*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n" (Arrays)
- Aggregates nest. "All of the aggregate RESP types support nesting." (Arrays)
- RESP3's null type fixes RESP2's two nulls. "This duality has always been a redundancy that added zero semantical value to the protocol itself." (Nulls)
- A connection starts in RESP2; HELLO upgrades. "By default, the connection starts in RESP2 mode." (Client handshake)
- Client sends only arrays of bulk strings. "A client sends the Redis server an array consisting of only bulk strings." (Sending commands to a Redis server)
- LLEN example: client sends `*2\r\n$4\r\nLLEN\r\n$6\r\nmylist\r\n`, server replies `:48293\r\n`. (Sending commands to a Redis server)
- Commands can go in one write and replies be read at the end. "Pipelining is supported, so multiple commands can be sent with a single write operation by the client." (Multiple commands and pipelining)
- Inline commands for telnet: detected because they don't start with `*`. "Since no command starts with * (the identifying byte of RESP Arrays), Redis detects this condition and parses your command inline." (Inline commands)
- Length prefixes mean no scanning or escaping of the payload. "That makes scanning the payload for special characters unnecessary (unlike parsing JSON, for example)." (High-performance parser)
- Comparable to binary protocols, simpler to implement. "While comparable in performance to a binary protocol, the Redis protocol is significantly more straightforward to implement in most high-level languages, reducing the number of bugs in client software." (High-performance parser)
- Redis Cluster uses a different binary protocol between nodes. "Redis Cluster uses a different binary protocol for exchanging messages between nodes." (intro note)
- GET returns the null bulk string for a missing key. "The GET command returns the Null Bulk String when the target key doesn't exist." (Null bulk strings)
- Clients must return nil for it, not an empty string. "A Redis client should return a nil object when the server replies with a null bulk string rather than the empty string." (Null bulk strings)
- A RESP2-only server answers HELLO 3 with an unknown-command error, so the client can fall back. "Server: -ERR unknown command 'HELLO'" (Client handshake)
- Lengths are read with one operation per character. "Reading the length of aggregate types (for example, bulk strings or arrays) can be processed with code that performs a single operation per character while at the same time scanning for the CR character." (High-performance parser)
- RESP3 adds a push type the server can send at any time. "The server may push data at any time, and the data isn't necessarily related to specific commands executed by the client." (Request-Response model)

## Visuals worth redrawing

- The LLEN request and reply bytes, split at each CRLF.

## My notes

- The page says "binary protocol" while most people call RESP a text
  protocol. Both are fair: the framing is ASCII, the payload is binary.
