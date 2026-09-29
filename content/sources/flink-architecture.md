---
id: flink-architecture
title: "What is Apache Flink? Architecture"
author: Apache Flink project
url: https://flink.apache.org/what-is-flink/flink-architecture/
kind: docs
primary: true
---

## Summary

Flink's own introduction: what it is for, bounded vs unbounded streams,
and where it runs. Short; used for the bounded/unbounded framing.

## Key claims

- All data starts as a stream of events. "Any kind of data is produced as a stream of events." (Process Unbounded and Bounded Data)
- Unbounded streams have a start and no end, and must be processed continuously. "Unbounded streams have a start but no defined end. They do not terminate and provide data as it is generated." (same)
- You can't wait for all the input. "It is not possible to wait for all input data to arrive because the input is unbounded and will not be complete at any point in time." (same)
- Bounded streams can be read whole and sorted; that's batch. "Bounded streams can be processed by ingesting all data before performing any computations." and "Processing of bounded streams is also known as batch processing." (same)
- Flink uses algorithms built for fixed-size data on bounded input. "Bounded streams are internally processed by algorithms and data structures that are specifically designed for fixed sized data sets, yielding excellent performance." (same)
- Flink integrates with YARN and Kubernetes or runs standalone. "Flink integrates with all common cluster resource managers such as Hadoop YARN and Kubernetes but can also be setup to run as a stand-alone cluster." (Deploy Applications Anywhere)

## Visuals worth redrawing

- The bounded vs unbounded stream timeline.

## My notes

- Marketing-leaning page, but written by the project.
