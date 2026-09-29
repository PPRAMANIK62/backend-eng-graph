---
id: kernel-kvm-api
title: The Definitive KVM (Kernel-based Virtual Machine) API Documentation
author: Linux kernel documentation
url: https://docs.kernel.org/virt/kvm/api.html
kind: docs
primary: true
---

## Summary

The kernel's reference for the KVM API. A VM is driven from user space
through file descriptors and ioctls on /dev/kvm: create a VM, create
vCPUs, then call KVM_RUN on each vCPU until the guest does something the
kernel can't handle alone (like device I/O), which comes back to user
space as an exit.

## Key claims

- The API is file descriptors and ioctls, starting from /dev/kvm. "The kvm API is centered around different kinds of file descriptors and ioctls that can be issued to these file descriptors." (1. General description)
- VM and vCPU file descriptors. "A KVM_CREATE_VM ioctl on this handle will create a VM file descriptor which can be used to issue VM ioctls." (1. General description)
- VM ioctls belong to the process that made the VM. "VM ioctls must be issued from the same process (address space) that was used to create the VM." (1. General description)
- vCPU ioctls come from the thread that made the vCPU. "vcpu ioctls should be issued from the same thread that was used to create the vcpu" (1. General description)
- KVM_RUN runs a guest vCPU. "This ioctl is used to run a guest virtual cpu." (4.10 KVM_RUN)
- A port I/O instruction the kernel can't satisfy exits to user space. "If exit_reason is KVM_EXIT_IO, then the vcpu has executed a port I/O instruction which could not be satisfied by kvm." (5. The kvm_run structure)
- Same for memory-mapped I/O. "If exit_reason is KVM_EXIT_MMIO, then the vcpu has executed a memory-mapped I/O instruction which could not be satisfied by kvm." (5. The kvm_run structure)
- vCPUs are created on the VM fd and each gets its own fd. "A KVM_CREATE_VCPU or KVM_CREATE_DEVICE ioctl on a VM fd will create a virtual cpu or device and return a file descriptor pointing to the new resource." (1. General description)

## Visuals worth redrawing

None.

## My notes

- Together with the Firecracker paper: a VMM is a normal process, each
  vCPU a thread sitting in KVM_RUN, and device emulation happens in that
  process when the guest exits.
