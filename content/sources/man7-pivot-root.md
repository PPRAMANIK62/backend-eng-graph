---
id: man7-pivot-root
title: pivot_root(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/pivot_root.2.html
kind: docs
primary: true
---

## Summary

The system call that swaps the root mount of a mount namespace
(man-pages 6.19). Used at boot to leave the initrd, and by container
runtimes to switch into the container's root filesystem.

## Key claims

- What it does. "pivot_root() changes the root mount in the mount namespace of the calling process." (DESCRIPTION)
- The shared-propagation restriction keeps it inside the namespace. "These restrictions ensure that pivot_root() never propagates any changes to another mount namespace." (DESCRIPTION)
- Container setup is a modern use. "A modern use is to set up a root filesystem during the creation of a container." (NOTES)
- The old root can then be unmounted. "pivot_root() allows the caller to switch to a new root filesystem while at the same time placing the old root mount at a location under new_root from where it can subsequently be unmounted." (NOTES)
- The mounts involved must not be shared, which is why runtimes make them private first. "The propagation type of the parent mount of new_root and the parent mount of the current root directory must not be MS_SHARED" (DESCRIPTION, restrictions)

## Visuals worth redrawing

None.

## My notes

- Compare with chroot, which only changes one process's root directory
  and leaves the old root mounted.
