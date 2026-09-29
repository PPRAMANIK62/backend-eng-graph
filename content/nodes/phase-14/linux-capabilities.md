---
id: linux-capabilities
title: Linux capabilities
depth: short
phase: 14
note: >-
  Root's power split into separate privileges, so a process can have
  some of them without being full root.
needs: [process, containers]
leads_to: []
compare_with: []
---

# Linux capabilities

In traditional Unix there are two kinds of [[process]]: root,
which bypasses every permission check, and everyone else, who is
checked. Since Linux 2.2, root's powers are split into separate units
called capabilities, which can be switched on and off one by one. A web
server that only needs to listen on port 80 can be given exactly that
power, without also being able to load kernel modules or reformat
disks. [[containers|Container]] runtimes use capabilities to make "root inside a
container" much weaker than root on the host.

## Root, split into pieces

Each capability names one privileged operation, or a family of them.
A few examples:

| Capability | Allows |
|---|---|
| `CAP_NET_BIND_SERVICE` | Binding to ports below 1024 |
| `CAP_NET_RAW` | Raw and packet sockets (ping, packet capture) |
| `CAP_CHOWN` | Changing any file's owner |
| `CAP_KILL` | Sending signals to any process |
| `CAP_SYS_ADMIN` | A huge grab bag: mounting, many admin operations |

`CAP_SYS_ADMIN` is famously overloaded. Newer kernels keep carving
pieces off it into their own capabilities, like `CAP_BPF` for eBPF and
`CAP_PERFMON` (Linux 5.8) for performance monitoring, so that tools can
be given just what they need.

## Sets, per thread

Capabilities belong to threads, and each thread has several sets. The
two that matter most:

- **Permitted:** the capabilities the thread may use at all. It's the
  ceiling.
- **Effective:** the capabilities the kernel checks right now, drawn
  from the permitted set.

Others govern what survives running a new program. The **bounding**
set caps what any program can ever gain, and a process can drop
capabilities from it permanently. The **ambient** set (Linux 4.3) keeps
capabilities across `execve` of an ordinary, non-privileged program,
which is how you give a service one capability without making its binary
special.

## What a container gets

Docker starts containers "unprivileged": with a default list of
capabilities kept and the rest dropped. The default keeps things like
`CHOWN`, `DAC_OVERRIDE` (bypass file permission checks), `KILL`,
`NET_BIND_SERVICE`, `NET_RAW`, `SETUID` and `SETGID`, and leaves out
powerful ones such as `SYS_ADMIN`. You adjust it with `--cap-drop` and
`--cap-add`, both of which accept `ALL`.

`--privileged` is the opposite. It gives the container every
capability, access to all host devices, and relaxes AppArmor or SELinux
so it has nearly the same access as a process running on the host. At
that point the container is a namespace wrapper around full root.

## Where it gets tricky

**The default is still generous.** A service that needs none of the
default capabilities still gets them. `DAC_OVERRIDE` lets a root process in the
container ignore file permissions, and `NET_RAW` lets it craft raw
packets. Dropping all and adding back only what's needed shrinks what an
attacker gets.

**Capabilities and user namespaces combine.** Inside a user namespace,
a process can hold capabilities that only apply to resources that
namespace owns (see [[linux-namespaces]]). "Root with all capabilities"
inside a rootless container is much less than root on the host.

**They don't limit system calls.** A capability check happens inside a
system call that's already running. To stop a process from calling
something at all, you need [[seccomp]]. The two overlap on purpose:
Docker's seccomp profile blocks `mount`, which is already gated by
`CAP_SYS_ADMIN`.

## What this means when you build

- Run containers with `--cap-drop=ALL` and add back only what the
  service needs, often nothing, or just `NET_BIND_SERVICE`.
- Never use `--privileged` for an application container.
- Outside containers, give a service a single capability (for example
  through its service manager's ambient capabilities) instead of running
  it as root.

## Further reading

- [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html), man-pages 6.19. The list of capabilities, the thread capability sets, and how they change across execve.
- [Running containers](https://docs.docker.com/engine/containers/run/), Docker docs. The capabilities a container keeps by default, --cap-add and --cap-drop, and what --privileged grants.
