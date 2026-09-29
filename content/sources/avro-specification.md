---
id: avro-specification
title: Apache Avro Specification (version 1.12.0)
author: Apache Avro project
url: https://avro.apache.org/docs/1.12.0/specification/
kind: spec
primary: true
---

## Summary

The authoritative spec for Avro 1.12.0, the newest version on the docs
index when this was written. Avro's binary data carries no field names
or tags, so a reader always needs the schema the data was written with.
Schema evolution works by resolving that writer's schema against the
reader's own schema, field by field and by name.

## Key claims

- The data has no types or names, so the schema must travel with it. "Binary encoded Avro data does not include type information or field names." (Data Serialization and Deserialization)
- Files and RPC must carry or guarantee the writer's schema. "Therefore, files or systems that store Avro data should always include the writer’s schema for that data." (Data Serialization and Deserialization)
- A record is its field values back to back, in declared order. "a record is encoded as just the concatenation of the encodings of its fields." (Binary Encoding, Records)
- Example: a record with `a = 27` (long) and `b = "foo"` (string) encodes as `36 06 66 6f 6f`. (Binary Encoding, Records)
- Two schemas: writer's and reader's. "We refer to the schema used to write the data as the writer’s schema, and the schema that the application expects the reader’s schema." (Schema Resolution)
- Fields are matched by name, so order can differ. "the ordering of fields may be different: fields are matched by name." (Schema Resolution)
- A field only the writer has is skipped. "if the writer’s record contains a field with a name not present in the reader’s record, the writer’s value for that field is ignored." (Schema Resolution)
- A field only the reader has takes the reader's default. "if the reader’s record schema has a field that contains a default value, and writer’s schema does not have a field with the same name, then the reader should use the default value from its field." (Schema Resolution)
- With no default, that's an error. "if the reader’s record schema has a field with no default value, and writer’s schema does not have a field with the same name, an error is signalled." (Schema Resolution)
- Numeric promotion. "int is promotable to long, float, or double" (Schema Resolution)
- Unknown enum symbols use the reader's enum default, or fail. "if the writer’s symbol is not present in the reader’s enum and the reader has a default value, then that value is used, otherwise an error is signalled." (Schema Resolution)
- Aliases let a reader rename a field. "Aliases function by re-writing the writer’s schema using aliases from the reader’s schema." (Aliases)
- Single-object encoding exists for records stored a long time, like in Kafka, where one topic holds records from several schema versions. "One very common example is storing Avro records for several weeks in an Apache Kafka topic." (Single-object encoding)
- That wrapper is a two-byte marker, an 8-byte schema fingerprint, then the record. "The 8-byte little-endian CRC-64-AVRO fingerprint of the object’s schema." (Single object encoding specification)

## Visuals worth redrawing

- Schema Resolution as a picture: writer's record on one side, reader's
  on the other, lines between same-named fields, a dropped field and a
  default filled in.

## My notes

- Compare protobuf, where each field carries its own number and wire
  type (`protobuf-encoding`).
