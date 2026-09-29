---
id: man7-mount-namespaces
title: mount_namespaces(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/mount_namespaces.7.html
kind: docs
primary: true
---

## Summary

How mount namespaces work (man-pages 6.19): each has its own list of
mounts, a new one starts as a copy of its parent's, and shared subtrees
(Linux 2.6.15) let mount events propagate between namespaces on purpose.

## Key claims

- Each namespace has its own mount list. "Mount namespaces provide isolation of the list of mounts seen by the processes in each namespace instance." (DESCRIPTION)
- A new namespace starts as a copy. "If the namespace is created using unshare(2), the mount list of the new namespace is a copy of the mount list in the caller's previous mount namespace." (DESCRIPTION)
- Later mounts don't cross over by default. "Subsequent modifications to the mount list (mount(2) and umount(2)) in either mount namespace will not (by default) affect the mount list seen in the other namespace" (DESCRIPTION)
- Shared subtrees came in Linux 2.6.15 because full isolation was sometimes too much. "the shared subtree feature was introduced in Linux 2.6.15." (SHARED SUBTREES)

## Visuals worth redrawing

None.

## My notes

- Propagation types (shared, private, slave, unbindable) are a rabbit
  hole; a container runtime usually makes its mounts private before
  changing root, which pivot_root requires anyway (man7-pivot-root).
