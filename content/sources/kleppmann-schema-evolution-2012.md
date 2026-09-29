---
id: kleppmann-schema-evolution-2012
title: Schema evolution in Avro, Protocol Buffers and Thrift
author: Martin Kleppmann
url: https://martin.kleppmann.com/2012/12/05/schema-evolution-in-avro-protocol-buffers-thrift.html
kind: blog
primary: false
---

## Summary

A 2012 post that encodes the same small "Person" record in JSON,
Protocol Buffers, Avro and Thrift, byte by byte, and shows how each
encoding decides which schema changes are safe. Protobuf and Thrift tag
every field with a number; Avro tags nothing and instead needs the
writer's schema at read time. Written before proto3, so it still
talks about protobuf `required`.

## Key claims

- Schema evolution lets producers and consumers run different versions. "you can change the schema, you can have producers and consumers with different versions of the schema at the same time, and it all continues to work." (intro)
- That lets you deploy parts of a system independently. "it allows you to update different components of the system independently, at different times, without worrying about compatibility." (intro)
- The example record is 82 bytes as JSON without whitespace, 33 bytes as protobuf and 32 bytes as Avro. (intro, Protocol Buffers, Avro)
- Protobuf: unknown fields can be skipped because the tag carries a type code. "it can figure out how many bytes it needs to skip in order to find the next field in the record." (Protocol Buffers)
- Protobuf: rename freely, never change a tag. "You can rename fields, because field names don’t exist in the binary serialization, but you can never change a tag number." (Protocol Buffers)
- Protobuf `required` makes changes risky. "required has an additional validation check, so if you change it, you risk runtime errors" (Protocol Buffers)
- Deleted tag numbers must never be reused because old data may still exist. "you must never reuse the tag number for another field in future, because you may still have data stored that uses that tag for the field you deleted." (Protocol Buffers)
- Thrift works like protobuf: tags and types in the bytes, so unknown fields can be skipped. "each field is manually assigned a tag in the IDL, and the tags and field types are stored in the binary encoding, which enables the parser to skip unknown fields." (Thrift)
- Avro needs the writer's schema to parse at all. "The only way you can parse this binary data is by reading it alongside the schema, and the schema tells you what type to expect next." (Avro)
- Avro: add a field only with a default. "You can add a field to a record, provided that you also give it a default value" (Avro)
- Avro: remove a field only if it had a default. "you can remove a field from a record, provided that it previously had a default value." (Avro)
- Avro unions: readers first, then writers. "If you want to add a type to a union, you first need to update all readers with the new schema, so that they know what to expect." (Avro)
- Avro renames: readers get the alias first, then writers switch. "You need to first update all readers of the data to use the new field name, while keeping the old name as an alias" (Avro)
- Ways a reader finds the writer's schema: once per file, once per connection, or a version number per record plus a schema registry. "You then need a schema registry where you can look up the exact schema definition for a given version number." (Avro)
- The two approaches in one line. "in Protocol Buffers, every field in a record is tagged, whereas in Avro, the entire record, file or network connection is tagged with a schema version." (Avro)

## Visuals worth redrawing

- The byte-by-byte breakdowns of the Person record in protobuf and Avro.

## My notes

- Pre-proto3: proto3 removed `required` (see `protobuf-best-practices`).
