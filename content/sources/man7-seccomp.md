---
id: man7-seccomp
title: seccomp(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/seccomp.2.html
kind: docs
primary: true
---

## Summary

The system call that restricts which system calls a thread may make
(man-pages 6.19). In filter mode a small BPF program looks at each
system call number and its arguments and decides whether to allow it.
Container runtimes use it to shrink the kernel surface a container can
reach.

## Key claims

- Strict mode allows only read, write, _exit and sigreturn. "The only system calls that the calling thread is permitted to make are read(2), write(2), _exit(3) (but not exit_group(2)), and sigreturn(2)." (DESCRIPTION, SECCOMP_SET_MODE_STRICT)
- Filter mode: allowed system calls are defined by a BPF program. "The system calls allowed are defined by a pointer to a Berkeley Packet Filter (BPF) passed via args." (DESCRIPTION, SECCOMP_SET_MODE_FILTER)
- Using a filter needs CAP_SYS_ADMIN or no_new_privs. "In order to use the SECCOMP_SET_MODE_FILTER operation, either the calling thread must have the CAP_SYS_ADMIN capability in its user namespace, or the thread must already have the no_new_privs bit set." (DESCRIPTION)
- What a filter sees. The BPF program reads "struct seccomp_data" holding the system call number, the architecture, the instruction pointer and "args[6]; /* Up to 6 system call arguments */" (DESCRIPTION, filter return values)
- Filters are inherited. "If fork(2) or clone(2) is allowed by the filter, any child processes will be constrained to the same system call filters as the parent." (DESCRIPTION)
- And survive exec. "If execve(2) is allowed, the existing filters will be preserved across a call to execve(2)." (DESCRIPTION)
- Several filters all run, newest first. "If multiple filters exist, they are all executed, in reverse order of their addition to the filter tree—that is, the most recently installed filter is executed first." (DESCRIPTION)
- ERRNO action: fail the call without running it. "This value results in the SECCOMP_RET_DATA portion of the filter's return value being passed to user space as the errno value without executing the system call." (SECCOMP_RET_ERRNO)
- USER_NOTIF: ask a user-space supervisor. "Forward the system call to an attached user-space supervisor process to allow that process to decide what to do with the system call." (SECCOMP_RET_USER_NOTIF, since Linux 5.0)
- LOG: run it but log it. "This value results in the system call being executed after the filter return action is logged." (SECCOMP_RET_LOG, since Linux 4.14)
- Prefer allow-lists. "use an allow-list approach whenever possible because such an approach is more robust and simple." (NOTES)
- Why deny-lists fail. "A deny-list will have to be updated whenever a potentially dangerous system call is added" (NOTES)
- vDSO calls bypass the filter. "On such architectures, seccomp filtering for these system calls will have no effect." (Caveats; clock_gettime, gettimeofday, time)
- libseccomp exists so you don't hand-write BPF. "Rather than hand-coding seccomp filters as shown in the example below, you may prefer to employ the libseccomp library" (NOTES)

## Visuals worth redrawing

None.

## My notes

- The filter sees the system call number and arguments (struct
  seccomp_data), not memory the arguments point to.
