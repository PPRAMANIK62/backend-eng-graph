---
id: seccomp
title: seccomp
depth: short
phase: 14
note: >-
  A system call filter that limits what a container's processes can ask
  the kernel to do.
needs: [system-call, containers]
leads_to: []
compare_with: []
---

# seccomp

seccomp (secure computing mode) is a Linux filter on
[[system-call|system calls]]. A process installs a small program that
the kernel runs on every system call it makes, and that program decides:
allow it, fail it with an error, kill the process, or log it. Container
runtimes use it so that a process inside a [[containers|container]]
simply can't reach the parts of the kernel it has no business using.

## Why filter system calls at all

A container shares the host's kernel. [[linux-namespaces|Namespaces]]
change what a process can see, and [[linux-capabilities|capabilities]]
decide which privileged operations it may perform. But every system call
is still code running in the shared kernel, and the kernel has hundreds
of them. A bug in any one that a container can call is a way out.
seccomp shrinks that surface: calls the program never needs are
refused before any kernel code for them runs.

## How a filter works

The filter is a BPF program, the classic packet-filter language. For
every system call, the kernel hands it a small read-only record: the
system call number, the CPU architecture, the instruction pointer and
up to six arguments. The program returns an action:

| Action | Effect |
|---|---|
| `SECCOMP_RET_ALLOW` | Run the system call |
| `SECCOMP_RET_ERRNO` | Don't run it; return an error code instead |
| `SECCOMP_RET_KILL_PROCESS` | Kill the process |
| `SECCOMP_RET_LOG` | Run it, and log that it happened (Linux 4.14) |
| `SECCOMP_RET_USER_NOTIF` | Ask a supervisor process in user space to decide (Linux 5.0) |

Three rules make it useful for sandboxing:

- **It's inherited.** Children created with fork or clone get the same
  filters, and the filters survive `execve`. A container's first process
  installs the filter, and everything it starts is bound by it.
- **It stacks.** Installing another filter adds to the old ones; all of
  them run, newest first. A process can tighten its filter but never
  loosen it.
- **It needs permission.** Installing a filter needs `CAP_SYS_ADMIN` or
  the `no_new_privs` bit set first.

Nobody writes the BPF by hand. The libseccomp library generates it from
a list of rules, and runtimes take the rules as a JSON profile.

## Docker's default profile

Docker applies a default profile to every container unless you say
otherwise. It's an allow-list: the default action is to fail with
"Permission Denied", and a long list of system calls is explicitly
allowed. What's left out, around 44 of more than 300 system calls,
includes calls that reach kernel features not isolated by namespaces,
like `keyctl` (the kernel keyring), and calls already gated by a
capability, like `mount`. Some rules also look at arguments, allowing
only safe variants of a call.

Docker's docs advise against changing the default profile. You can
pass your own with `--security-opt seccomp=profile.json`, or turn it off
with `seccomp=unconfined`.

## Where it gets tricky

**Allow-lists beat deny-lists.** A deny-list has to be updated every
time the kernel adds a dangerous system call, and a value can often be
written another way that the list doesn't match. The man page recommends
allow-lists wherever possible.

**Some calls never reach the kernel.** On many architectures,
`clock_gettime`, `gettimeofday` and `time` run in user space through the
vDSO, so a filter on them has no effect.

**Arguments are just numbers.** The filter sees the raw argument values,
not the memory they point to, so it can check a flag but not a file
path.

**A too-tight profile breaks programs in odd ways.** A denied call
usually shows up as a strange "Permission denied" deep in some library.
The `LOG` action lets you find which calls a program really needs before
you enforce.

## What this means when you build

- Keep the runtime's default seccomp profile on; `unconfined` gives up
  a real layer of protection.
- For a service that needs less, generate a tighter allow-list from
  what it actually calls, first in log mode, then enforcing.
- Combine it with dropped capabilities and a user namespace; each
  covers what the others don't.

## Further reading

- [seccomp(2)](https://man7.org/linux/man-pages/man2/seccomp.2.html), man-pages 6.19. The filter data, the actions, inheritance, and the caveats (allow-lists, vDSO calls).
- [Seccomp security profiles for Docker](https://docs.docker.com/engine/security/seccomp/), Docker docs. The default profile, what it blocks and why, and how to replace it.
