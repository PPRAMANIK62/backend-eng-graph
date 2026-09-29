---
id: man7-user-namespaces
title: user_namespaces(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/user_namespaces.7.html
kind: docs
primary: true
---

## Summary

How user namespaces work (man-pages 6.19): a process can be root inside
one and an ordinary user outside it, capabilities inside only apply to
resources the namespace owns, and `uid_map` maps IDs between a namespace
and its parent.

## Key claims

- Root inside, unprivileged outside. "a process can have a normal unprivileged user ID outside a user namespace while at the same time having a user ID of 0 inside the namespace; in other words, the process has full privileges for operations inside the user namespace, but is unprivileged for operations outside the namespace." (DESCRIPTION)
- Nesting limit of 32 levels since Linux 3.11. "The kernel imposes (since Linux 3.11) a limit of 32 nested levels of user namespaces." (Nested namespaces)
- The new process starts with every capability in the new namespace and none in the parent. "The child process created by clone(2) with the CLONE_NEWUSER flag starts out with a complete set of capabilities in the new user namespace." (Capabilities)
- Capabilities in a user namespace only reach resources that namespace governs. "Having a capability inside a user namespace permits a process to perform operations (that require privilege) only on resources governed by that namespace." (Effect of capabilities within a user namespace)
- Some operations, like loading a kernel module, need privilege in the initial namespace. "Only a process with privileges in the initial user namespace can perform such operations." (Effect of capabilities within a user namespace)
- With CAP_SYS_ADMIN in the owning user namespace a process can mount overlayfs since Linux 5.11. "overlayfs (since Linux 5.11)" (Effect of capabilities within a user namespace)
- A new user namespace starts with no ID mapping. "When a user namespace is created, it starts out without a mapping of user IDs (group IDs) to the parent user namespace." (User and group ID mappings)
- Each uid_map line maps a range. "Each line in the uid_map file specifies a 1-to-1 mapping of a range of contiguous user IDs between two user namespaces." (User and group ID mappings)
- Some privileged operations touch nothing namespaced, so user-namespace capabilities never reach them. "there are many privileged operations that affect resources that are not associated with any namespace type, for example, changing the system (i.e., calendar) time (governed by CAP_SYS_TIME), loading a kernel module (governed by CAP_SYS_MODULE), and creating a device (governed by CAP_MKNOD)." (Effect of capabilities within a user namespace)

## Visuals worth redrawing

None.

## My notes

- Pairs with sarai-runc-cve-2019-5736: the runc breakout was blocked
  when host root wasn't mapped into the container's user namespace.
