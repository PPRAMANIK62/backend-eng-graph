---
id: virtual-machines
title: Virtual machines and microVMs
depth: short
phase: 14
note: >-
  A guest kernel on virtual hardware, walled off by the CPU and a small
  monitor process; microVMs like Firecracker make one per workload cheap.
needs: [process]
leads_to: []
compare_with: [containers]
---


# Virtual machines and microVMs

A virtual machine runs its own operating system kernel on virtual
hardware, kept apart from the host by the CPU's virtualization support
and a small program called a virtual machine monitor. That's a much
stronger wall than a [[containers|container]], which shares the host's
kernel. MicroVMs, like AWS's Firecracker, cut a VM down far enough that
you can afford one per function or per container.

## A VM is a process with a kernel inside

On Linux, the kernel's KVM module does the hardware part. A virtual
machine monitor (VMM), such as QEMU or Firecracker, is an ordinary
user-space [[process]] that drives it:

1. It opens `/dev/kvm` and asks for a new VM. It gets back a file
   descriptor for that VM.
2. It creates virtual CPUs for that VM, each with its own file
   descriptor.
3. For each virtual CPU, one [[thread]] calls the `KVM_RUN` ioctl. The
   guest's code now runs on the real CPU, with its own page tables and
   its own kernel, and the hardware's virtualization support (Intel
   VT-x, for example) keeps it in its box. It runs until it does
   something KVM can't handle alone.
4. Device I/O is the usual reason. When the guest touches a virtual
   disk or network card, `KVM_RUN` returns to the VMM with the details.
   The VMM emulates the device (Firecracker, for example, hands network
   traffic to a [[tun-tap|TAP device]] on the host) and calls
   `KVM_RUN` again.

So from the host's side, a VM is just a process with a few threads.
`ps` lists it, `top` and `vmstat` work on it, and killing the process
shuts the VM down. The guest inside sees a whole machine.

![Two stacks side by side. In the container model, untrusted code runs in a sandbox and makes system calls straight into the shared host kernel. In the VM model, untrusted code talks to its own guest kernel; the guest kernel's device accesses go to the VMM, which runs in its own sandbox, and the VMM uses KVM in the host kernel.](img/virtual-machines-isolation.svg)

*In a container the host kernel is the wall. In a VM the wall is the hardware plus a small VMM. Adapted from Agache et al., "Firecracker: Lightweight Virtualization for Serverless Applications", figure 1 (NSDI 2020).*

## Why the wall is stronger

In a container, untrusted code makes [[system-call|system calls]] into
the same kernel as everyone else. The main defence is limiting which
calls it may make (with seccomp), and every call you block is one some
program might need. That's a trade between security and compatibility.

In a VM, the guest can use every feature of its own kernel. The guest
kernel is treated as untrusted too. What stands between it and the host
is the hardware's virtualization support and the VMM, which is far
smaller than a general-purpose kernel.

## What a microVM leaves out

The cost of a classic VM is size and speed. Starting one typically
takes seconds. QEMU, the usual VMM, is over 1.4 million lines of code
(as of QEMU 4.2) because it emulates a long list of devices and
features.

Firecracker keeps KVM and replaces QEMU with about 50,000 lines of
Rust. It has no BIOS, no PCI, no legacy devices and no VM migration.
It offers a virtio network device, a virtio block device, a serial port
and not much else. One Firecracker process runs one microVM. With a
minimal Linux guest, the 2020 paper reports under 5 MB of memory
overhead per VM, boot to application code in under 125 ms, and up to
150 new microVMs per second on one host.

That's what let AWS Lambda change its design. It first ran functions
as containers, with a VM around each customer. With Firecracker, each
worker runs hundreds or thousands of microVMs, and each microVM only
ever serves one function.

## Where it gets tricky

**A microVM doesn't replace your container tools.** Firecracker takes
QEMU's place, not Docker's or Kubernetes'. Something still has to pull
images, schedule and wire up networks.

**The VMM needs a sandbox too.** A bug in the VMM could let a guest
reach the host. Firecracker runs its VMM inside a jailer that uses
exactly the container tools: a chroot, PID and network
[[linux-namespaces|namespaces]], dropped privileges and a tight seccomp
filter. VMs and containers get layered, not picked between.

**Hardware still leaks.** A VM doesn't stop every side channel between
neighbours on the same CPU. Firecracker's production guidance includes
host-level mitigations, like turning off simultaneous multithreading.

## What this means when you build

- For code you trust, containers are enough and cheaper. For code you
  don't, like customer code on shared machines, put a VM boundary
  under it.
- A VM on Linux is a process. The usual tools (`ps`, `top`, `kill`)
  work on it from the host.
- MicroVMs trade features for startup time and density. If you need
  arbitrary guest kernels, PCI devices or migration, you need a full
  VMM.

## Further reading

- [Firecracker: Lightweight Virtualization for Serverless Applications](https://www.usenix.org/system/files/nsdi20-paper-agache.pdf), Alexandru Agache and others, AWS, NSDI 2020. Containers vs VMs for untrusted code, and how a minimal VMM on KVM gets close to container overhead.
- [The Definitive KVM API Documentation](https://docs.kernel.org/virt/kvm/api.html), Linux kernel documentation. The VM and vCPU file descriptors, `KVM_RUN`, and the exits that hand I/O to user space.
