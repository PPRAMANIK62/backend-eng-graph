---
id: confluent-schema-registry-concepts
title: Schema Registry Concepts for Confluent Platform
author: Confluent
url: https://docs.confluent.io/platform/current/schema-registry/fundamentals/index.html
kind: docs
primary: true
---

## Summary

Confluent's overview of Schema Registry: what it is, where it sits
next to Kafka, how it stores schemas (in a Kafka topic, with one
primary), and the vocabulary of schema, subject, version and schema
ID. Also why schemas matter for data shared between teams.

## Key claims

- A registry stores versioned schemas and checks compatibility; serializers plug into Kafka clients. "It stores a versioned history of all schemas based on a specified subject name strategy, provides multiple compatibility settings and allows evolution of schemas according to the configured compatibility settings and expanded support for these schema types." (How it works)
- It sits outside the brokers; clients talk to both. "Schema Registry lives outside of and separately from your Kafka brokers." (How it works)
- Its own storage is a Kafka topic, and it has a single primary. "Kafka provides the durable backend, and functions as a write-ahead changelog for the state of Schema Registry and the schemas it contains." (How it works)
- Schema IDs are unique and increasing, not necessarily consecutive. "Allocated IDs are guaranteed to be monotonically increasing and unique, but not necessarily consecutive." (How it works)
- A subject is the scope in which a schema evolves. "Schema Registry defines a scope in which schemas can evolve, and that scope is the subject." (Schemas, subjects, and topics)
- Producers put the ID in each message; consumers fetch the schema by ID. "Producers embed the schema ID in each message, and consumers use the ID to fetch the schema from Schema Registry." (Schemas, subjects, and topics)
- Identical schemas share one ID across subjects. "Two registrations of an identical schema definition share the same schema ID, even when registered under different subjects." (Schemas, subjects, and topics)
- Registering the same schema again doesn't make a new version. "Registering the same schema under a subject doesn’t create a new version." (Schemas, subjects, and topics)
- Without a schema, downstream teams can't rely on the format. "What’s missing is a “contract” (cf. schema below) for data between the producers and the consumers, similar to the contract of an API." (Kafka serializers and deserializers background)
- Avro needs the schema to decode, so field names aren't in the bytes. "Because the schema is provided at decoding time, metadata such as the field names don’t have to be explicitly encoded in the data." (Kafka serializers and deserializers background)
- Single primary. "Schema Registry is designed to be distributed, with single-primary architecture, and ZooKeeper/Kafka coordinates primary election." (How it works)

## Visuals worth redrawing

- Producer and consumer each talking to the broker and to the registry.

## My notes

- Pinned to the "current" Confluent Platform docs when this was written.
