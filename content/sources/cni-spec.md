---
id: cni-spec
title: Container Network Interface (CNI) Specification
author: CNI project (CNCF)
url: https://www.cni.dev/docs/spec/
kind: spec
primary: true
---

## Summary

The CNI specification, version 1.1.0: how a container runtime calls
plugin programs to give a container's network namespace an interface
and an address. Kubernetes network plugins on Linux are CNI plugins.

## Key claims

- Version. "This is CNI spec version 1.1.0." (Version)
- The protocol is running binaries. "The CNI protocol is based on execution of binaries invoked by the container runtime." (Section 2)
- What a plugin does. "A CNI plugin is responsible for configuring a container’s network interface in some manner." (Section 2)
- Interface plugins. "“Interface” plugins, which create a network interface inside the container and ensure it has connectivity." (Section 2)
- Chained plugins. "“Chained” plugins, which adjust the configuration of an already-created interface" (Section 2)
- How arguments are passed. "The runtime passes parameters to the plugin via environment variables and configuration. It supplies configuration via stdin." (Section 2)
- The runtime creates the namespace first. "The container runtime must create a new network namespace for the container before invoking any plugins." (Section 3)
- Operations include ADD and DEL. "ADD: Add container to network, or apply modifications" (Section 2, CNI operations)
- Address assignment is delegated to an IPAM plugin. "Dictionary with IPAM (IP Address Management) specific values" (Section 1)

## Visuals worth redrawing

None.

## My notes

- Spec 1.1.0, independent of the CNI library's own release numbers.
