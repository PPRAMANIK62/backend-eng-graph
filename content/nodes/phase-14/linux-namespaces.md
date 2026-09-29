---
id: linux-namespaces
title: Linux namespaces
depth: deep
phase: 14
note: >-
  Giving a process its own view of PIDs, network, mounts and users.
needs: [process]
leads_to: [containers]
compare_with: [cgroups]
---

# Linux namespaces

A namespace gives a group of [[process|processes]] their own private copy
of something that's normally global to the whole machine: the list of
process IDs, the network stack, the mounted filesystems, the hostname,
the user IDs. The processes inside see their copy and nothing else. This
is most of what makes a container feel like a separate machine, and it's
also a tool you can use on its own, for example to run a test in a
network with no way out.

## One process, two views

Start with something you can picture. You run a web server on a Linux
host, and on the host it shows up in `ps` as PID 4200. Now run the same
server inside a container. From the host, it's still an ordinary process
with an ordinary host PID. From inside the container, `ps` shows only a
handful of processes, and the server is PID 1.

Both views are true at the same time. The kernel keeps one process, but
it gives that process a separate PID number space to live in, and
translates between the two. That's a namespace: the kernel wraps a
global resource so that the processes inside it seem to have their own
isolated instance of it. Changes inside are visible to the other members
and invisible to everyone else.

Linux has eight kinds, each wrapping a different resource:

| Namespace | Flag | What gets its own copy |
|---|---|---|
| Mount | `CLONE_NEWNS` | the list of mount points |
| UTS | `CLONE_NEWUTS` | hostname and NIS domain name |
| IPC | `CLONE_NEWIPC` | System V IPC and POSIX message queues |
| PID | `CLONE_NEWPID` | process IDs |
| Network | `CLONE_NEWNET` | network devices, IP stacks, routes, firewall rules, ports |
| User | `CLONE_NEWUSER` | user and group IDs, and capabilities |
| Cgroup | `CLONE_NEWCGROUP` | the view of the [[cgroups|cgroup]] tree |
| Time | `CLONE_NEWTIME` | the boot and monotonic clocks |

They arrived one at a time. Mount namespaces came first, in Linux 2.4.19
(2002), back when nobody expected other kinds; that's why the flag is
just `NEWNS`, "new namespace". UTS and IPC followed in 2.6.19, PID in
2.6.24, network was started in 2.6.24 and mostly done by about 2.6.29,
and user namespaces were finished in 3.8. Cgroup namespaces were in
place by Linux 4.6 and time namespaces by 5.6.

![Two columns, host view on the left and container view on the right, one row per namespace. PID: the host sees the web server as PID 4200 among all processes; inside it is PID 1 and sees only its own processes. Network: the host has eth0 and its own routes; inside there is only lo and one end of a veth pair, with its own port 80. Mount: the host sees its full tree; inside, / is the container's root filesystem. UTS: host hostname versus the container's own hostname. User: UID 100000 on the host maps to UID 0 inside.](img/linux-namespaces-two-views.svg)

*The same process, seen from the host and from inside its namespaces. The PIDs, names and UIDs are made-up examples.*

## Three system calls

The whole API is small. There are three calls that create or join
namespaces, and each namespace type is picked by one of the `CLONE_NEW*`
flags:

- **`clone`** creates a new process. Pass it one or more `CLONE_NEW*`
  flags and the child starts life in fresh namespaces of those types.
- **`unshare`** moves the calling process into new namespaces, without
  creating a child.
- **`setns`** joins a namespace that already exists. You name it with a
  [[file-descriptor|file descriptor]] for one of the files under `/proc/<pid>/ns/`.

Those `/proc/<pid>/ns/` files are handles, one per namespace type. If two
processes show the same inode number there, they're in the same
namespace. Holding one of those files open, or bind-mounting it
somewhere, keeps a namespace alive after its last process has gone.
Otherwise a namespace disappears when the last process in it exits or
leaves. That's how `ip netns add` makes a network namespace that sits
there empty, waiting for you to run something in it: it bind-mounts the
handle under `/var/run/netns`.

Creating most namespace types needs `CAP_SYS_ADMIN`, because whoever
creates a namespace gets power over resources that every process later
started in it, or joining it, will see. The exception is user namespaces:
since Linux 3.8 any process can create one.

## PID namespaces: a private PID 1

A new PID namespace starts numbering at 1, like a freshly booted
system. The first process in it becomes that namespace's init, and init
has special jobs and special rules:

- **It adopts orphans.** When a process in the namespace dies and leaves
  children behind, they're reparented to this init, which is expected to
  reap them when they exit.
- **Its death ends everything.** If init exits, the kernel sends SIGKILL
  to every other process in the namespace.
- **It ignores signals it didn't ask for.** Other processes in the
  namespace can only send init the [[signals]] it has installed a handler
  for. SIGKILL and SIGSTOP from an ancestor namespace still go through.

That last rule surprises people. If your server runs as PID 1 in a
container and never installs a SIGTERM handler, a SIGTERM sent to it is
simply ignored, and a clean shutdown turns into a SIGKILL after the
timeout. [[graceful-shutdown]] covers what to do about it.

PID namespaces nest. Every namespace except the root one has a parent,
and a process has a PID at each level from its own namespace up to the
root: 1 inside the container, 4200 on the host. A process can see and
signal processes in its own namespace and in namespaces below it, never
above. The nesting depth is limited to 32 since Linux 3.7.

Two details to know if you build this yourself. `unshare(CLONE_NEWPID)`
doesn't move the caller, because its own PID can't change under it;
only its next child lands in the new namespace, as PID 1. And `/proc`
shows the PIDs of whichever namespace mounted it, so until you mount a
fresh `/proc` inside, `ps` still lists the host's processes.

## Network namespaces: a separate network stack

A network namespace gets its own network devices, IPv4 and IPv6 stacks,
routing tables, firewall rules and port numbers. So two containers can
each bind port 80 on the same host with no conflict: each port 80 lives
in a different namespace. It's all one kernel; the namespace just keeps
separate tables.

A brand-new network namespace has only a loopback device, and even that
starts down. To talk to anything you create a **veth pair**, two virtual
Ethernet devices joined like a pipe: packets sent into one end come out
the other. You leave one end on the host and move the other into the
namespace, give both addresses, and they can reach each other. Reaching
the internet takes one more step on the host side, either a bridge or IP
forwarding with [[nat|NAT]]. This is exactly the plumbing a container
runtime sets up for you, and the starting point for
[[kubernetes-networking]]. A physical device can belong to only one
namespace at a time.

The empty namespace is also useful by itself. A process in a network
namespace with no devices can't open connections to anything, even if
it's compromised.

## Mount namespaces: a private filesystem tree

A mount namespace has its own list of mounts. When you create one, it
starts as a copy of the parent's list; after that, mounts and unmounts
on either side don't affect the other. (Shared subtrees, added in Linux
2.6.15, let you opt back in to propagating mounts between namespaces,
which is how a disk mounted on the host can show up inside.)

This is how a container gets its own root filesystem. The runtime
creates a mount namespace, mounts the image's files (usually through
[[overlayfs]]) and then calls `pivot_root`, which swaps the root mount
of that namespace for the new one and puts the old root somewhere it can
be unmounted. Mount namespaces are a safer and more flexible tool for
this than the old `chroot` call.

## User namespaces: root inside, nobody outside

A user namespace maps user and group IDs between itself and its parent.
Each line in `/proc/<pid>/uid_map` maps a contiguous range: for example,
UIDs 0 to 65535 inside might be UIDs 100000 to 165535 on the host. A
process can then be UID 0 in the namespace while being an unprivileged
user outside it.

Being root inside comes with a full set of [[linux-capabilities|capabilities]], but only over
resources that namespace owns: the network, mount and other namespaces
created under it. Anything not tied to a namespace, like loading a
kernel module, setting the system clock or creating device files, still
needs privilege in the initial namespace. That's the point: a user
namespace is what lets an ordinary user build every other kind of
namespace and run a container without being root on the host. Since
Linux 5.11, root inside a user namespace can also mount overlayfs.

## Where it gets tricky

**Namespaces hide things; they don't limit them.** A process in its own
PID namespace can still eat all the memory and CPU on the host.
Namespaces decide what a process can see, [[cgroups]] decide how much it
can use. A container needs both, and they're independent kernel
features.

**Not everything is namespaced.** The kernel itself is shared by every
namespace. Operations that aren't tied to any namespace, like loading a
kernel module or setting the system clock, act on the whole machine and
need privilege in the initial namespace. That's why
isolation between namespaces is weaker than between
[[virtual-machines]], a point [[containers]] picks up.

**User namespaces cut both ways.** They make containers safer, because
root in the container isn't root on the host. They also let any
unprivileged user reach kernel code that used to be root-only. When
they were completed in Linux 3.8, the changes were already known to be
subtle and wide-ranging, with security bugs possibly still to be found.
The files in `/proc/sys/user/` (since Linux 4.9) cap how many
namespaces of each type a user can create.

**PID 1 behaves differently.** The signal rule above and the orphan
reaping catch out programs that were never written to be init. A tiny
init process in front of your server, or a SIGTERM handler, fixes it.

**Namespaces can be shared on purpose.** Because `setns` joins any
existing namespace, two containers can share one network or PID
namespace while keeping the rest separate. That's handy for debugging
tools, and it means a "container" isn't one fixed boundary; see
[[containers]].

## What this means when you build

- Treat a namespace as a view, not a wall. Pair it with cgroup limits,
  and don't rely on it alone for untrusted code.
- If your service runs as PID 1, install a SIGTERM handler or run a
  small init in front of it, and make sure something reaps child
  processes.
- Use `unshare` and `nsenter` (or `ip netns exec`) to poke at namespaces
  by hand; `ls -l /proc/<pid>/ns/` tells you which ones a process is in.
- For your own container runtime: create the namespaces with `clone`,
  set up the veth pair and the root filesystem from the parent, mount a
  new `/proc` in the child, then `pivot_root` and exec the program.
- Prefer running containers under a user namespace so that root inside
  maps to an unprivileged user outside.

## Further reading

- [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html), man-pages 6.19. The eight types, the clone/unshare/setns API, the `/proc/<pid>/ns` handles and what keeps a namespace alive.
- [pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html), man-pages 6.19. PID 1's rules, nesting, and the unshare and `/proc` surprises.
- [network_namespaces(7)](https://man7.org/linux/man-pages/man7/network_namespaces.7.html), man-pages 6.19. What a network namespace isolates, and veth pairs.
- [mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html), man-pages 6.19. Private mount lists and shared subtrees.
- [user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html), man-pages 6.19. UID mapping and what capabilities inside a user namespace really allow.
- [pivot_root(2)](https://man7.org/linux/man-pages/man2/pivot_root.2.html), man-pages 6.19. How a runtime swaps in the container's root filesystem.
- [Namespaces in operation, part 1](https://lwn.net/Articles/531114/), Michael Kerrisk, LWN, 2013. The history of each namespace type with kernel versions, from the man-pages maintainer.
- [Network namespaces](https://lwn.net/Articles/580893/), Jake Edge, LWN, 2014. A hands-on `ip netns` walk-through with a veth pair.
