---
id: message-schemas
title: Message schemas
depth: short
phase: 10
note: >-
  Schema registries, and keeping producers and consumers compatible.
needs: [schema-evolution, message-queue]
leads_to: [poison-messages]
compare_with: []
---

# Message schemas

A Kafka topic, like any [[message-queue|queue]] or log, stores bytes.
What those bytes mean is an agreement
between the teams that write a topic and the teams that read it, and
it needs a home outside the brokers. A schema registry is that home: it stores every version of each message's schema, gives
each one an ID that travels inside every message, and refuses changes
that would break readers.

## The contract nobody enforces

Say the orders team publishes JSON to `orders`, and three other teams
read it. One day orders renames `amount` to `total`. Nothing fails on
the producer side. The broker takes the bytes as always. The readers
find `amount` missing and break, or worse, carry on with a null.

Without a schema, any producer can add, remove or change fields
whenever it likes, and every consumer finds out in production. What's
missing is what an API has: a contract between the two sides. Formats
with schemas (Avro, [[protobuf|Protocol Buffers]], JSON Schema) write that contract
down. How a schema can change safely is its own topic,
[[schema-evolution]]. This node is about how a message stream carries
and enforces it.

## What a registry does

A schema registry is a separate service next to the brokers. Producers
and consumers talk to Kafka for the data and to the registry for the
schemas.

![A producer registers its schema with the schema registry and gets back ID 42, then writes bytes to a Kafka topic. The consumer reads the bytes, finds ID 42 in them, and looks up schema 42 in the registry. Below, the layout of one message value: byte 0 is a version byte set to 0, bytes 1 to 4 are the schema ID in big-endian order, and the rest is the payload encoded with that schema, with Protobuf putting message indexes first.](img/message-schemas-registry-wire.svg)

*Only a small ID travels with each message; the schema itself lives in the registry. Wire format adapted from Confluent, "Formats, Serializers, and Deserializers" (Schema Registry docs).*

Here's the flow with Confluent's Schema Registry:

1. **The producer's serializer registers the schema** (or finds it
   already there) and gets back a numeric ID. IDs are unique and only
   go up. An identical schema gets the same ID wherever it's
   registered.
2. **Each message carries the ID, not the schema.** By default the
   serializer writes one version byte (0), the 4-byte ID in big-endian
   order, then the encoded data. Keys and values both work this way.
3. **The consumer reads the ID and asks the registry for that schema,**
   then decodes the rest. For Avro this step isn't optional: Avro
   doesn't write field names into the bytes, so it can't decode without
   the writer's schema.

The registry stores its own data in a Kafka topic, with one primary
node handling writes.

## Subjects: where compatibility is checked

Schemas are grouped into subjects. A subject is an ordered list of
versions with its own compatibility setting, and a new version is only
accepted if it fits that setting (backward, forward and the rest are
in [[schema-evolution]]). This is where the contract gets enforced: a
producer with a breaking change can't register its schema, so it fails
before any consumer sees a byte.

Which subject a schema lands in depends on the naming strategy:

- **TopicNameStrategy** (the default): the subject is the topic name
  plus `-key` or `-value`. This quietly means one schema per topic,
  since a second record type in the same topic would fail the
  compatibility check.
- **RecordNameStrategy** and **TopicRecordNameStrategy**: the subject
  comes from the record's name, so one topic can carry several event
  types, each evolving on its own.

The second kind is for a time-ordered chain of related events with
different shapes, say `OrderPlaced` then `OrderCancelled` for the same
order, kept in one topic so they stay in order (see
[[message-ordering]]).

## Where it gets tricky

**The 5-byte prefix is a format change.** A plain consumer that expects
raw Avro or Protobuf can't read these messages, and moving an existing
topic onto the registry breaks old readers. Confluent Platform 8.1.1
added another option: a 16-byte schema GUID in a message header
instead of the prefix. The GUID is a fingerprint of the schema, so it's
the same in any registry. Deserializers from then on check the header
first and fall back to the prefix.

**Deleting a schema breaks old messages.** Every stored message points
at its schema by ID. If that ID is gone from the registry, reading the
message fails with "schema not found", which turns every such message
into a [[poison-messages|poison message]]. Topics that are kept for a
long time need their schemas kept just as long.

**Auto-registration hands control to whoever deploys first.** The
serializer can register whatever schema the producer's code has. That's convenient, and it means the registry's history follows
deploys rather than review. Confluent's docs describe turning
auto-registration off and using the latest registered version instead.

**The registry is on the read path.** A consumer that meets an ID it
hasn't looked up needs the registry to answer before it can decode.

## What this means when you build

- Put a schema on every topic other teams read, and register it
  through review, not by the first producer to deploy.
- Pick the subject naming strategy per topic, on purpose.
- Set the subject's compatibility to match who upgrades first
  ([[schema-evolution]]).
- Never delete a schema while messages that use it are still retained.

## Further reading

- [Schema Registry Concepts](https://docs.confluent.io/platform/current/schema-registry/fundamentals/index.html), Confluent docs. What a registry is, where it sits, and the vocabulary: schema, subject, version, ID.
- [Formats, Serializers, and Deserializers](https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html), Confluent docs. Subject naming strategies, auto-registration, and the wire format byte by byte, including the newer header form.
