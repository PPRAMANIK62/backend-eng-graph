---
id: cassandra-yaml-configuration
title: cassandra.yaml file configuration
author: Apache Cassandra project
url: https://cassandra.apache.org/doc/5.0/cassandra/managing/configuration/cass_yaml_file.html
kind: docs
primary: true
---

## Summary

Reference for every setting in Cassandra's main config file, read at the
5.0 docs path. Used here only for the φ failure detector threshold.

## Key claims

- Cassandra marks a host down when its φ value crosses a threshold. "phi value that must be reached for a host to be marked down." (phi_convict_threshold)
- The default is 8 and most users shouldn't change it. "most users should never need to adjust this." (phi_convict_threshold; "Default Value: 8")

## Visuals worth redrawing

None.

## My notes

- The page carries a "prerelease version" banner even at the 5.0 path.
