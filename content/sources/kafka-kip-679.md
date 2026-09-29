---
id: kafka-kip-679
title: "KIP-679: Producer will enable the strongest delivery guarantee by default"
author: Cheng Tan and others, Apache Kafka project
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-679%3A+Producer+will+enable+the+strongest+delivery+guarantee+by+default
kind: spec
primary: true
---

## Summary

The proposal that changed the producer defaults in Kafka 3.0:
enable.idempotence from false to true and acks from 1 to all, and
the compatibility cases where that breaks.

## Key claims

- Before this, the default was at-least-once. "by default, the producer will still use at-least-once delivery and set "enable.idempotence=false"." (Motivation)
- The defaults change in 3.0. "Producer config defaults will change in release version 3.0" (Public Interfaces)
- With old brokers (before 2.8) or old topic message formats (before v2), the new default needs a config change. "change their producer config to explicitly disable the idempotence (set `enable.idempotence = false`)." (Compatibility, Deprecation, and Migration Plan)
- Claimed performance impact is small. "Having these guarantee won't impact the performance in a significant way" (Motivation)

- acks also changes from 1 to all; before, the default was acks=1. "for some performance reasons, by default, the producer config will set "ack=1", where the data loss can happen if the partition leader shutdown." (Motivation; the table under Public Interfaces lists acks from 1 to all)

## Visuals worth redrawing

None.

## My notes

- The page doesn't give numbers; it links an analysis we didn't open.
  Don't repeat "no performance impact" as measured.
