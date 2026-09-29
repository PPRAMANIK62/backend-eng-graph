---
id: schema-evolution
title: Schema evolution
depth: deep
phase: 5
note: >-
  Changing message shapes without breaking old readers or writers:
  forward and backward compatibility.
needs: [protobuf, binary-encoding]
leads_to: [message-schemas, api-versioning]
compare_with: [backwards-compatibility, deployment-strategies]
---

# Schema evolution

The shape of your messages will change. Schema evolution is changing it
so that old and new code can still read each other's data: during a
rolling deploy, after a rollback, and when you read data that was
written years ago. It works in two directions, called backward and
forward compatibility, and each format makes different changes safe.

## Old and new code, running at the same time

Take an orders service. Version 1 writes an order as `{id, amount}`.
Version 2 adds a `coupon` field.

You'd like to switch everything to v2 at once, but you can't. Clients
and servers are never updated at exactly the same moment, even when
you try, and one side may get rolled back. During a rolling deploy,
some instances run v1 and some run v2, and they send each other
orders. And data outlives code: a v1 order written to a log, a
database or a [[kafka-architecture|Kafka]] topic will be read by v2,
v3 and whatever comes after.

So two things have to work:

![Two columns, v1 and v2. Each version's writer produces data that its own reader reads. Two crossing arrows show the other cases: v1 data {id, amount} going to the v2 reader, labelled backward, new reads old, which fills the missing coupon with a default; and v2 data {id, amount, coupon} going to the v1 reader, labelled forward, old reads new, which skips the coupon it doesn't know.](img/schema-evolution-directions.svg)

*The two directions. Every change has to be checked against both, or you have to control who upgrades first.*

- **[[backwards-compatibility|Backward compatibility]]: new code reads old data.** The v2 reader
  gets an order with no coupon. It needs a sensible value to use
  instead: a default.
- **Forward compatibility: old code reads new data.** The v1 reader
  gets an order with a coupon it has never heard of. It must skip it
  without crashing, and ideally keep it if it passes the order on.

Forward is the harder one, because the old code was written before
the change existed. It only works if the format and the reader were
built to tolerate things they don't know.

## How a reader copes with what it doesn't know

Formats with a schema solve this in one of two ways.

**Tag every field.** [[protobuf|Protocol Buffers]] and Thrift write a
number and a wire type in front of every field (see
[[binary-encoding]]). An old reader that meets field 3 for the first
time still knows from the wire type how many bytes to skip. Proto3
goes further and keeps unknown fields, writing them back out if the
message is re-serialized. Field names never appear in the bytes, so
you can rename a field freely. The number, though, is the field's
identity forever.

**Send the writer's schema.** Avro writes no tags and no names at all.
A record is just its field values back to back, in the order the
schema declares them. That makes the bytes impossible to read without
the exact schema they were written with. So Avro always has two
schemas at hand: the **writer's schema**, which travels with the data
or is looked up, and the **reader's schema**, which your code was
built with. The library resolves one against the other:

![Writer's schema on the left with fields id long, amount int, note string. Reader's schema on the right with fields amount long, id long, and coupon string with a default of empty string. Arrows match id to id and amount to amount by name, even though the order differs; amount is promoted from int to long. The note field exists only in the writer, so the reader skips it. The coupon field exists only in the reader, so its default is used, and a missing default would be an error.](img/schema-evolution-avro-resolution.svg)

*Avro's schema resolution. Adapted from the Schema Resolution section of the Apache Avro 1.12.0 specification.*

- Fields are matched by name, so their order can differ.
- A field only the writer has is skipped.
- A field only the reader has gets the reader's default. With no
  default, reading fails.
- Some type changes are resolved on the fly: an `int` can be read as a
  `long`, `float` or `double`.

The reader has to get the writer's schema from somewhere. A file can
store it once at the top. A long-lived connection can agree on it once
at the start. A single stored record can carry a schema ID or
fingerprint, with a registry to look up the full schema (see
[[message-schemas]]). Avro even has a small wrapper for this: a
two-byte marker and an 8-byte fingerprint in front of each record.

One way to see the difference: protobuf tags each field, Avro tags the
whole file, connection or record with a schema version. On the small
record in Martin Kleppmann's comparison, dropping the tags saved one
byte: 82 bytes as JSON, 33 as protobuf, 32 as Avro.

## The rules that follow

Both designs end up with similar rules.

- **Adding a field** is safe if old data has a way to fill it. In
  protobuf, a missing field reads as its type's default. In Avro, the
  new field must declare a default.
- **Removing a field** is safe if no reader needs it. In protobuf,
  never use its number again, and put it in a `reserved` list so the
  compiler stops anyone who tries. In Avro, only remove fields that had
  a default, so old readers can fall back on it.
- **Renaming** is free in protobuf's binary format but not in Avro,
  where readers first need the new name with the old one as an alias.
- **Changing a type** is mostly unsafe. Some changes are compatible
  but lossy: widen a protobuf field from `int32` to `int64`, and a
  large value read by code that still has `int32` gets cut to 32 bits. You can still make such a change if
  you control every reader: switch the schema, keep writing only values
  that fit the old type until every reader has the new one, then start
  using the bigger range.
- **Required fields** don't age well. Making a field required breaks
  every old message that lacks it, and a required field that stops
  making sense still has to be filled in, often with an empty string,
  for as long as the message lives. Proto3 removed `required`
  entirely.
- **Enums** need a plan for values the reader doesn't know. Protobuf
  advises making the first value `..._UNSPECIFIED = 0`, since an old
  client may see a newer value as unset. Avro uses the reader's enum
  default, or fails without one.
- **Defaults must not change.** If v1 and v2 disagree on the default,
  the same unset field means different things to different servers
  during the rollout.

## Who upgrades first

Some changes are safe in only one direction, and then the order of the
upgrade matters. Confluent's Schema Registry turns this into settings:

- **BACKWARD:** the new schema can read data from the last one. Upgrade
  consumers first, then producers.
- **FORWARD:** the last schema can read data from the new one. Upgrade
  producers first.
- **FULL:** both, so either side can go first.

Adding a type to an Avro union, renaming an Avro field, or renaming a
protobuf enum value all follow the same pattern: readers first, then
writers, and only then remove the old name.

There's a catch in "the last one". Plain BACKWARD only checks a new
schema against the previous version. If a topic still holds data
written with v1, v2 and v3, you want v3 to read all of it. The
**transitive** settings check against every earlier version. The
registry's default is plain BACKWARD, chosen so consumers can be
rewound to the start of a topic. For protobuf, Confluent recommends
BACKWARD_TRANSITIVE.

When a change can't be made compatible, such as turning a number into
a string, you don't evolve the schema. You write to a new topic and
move readers over.

## Where it gets tricky

**"Compatible" has several meanings.** A change can keep the bytes
readable and still break something. Buf's breaking-change checker
has four levels: generated code per file, per package, the binary plus
JSON encoding, and the binary encoding alone. Deleting a deprecated
enum value is fine on the wire, but every program that still names it
stops compiling. Adding an enum value breaks code that switches over
every case. And protobuf's JSON format uses field names, so a rename
that's harmless in binary breaks JSON clients.

**Unknown fields can still be lost.** Proto3 keeps them only if you
pass the message along as is. Copying it field by field into a new
message, or converting it to JSON, drops them.

**Unset or zero?** A plain proto3 number that reads as 0 might have
been set to 0, or never sent. New code reading old data often needs
that difference. Mark such fields `optional`.

**Old data lives longer than you think.** A field number that was ever
in production may still sit in a log somewhere. That's why "never
reuse a number" has no expiry date.

**It's not versioning.** Schema evolution keeps one contract working
for readers on both sides of a change. [[api-versioning]] is what you
do when a change can't be made compatible. It's also not a database
[[schema-migrations|migration]]: a database can rewrite the rows it
stores, but you can't rewrite messages already sent or copies already
read by someone else.

## What this means when you build

- Check both directions: can v(n+1) read v(n) data, and can v(n) read
  v(n+1) data?
- Add fields with defaults. Never reuse or renumber a field; reserve
  deleted numbers and names.
- For anything a reader must understand, upgrade readers first, then
  writers.
- Run a compatibility check in CI (`buf breaking`, or your schema
  registry's check), transitive if you keep old data.
- Start every enum with an UNSPECIFIED zero value, and use `optional`
  where "not set" differs from zero.

## Further reading

- [Language Guide (proto 3)](https://protobuf.dev/programming-guides/proto3/), Google. The "Updating A Message Type" section: wire-safe, wire-unsafe and lossy changes, and unknown fields.
- [Proto Best Practices](https://protobuf.dev/best-practices/dos-donts/), Google. Short rules on tag reuse, required fields, enum zero values and defaults, each with the failure it prevents.
- [Apache Avro Specification](https://avro.apache.org/docs/1.12.0/specification/), Apache Avro, version 1.12.0. Schema resolution between writer's and reader's schemas, aliases, and single-object encoding.
- [Schema evolution in Avro, Protocol Buffers and Thrift](https://martin.kleppmann.com/2012/12/05/schema-evolution-in-avro-protocol-buffers-thrift.html), Martin Kleppmann, 2012. One record encoded three ways, byte by byte, and what each encoding means for changes. Predates proto3.
- [Schema Evolution and Compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html), Confluent. Backward, forward, full and transitive checks, and which side to upgrade first.
- [Rules and categories](https://buf.build/docs/breaking/rules/), Buf. The different levels of "breaking" for protobuf: generated code, JSON and binary.
