---
id: id-generation
title: Generating unique IDs
depth: short
phase: 17
note: >-
  Unique IDs across machines: sequences, Snowflake IDs, UUIDv7.
needs: [primary-keys, clock-skew, partitioning]
leads_to: []
compare_with: [lamport-clocks]
---

# Generating unique IDs

Every row, message and event needs an ID that no other one has. With one
database, a sequence hands them out and you're done. Once many machines
create records at once, you need a scheme that stays unique without
every machine asking the same counter, and you usually want the IDs to
sort roughly by creation time too. The three common answers are a
central ticket server, Snowflake-style IDs, and UUIDv7.

## Why the database's counter stops working

A single Postgres table can take its keys from a sequence (see
[[primary-keys]]). Now split the data across many databases
([[partitioning]]). Each database's auto-increment counter starts at 1,
so two shards both hand out ID 42. Flickr hit exactly this with sharded
MySQL, and needed IDs that were unique across all shards, partly because
they sometimes moved rows between shards.

Random 128-bit IDs avoid the collision, but they're large and land at
random places in a [[b-plus-tree|B-tree]] index, so every insert touches a different
page. What you want is something small, unique, and roughly in time
order.

## Option 1: one counter, on its own server

Flickr's answer was a **ticket server**: a dedicated database whose
only job is to hand out numbers. A one-row table with an auto-increment
column; each request replaces the row and reads back the new ID. The IDs
are plain, sequential integers.

The obvious problem is that it's a single point of failure. Flickr ran
two ticket servers, one handing out odd numbers and the other even ones
(auto-increment step 2, offsets 1 and 2), and clients alternated
between them. The two drift apart, so IDs are unique but not in global
order. Every new record still costs a round trip to a ticket server.

## Option 2: Snowflake, coordinate once

Twitter built Snowflake when it moved tweets from MySQL to Cassandra,
which has no sequence at all. Its goals were at least 10,000 IDs a second
per process, no coordination between generators, 64 bits, and
IDs that sort roughly by time. The trick is to pack three fields into
one 64-bit number:

- **41 bits of time**, milliseconds since a custom epoch. That lasts
  about 69 years.
- **10 bits of machine ID** (5 for the datacenter, 5 for the worker),
  so up to 1,024 generators.
- **12 bits of sequence**, a counter that restarts every millisecond:
  up to 4,096 IDs per millisecond per generator.

![Two bit layouts. Top, a 64-bit Snowflake ID: 1 unused bit, 41 bits of milliseconds since a custom epoch, 5 bits datacenter ID, 5 bits worker ID, 12 bits sequence. Bottom, a 128-bit UUIDv7: 48 bits of Unix milliseconds, 4 version bits, 12 random bits, 2 variant bits, 62 random bits. In both, time comes first, so sorting the numbers sorts by creation time.](img/id-generation-layouts.svg)

*Where the bits go. Snowflake layout from Twitter's `snowflake` README and `IdWorker.scala` (2010); UUIDv7 layout adapted from K. Davis, B. Peabody, P. Leach, RFC 9562, section 5.7 (2024).*

Two generators can never produce the same ID, because their machine ID
bits differ. Within one generator, the sequence keeps IDs in the same
millisecond apart; if it wraps past 4,095, the generator waits for the
next millisecond. Because time sits in the top bits, sorting IDs sorts
them by creation time, which Twitter needed for APIs like "tweets since
this ID".

The coordination hasn't disappeared, it has moved: someone must give
each generator a machine ID that no other running generator has, and
that assignment has to be right every time.

## Option 3: UUIDv7, coordinate never

RFC 9562 (2024) added UUIDv7: a 128-bit ID whose first 48 bits are Unix
time in milliseconds and whose remaining bits (apart from 6 for the
version and variant) are random. There's no machine ID to assign.
Uniqueness comes from 74 random bits, so every host must have a good
random number source. Like Snowflake, it sorts by time as plain bytes,
and generators can add a counter in place of some random bits to keep
many IDs within one millisecond in order.

The price is size: 128 bits instead of 64. Stored as binary it's 16
bytes; stored as text it's much bigger, so store it in a real `uuid`
column.

## Where it gets tricky

**These IDs trust the clock.** Snowflake and UUIDv7 both put wall-clock
time in the top bits, and machine clocks drift and get corrected
([[clock-skew]]). If NTP steps a clock backwards, a generator could
issue IDs that sort before ones it already gave out, or in Snowflake's
case, duplicate a timestamp and sequence it used before. Snowflake
refuses to generate IDs until the clock passes the last time it used,
and recommends running NTP in a mode that never moves the clock back.
RFC 9562 leaves the choice to each implementation, but says it must be
made.

**"Time-ordered" means roughly.** Two machines' clocks never agree
exactly, so IDs from different generators only sort approximately by
real time. Snowflake promised ordering within 1 second and aimed for
tens of milliseconds. Don't use these IDs to decide which of two events
on different machines happened first; that's what
[[lamport-clocks]] and [[hybrid-logical-clocks]] are for.

**IDs leak information.** A time-ordered ID tells anyone who sees it
when the record was made. RFC 9562 says to use random UUIDv4 when the ID is used for
anything security-related, and IDs must never act as access tokens
([[bola]]).

## What this means when you build

- One database: use its sequence, or UUIDv7 generated by the database
  itself, which gives the best ordering.
- Many writers, and you can pay 128 bits: UUIDv7. Nothing to
  coordinate.
- Many writers and you need 64 bits: a Snowflake-style layout, with a
  reliable way to assign unique machine IDs and a check that refuses to
  run when the clock goes backwards.
- Keep time-ordered IDs for index locality and rough sorting, not for
  deciding event order across machines.

## Further reading

- [Snowflake](https://github.com/twitter-archive/snowflake/tree/snowflake-2010), Twitter, 2010. The README's requirements and bit layout, and the generator code, including what it does when the clock goes backwards.
- [RFC 9562: Universally Unique IDentifiers (UUIDs)](https://www.rfc-editor.org/rfc/rfc9562), K. Davis, B. Peabody, P. Leach, IETF, 2024. UUIDv7, monotonic counters, and the advice on distributed generation.
- [Ticket Servers: Distributed Unique Primary Keys on the Cheap](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/), Flickr engineering, 2010. The central-counter approach, and the odd/even trick to avoid a single point of failure.
