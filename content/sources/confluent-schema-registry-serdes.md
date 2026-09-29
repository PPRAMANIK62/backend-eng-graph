---
id: confluent-schema-registry-serdes
title: Formats, Serializers, and Deserializers for Schema Registry on Confluent Platform
author: Confluent
url: https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html
kind: docs
primary: true
---

## Summary

Confluent's docs for the Schema Registry serializers and deserializers
(Avro, Protobuf, JSON Schema). Used for subject name strategies (how a
serializer picks the subject a schema is registered under), the
auto-register and use-latest settings, and the wire format: a version
byte and a 4-byte schema ID in front of every message, or a 16-byte
schema GUID in a header. Read from the "current" Confluent Platform
docs, which mention Confluent Platform 8.1.1.

## Key claims

- A serializer registers the schema under a subject; compatibility is checked per subject. "A serializer registers a schema in Schema Registry under a subject name, which defines a namespace in the registry" / "Compatibility checks are per subject" (Subject name strategy)
- An evolved schema stays in the same subject with a new ID and version. "When schemas evolve, they are still associated to the same subject but get a new schema ID and version" (Subject name strategy)
- TopicNameStrategy is the default: subject is the topic name plus -key or -value. "Derives subject name from topic name. (This is the default.)" (Subject name strategy table)
- TopicNameStrategy means one schema per topic. "The default naming strategy (TopicNameStrategy) names the schema based on the topic name and implicitly requires that all messages in the same topic conform to the same schema, otherwise a new record type could break compatibility checks on the topic." (Subject name strategy)
- RecordNameStrategy and TopicRecordNameStrategy allow several event types in one topic. "Derives subject name from record name, and provides a way to group logically related events that may have different data structures under a topic." (Subject name strategy table)
- Several event types in one topic are for keeping a time-ordered chain of related events together. "This is useful when your data represents a time-ordered sequence of events, and the messages have different data structures." (Subject name strategy)
- auto.register.schemas: the serializer registers the schema itself. "Specify if the serializer should attempt to register the schema with Schema Registry." (auto.register.schemas)
- If the schema ID in a message is gone from the registry, deserialization fails. "If that schema ID is missing (for example, due to deletion), deserialization will fail with a schema not found." (use.latest.version)
- Wire format: byte 0 is a version byte (0), bytes 1-4 the schema ID, then the data. "4-byte schema ID as returned by Schema Registry." (Wire format: schema ID in the payload prefix, table)
- The ID is big-endian. "The schema ID is encoded with big-endian ordering; that is, standard network byte order." (Wire format, Important)
- Keys and values both use it. "The wire format applies to both Kafka message keys and message values." (Wire format, Important)
- Protobuf adds message indexes after the ID, to say which message type in the file. "The message indexes are an array of indexes that corresponds to the message type (which may be nested)." (Wire format)
- Newer option: the schema ID goes in a header as a 16-byte GUID, since Confluent Platform 8.1.1. "Instead, one can ask that the metadata for the schema be placed in the message header. In this case, the metadata in the header will contain a 16-byte schema GUID instead of the 4-byte schema ID." (Wire format: schema GUID in header)
- The GUID is a fingerprint, the same in any registry. "Two schemas that are exactly the same (including schema references, rules, and metadata) will have the same fingerprint regardless of which Schema Registry the schema was registered with." (Wire format: schema GUID in header)
- The header form helps clients adopt the registry without breaking existing readers. "This wire format simplifies migration scenarios, when a client that is not currently using Schema Registry wants to start using it." (Wire format: schema GUID in header)
- Deserializers from 8.1.1 look for the header first, then the prefix. "Now, the deserializer looks for the schema GUID in the header, and if not found, then looks for the schema ID in the payload prefix." (Wire format: schema GUID in header)
- Turning auto-registration off and using the latest registered version is a documented setup. "auto.register.schemas=false use.latest.version=true latest.compatibility.strict=false" (use.latest.version example settings)
- The header option is dated to a release. "As of Confluent Platform 8.1.1, you can change the wire format to not emit the schema ID in the payload prefix." (Wire format)

## Visuals worth redrawing

- The wire format table: version byte, schema ID, (Protobuf indexes),
  data. Redrawn as a byte layout for message-schemas.

## My notes

- The page's "current" docs move with each Confluent release; the
  version pinned here is Confluent Platform 8.1.1 as the page states it.
