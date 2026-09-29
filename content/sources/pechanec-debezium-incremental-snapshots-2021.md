---
id: pechanec-debezium-incremental-snapshots-2021
title: Incremental Snapshots in Debezium
author: Jiri Pechanec (Debezium project)
url: https://debezium.io/blog/2021/10/07/incremental-snapshots/
kind: blog
primary: true
---

## Summary

Why Debezium's classic initial snapshot hurt (all or nothing, blocks
streaming, hard to add tables later) and how Debezium 1.6 adopted
DBLog's watermark approach as incremental snapshots, implemented once
in the connector core.

## Key claims

- Incremental snapshots arrived in Debezium 1.6. "One of the major improvements in Debezium starting in version 1.6 is support for incremental snapshots." (intro)
- The classic snapshot must finish completely or start again. "This means that if the snapshot is not completed due to a connector restart for instance, it must be re-executed from scratch, and everything already done is thrown away." (Why Incremental Snapshots?)
- Changes made during the classic snapshot aren't streamed until it ends, and the transaction log must be kept meanwhile. "This could lead to problems with database resources for very large snapshots, as transaction logs must be kept available until the streaming is started." (Why Incremental Snapshots?)
- The idea came from Netflix's DBLog paper. "They also came up with an innovative solution of executing concurrent snapshots using watermarking, described in the paper DBLog: A Watermark Based Change-Data-Capture Framework by Andreas Andreakis and Ioannis Papapanagiotou." (Watermark-based Snapshots)
- Debezium adopted it in its shared core so all connectors got it. "When we became aware of DBLog’s snapshotting approach, we decided that the method is a universal one and that we could try to adopt it in Debezium, too." (Watermark-based Snapshots)

## Visuals worth redrawing

None beyond DBLog's own figures.

## My notes

- The blog says Netflix announced DBLog "in late 2019"; the arXiv paper
  is from 2020.
