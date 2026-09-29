---
id: confluent-schema-evolution
title: Schema Evolution and Compatibility for Schema Registry on Confluent Platform
author: Confluent
url: https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html
kind: docs
primary: true
---

## Summary

Confluent's docs for how Schema Registry checks that a new schema
version is compatible with earlier ones before accepting it. Defines
the compatibility types (BACKWARD, FORWARD, FULL, their transitive
versions, NONE), which changes each allows for Avro, Protobuf and JSON
Schema, and which side to upgrade first. Read from the "current"
Confluent Platform docs when this was written.

## Key claims

- Backward: the new schema reads data written with the last one. "BACKWARD compatibility means that consumers using the new schema can read data produced with the last schema." (Backward compatibility)
- Forward: the last schema reads data written with the new one. "FORWARD compatibility means that data produced with a new schema can be read by consumers using the last schema, even though they may not be able to use the full capabilities of the new schema." (Forward compatibility)
- Full is both. "FULL compatibility means schemas are both backward and forward compatible." (Full compatibility)
- Transitive checks against every earlier version, not just the last. "If compatibility is configured as transitive, then it checks compatibility of a new schema against all previously registered schemas; otherwise, it checks compatibility of a new schema only against the latest schema." (Transitive property)
- Default is BACKWARD, so consumers can reread a topic from the start. "The main reason that BACKWARD compatibility mode is the default, and preferred for Kafka, is so that you can rewind consumers to the beginning of the topic." (Backward compatibility)
- The default isn't transitive. "The Confluent Schema Registry default compatibility type BACKWARD is non-transitive, which means that it’s not BACKWARD_TRANSITIVE." (Transitive property)
- FORWARD is harder because you must guess the future. "In a sense, you need to anticipate all future changes." (Backward compatibility)
- An Avro field added with a default is backward compatible; without one it isn't. "Had the default value been omitted in the new field, the new schema would not be backward compatible with the old one since it’s not clear what value should be assigned to the new field, which is missing in the old data." (Backward compatibility)
- Adding or removing a field with a default is fully compatible. "In Avro and Protobuf, you can define fields with default values. In that case, adding or removing a field with a default value is a fully compatible change." (Full compatibility)
- Upgrade order for BACKWARD: consumers first. "Therefore, upgrade all consumers before you start producing new events." (Order of upgrading clients)
- Upgrade order for FORWARD: producers first. "Therefore, first upgrade all producers to using the new schema and make sure the data already produced using the older schemas are not available to consumers, then upgrade the consumers." (Order of upgrading clients)
- FULL: any order. "Therefore, you can upgrade the producers and consumers independently." (Order of upgrading clients)
- Truly incompatible changes (Number to String) mean a new topic. "create a brand-new topic and start migrating applications to use the new topic and new schema" (No compatibility checking)
- For Protobuf the recommended mode is BACKWARD_TRANSITIVE. "Note that best practice for Protobuf is to use BACKWARD_TRANSITIVE, as adding new message types is not forward compatible." (Avro, Protobuf, and JSON Schema have different compatibility rules)

## Visuals worth redrawing

- The allowed-changes table per format and mode (Summary).
- The X-2, X-1, X example for transitive vs non-transitive.

## My notes

- The page's summary list says backward allows "add optional fields,
  remove fields" and forward "remove optional fields, add fields",
  which matches the definitions above.
