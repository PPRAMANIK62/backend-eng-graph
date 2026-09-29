---
id: gvisor-docs
title: What is gVisor?
author: gVisor authors (Google)
url: https://gvisor.dev/docs/
kind: docs
primary: true
---

## Summary

gVisor's own overview: an application kernel, written in Go and running
in user space, that sits between containers and the host kernel. It
ships an OCI runtime, runsc, so existing tools can use it.

## Key claims

- What it is. "It is an application kernel that implements a Linux-like interface." (What is gVisor?)
- Written in Go, in user space. "Unlike Linux, it is written in a memory-safe language (Go) and runs in userspace." (What is gVisor?)
- It's an OCI runtime. "gVisor includes an Open Container Initiative (OCI) runtime called runsc that makes it easy to work with existing container tooling." (What is gVisor?)
- The idea. "The system interfaces normally implemented by the host kernel are moved into a distinct, per-sandbox application kernel in order to minimize the risk of a container escape exploit." (What does gVisor do?)
- Not a filter, not a VM. "gVisor is not a syscall filter (e.g. seccomp-bpf), nor a wrapper over Linux isolation primitives" (How is this different?)
- VMs isolate well but cost more for containers. "for containers it often requires additional proxies and agents, and may require a larger resource footprint and slower start-up times." (How is this different?)
- Rule-based sandboxes are hard to get right for unknown apps. "in practice it can be extremely difficult (if not impossible) to reliably define a policy for arbitrary, previously unknown applications" (How is this different?)

## Visuals worth redrawing

- The three approaches: machine-level virtualization, rule-based
  execution, and gVisor's application kernel.

## My notes

- Vendor docs; no performance numbers taken from here.
