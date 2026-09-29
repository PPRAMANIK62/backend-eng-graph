---
id: kubernetes-cgroups
title: About cgroup v2
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/architecture/cgroups/
kind: docs
primary: true
---

## Summary

Kubernetes' page on cgroup v2: why it's better than v1, what a node
needs to use it, which language runtimes read v2 limits correctly, and
the deprecation of v1 (Kubernetes v1.35).

## Key claims

- The kubelet and runtime use cgroups to enforce pod requests and limits. "The kubelet and the underlying container runtime need to interface with cgroups to enforce resource management for pods and containers which includes cpu/memory requests and limits for containerized workloads." (About cgroup v2)
- cgroup v2 support stable since Kubernetes v1.25. "Feature state: Stable since Kubernetes v1.25" (What is cgroup v2?)
- v2 improvements include accounting for page cache writeback. "Accounting for non-immediate resource changes such as page cache write backs" (What is cgroup v2?)
- Requires Linux 5.8 or later. "Linux Kernel version is 5.8 or later" (Requirements)
- Runtimes that don't understand v2 may size themselves to the host. "Versions without this support may read the host's total memory instead of the limit applied to the pod, which can lead to an incorrectly sized heap and out-of-memory (OOM) terminations." (Migrating to cgroup v2)
- Node.js reads cgroup v2 memory limits from v20.3.0. "Node.js reads cgroup v2 memory limits (through libuv) starting with Node.js v20.3.0." (Migrating to cgroup v2)
- Check which version a node uses. "For cgroup v2, the output is cgroup2fs." (Identify the cgroup version)
- cgroup v1 deprecated. "Feature state: Deprecated since Kubernetes v1.35" (Deprecation of cgroup v1)
- The cgroup filesystem lives at /sys/fs/cgroup on a node. "run the stat -fc %T /sys/fs/cgroup/ command on the node" (Identify the cgroup version)
- Java versions that read v2 limits are listed. "If you deploy Java applications, prefer to use versions which fully support cgroup v2" (Migrating to cgroup v2)

## Visuals worth redrawing

None.

## My notes

- Read at Kubernetes v1.36 docs.
