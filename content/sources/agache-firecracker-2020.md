---
id: agache-firecracker-2020
title: "Firecracker: Lightweight Virtualization for Serverless Applications"
author: Alexandru Agache, Marc Brooker, Andreea Florescu, Alexandra Iordache, Anthony Liguori, Rolf Neugebauer, Phil Piwonka, Diana-Maria Popa (Amazon Web Services)
url: https://www.usenix.org/system/files/nsdi20-paper-agache.pdf
kind: paper
primary: true
---

## Summary

The NSDI 2020 paper by the AWS team that built Firecracker, the virtual
machine monitor behind Lambda and Fargate. It lays out the choice between
containers (one shared kernel, weaker isolation) and virtual machines
(strong isolation, more overhead), and explains how Firecracker keeps
KVM but replaces QEMU with a small Rust VMM, one process per microVM.

## Key claims

- The usual trade-off: VMs are secure but heavy, containers light but weaker. "The traditional view is that there is a choice between virtualization with strong security and high overhead, and container technologies with weaker security and minimal overhead." (Abstract)
- Firecracker is a new VMM. "we developed Firecracker, a new open source Virtual Machine Monitor (VMM) specialized for serverless workloads" (Abstract)
- Containers rely on one shared kernel, which forces a security vs compatibility trade-off. "their reliance on a single operating system kernel means that there is a fundamental tradeoff between security and code compatibility." (1 Introduction)
- Firecracker keeps KVM and replaces QEMU. "With Firecracker, we chose to keep KVM, but entirely replace QEMU to build a new Virtual Machine Monitor (VMM), device model, and API for managing and configuring MicroVMs." (1 Introduction)
- Headline numbers, with the provided minimal guest kernel config. "it offers memory overhead of less than 5MB per container, boots to application code in less than 125ms, and allows creation of up to 150 MicroVMs per second per host." (1 Introduction)
- QEMU is large. "it is a large project (> 1.4 million LOC as of QEMU 4.2)" (1 Introduction)
- What it leaves out. "It does not offer a BIOS, cannot boot arbitrary kernels, does not emulate legacy devices nor PCI, and does not support VM migration." (1.1 Specialization)
- It replaces QEMU, not Docker or Kubernetes. "it replaces QEMU, rather than Docker or Kubernetes, in the container stack." (1.1 Specialization)
- Lambda first used containers inside per-customer VMs. "we chose to use Linux containers to isolate functions, and virtualization to isolate between customer accounts." (2 Choosing an Isolation Solution)
- In containers, untrusted code calls the host kernel directly; in a VM it talks to its own guest kernel, which is treated as untrusted. "In Linux containers, untrusted code calls the host kernel directly, possibly with the kernel surface area restricted (such as with seccomp-bpf)." (2.1)
- The guest kernel is untrusted and fenced by hardware and the VMM. "Hardware virtualization and the VMM limit the guest kernel's access to the privileged domain and host kernel." (2.1)
- seccomp-bpf is the main container security boundary. "seccomp-bpf provides the most important security isolation boundary." (2.1.1)
- Virtualization gives each sandbox its own virtual hardware, page tables and kernel. "Modern virtualization uses hardware features (such as Intel VT-x) to provide each sandbox an isolated environment with its own virtual hardware, page tables, and operating system kernel." (2.1.3)
- Typical VM start is in seconds. "Another challenge is startup time, with typical VM startup times in the range of seconds." (2.1.3)
- Type 1 vs type 2. "VMMs still need to either provide some OS functionality themselves (type 1) or depend on the host operating system (type 2) for functionality." (2.1.3)
- About 50k lines of Rust. "Firecracker contains approximately 50k lines of Rust code (96% fewer lines than QEMU)" (2.1.3)
- The security boundary moves to hardware plus a small VMM. "it moves the security-critical interface from the OS boundary to a boundary supported in hardware and comparatively simpler software." (2.1.3)
- One process per microVM. "One Firecracker process runs per MicroVM, providing a simple model for security isolation." (3)
- It leans on Linux for scheduling, memory and TAP networking. "depend on Linux's process scheduler and memory manager for handling contention between VMs in CPU and memory, and we use TUN/TAP virtual network interfaces." (3)
- MicroVMs show up in ps. "running ps on a Firecracker host will include all the MicroVMs on the host in the process list" (3)
- Standard tools work on microVMs. "tools like top, vmstat and even kill work as operators expect." (3)
- Stopping a microVM is killing its process. "To shut down the MicroVM, it is sufficient to kill the Firecracker process, or issue a reboot inside the guest." (3.2)
- No orchestration or packaging. "Firecracker's process-per-VM model also means that it doesn't offer VM orchestration, packaging, management or other features" (1.1 Specialization)
- A VMM is much smaller than a kernel. "VMMs are much smaller than general-purpose OS kernels, exposing a small number of well-understood abstractions without compromising on software compatibility or requiring software to be modified." (2.1.3)
- The guest kernel keeps its full feature set. "the guest kernel can supply its full feature set with no change to the threat model." (2.1.3)
- Side-channel mitigations include turning off SMT. "Mitigations include disabling Symmetric MultiThreading (SMT, aka HyperThreading)" (3.4)
- In Lambda each microVM is one slot, and a slot serves one function. "Slots are only ever used for a single function, and a single concurrent invocation of that function" (4.1)
- Many microVMs per worker. "Each worker runs hundreds or thousands of MicroVMs (each providing a single slot)" (4.1)
- Few devices, virtio for network and block. "Firecracker provides a limited number of emulated devices: network and block devices, serial ports, and partial i8042 (PS/2 keyboard controller) support." (3.1)
- The jailer wraps the VMM in namespaces, chroot and seccomp. "including running it in a chroot, isolating it in pid and network namespaces, dropping privileges, and setting a restrictive seccomp-bpf profile." (3.4.1)
- Network and block devices are virtio. "We use virtio [40, 48] for network and block devices, an open API for exposing emulated devices from hypervisors." (3.1)
- No single layer stops every side channel. "With existing CPU capabilities, no single layer can mitigate all these attacks, so mitigations need to be built into multiple layers of the system." (3.4)

## Visuals worth redrawing

- Figure 1: the container model (untrusted code on the host kernel inside a
  sandbox) next to the KVM model (untrusted code on a guest kernel, then the
  VMM in a sandbox, then KVM and the host kernel).

## My notes

- The 125 ms / 5 MB / 150 per second numbers are the paper's (2020), for a
  minimal guest kernel. Later versions may differ.
