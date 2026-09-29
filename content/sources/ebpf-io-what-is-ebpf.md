---
id: ebpf-io-what-is-ebpf
title: What is eBPF?
author: eBPF.io (eBPF Foundation community site)
url: https://ebpf.io/what-is-ebpf/
kind: docs
primary: true
---

## Summary

The introduction on the eBPF community's own site: what eBPF is, the
hooks programs attach to, how programs are written and loaded, the
verifier, JIT compilation, maps, helper calls, the safety layers and the
main toolchains (bcc, bpftrace, libbpf, the Go library). Marked primary
because it's written by the eBPF project community itself; it's also
promotional in places.

## Key claims

- What it is. "eBPF is a revolutionary technology with origins in the Linux kernel that can run sandboxed programs in a privileged context such as the operating system kernel." (What is eBPF?)
- Extends the kernel without changing its source or loading modules. "It is used to safely and efficiently extend the capabilities of the kernel without requiring to change kernel source code or load kernel modules." (What is eBPF?)
- Uses beyond tracing include networking and load balancing, and security. "Providing high-performance networking and load-balancing in modern data centers and cloud native environments" (What is eBPF?)
- The name no longer stands for anything; BPF and eBPF are used interchangeably; the original is cBPF. "eBPF is now considered a standalone term that doesn’t stand for anything." (What do eBPF and BPF stand for?)
- Programs are event-driven and run at hooks. "eBPF programs are event-driven and are run when the kernel or an application passes a certain hook point." (Hook Overview)
- Hooks include syscalls, function entry and exit, tracepoints and network events; kprobes and uprobes attach almost anywhere. "it is possible to create a kernel probe (kprobe) or user probe (uprobe) to attach eBPF programs almost anywhere in kernel or user applications." (Hook Overview)
- Usually used through bcc, bpftrace or Cilium rather than written directly. "In a lot of scenarios, eBPF is not used directly but indirectly via projects like Cilium, bcc, or bpftrace" (How are eBPF programs written?)
- Loaded as bytecode, usually compiled from restricted C with LLVM. "the more common development practice is to leverage a compiler suite like LLVM to compile pseudo-C code into eBPF bytecode." (How are eBPF programs written?)
- Loaded with the bpf system call. "the eBPF program can be loaded into the Linux kernel using the bpf system call." (Loader & Verification Architecture)
- The verifier checks the program runs to completion. "The program always runs to completion (i.e. the program does not sit in a loop forever, holding up further processing)." (Verification)
- Bounded loops are allowed only if the verifier can prove they exit. "eBPF programs may contain so called bounded loops but the program is only accepted if the verifier can ensure that the loop contains an exit condition which is guaranteed to become true." (eBPF Safety, Verifier)
- No uninitialized variables or out-of-bounds access. "Programs may not use any uninitialized variables or access memory out of bounds." (eBPF Safety, Verifier)
- Size and complexity are limited. "The verifier will evaluate all possible execution paths and must be capable of completing the analysis within the limits of the configured upper complexity limit." (eBPF Safety, Verifier)
- The verifier is about safety, not about intent. "The verifier is meant as a safety tool, checking that programs are safe to run. It is not a security tool inspecting what the programs are doing." (eBPF Safety, Verifier)
- JIT makes it run like native kernel code. "This makes eBPF programs run as efficiently as natively compiled kernel code or as code loaded as a kernel module." (JIT Compilation)
- Maps share data between programs and user space. "eBPF maps can be accessed from eBPF programs as well as from applications in user space via a system call." (Maps)
- Map types include hash tables, arrays, LRU, ring buffer, stack trace, LPM. (Maps)
- Programs can't call arbitrary kernel functions, only a stable set of helpers. "eBPF programs cannot call into arbitrary kernel functions." (Helper Calls)
- Loading needs root or CAP_BPF unless unprivileged eBPF is enabled. "all processes that intend to load eBPF programs into the Linux kernel must be running in privileged mode (root) or require the capability CAP_BPF." (eBPF Safety, Required Privileges)
- The old choices were a kernel change (then wait years) or a kernel module (fix it every release, and risk crashing the kernel). "Risk corrupting your Linux kernel due to lack of security boundaries" (eBPF's impact on the Linux Kernel)
- bpftrace is a high-level tracing language inspired by awk, C, DTrace and SystemTap. "The bpftrace language is inspired by awk, C, and predecessor tracers such as DTrace and SystemTap." (Development Toolchains)
- A kernel change means waiting years to reach users. "Wait several years for the new kernel version to become a commodity." (eBPF's impact on the Linux Kernel)
- bcc wraps eBPF in Python programs. "BCC is a framework that enables users to write python programs with eBPF programs embedded inside them." (Development Toolchains)
- Libraries for your own tools: the eBPF Go library and libbpf for C/C++. "The libbpf library is a C/C++-based generic eBPF library" (Development Toolchains)

## Visuals worth redrawing

- The loader and verification architecture diagram (program, verifier,
  JIT, hook, maps).

## My notes

- Promotional tone in places; use it for mechanism, not for judgements.
