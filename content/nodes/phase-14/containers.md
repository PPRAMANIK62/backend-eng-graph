---
id: containers
title: What a container really is
depth: deep
phase: 14
note: >-
  Processes with namespaces, cgroups and a layered filesystem. Not
  little VMs.
needs: [linux-namespaces, cgroups, overlayfs]
leads_to: [container-images, container-runtimes, kubernetes, seccomp, linux-capabilities]
compare_with: [virtual-machines]
---

# What a container really is

A container is an ordinary Linux [[process]] that the kernel has been
told to lie to and to hold back. [[linux-namespaces|Namespaces]] give it
its own view of process IDs, the network, the filesystem and users.
[[cgroups]] cap the CPU, memory and I/O it can use. A layered filesystem,
usually [[overlayfs]], gives it a root directory built from an image.
There's no "container" object in the kernel. Once you see that, most of
what containers do, and most of how they go wrong, stops being
mysterious.

## Building one by hand

The clearest way to see what a container is: follow what a runtime like
runc does when you start one. Say you want to run an API server from an
image.

1. **Prepare the root filesystem.** The image's layers are already
   unpacked into directories. Mount an overlay with those layers as the
   read-only lower directories and a fresh, empty upper directory for
   this container's writes. The merged directory is the container's
   future `/`.
2. **Create a cgroup.** Make a directory under `/sys/fs/cgroup`, and
   write the limits into it: `cpu.max`, `memory.max`, `pids.max`.
3. **Start a process in new namespaces.** Call `clone` with the flags
   for new PID, mount, network, UTS and IPC namespaces, and a user
   namespace if you want one. The child is PID 1 in its own PID namespace. Put its
   host PID in the cgroup's `cgroup.procs`.
4. **Wire up the network.** From the host side, create a veth pair, move
   one end into the child's network namespace and give it an address.
5. **Switch the root.** Inside the child, make the mounts private,
   `pivot_root` into the merged overlay directory, unmount the old root,
   and mount a fresh `/proc` so `ps` shows only the container's
   processes.
6. **Take privileges away.** Drop the [[linux-capabilities|Linux capabilities]] the program
   doesn't need, install a [[seccomp|seccomp filter]] that blocks risky system
   calls, and set the hostname.
7. **Exec the program.** `execve` the API server. From here on it's just
   that process, running.

Each step is a normal Linux feature you could use on its own. The OCI
runtime spec writes this recipe down as a `config.json`: which
namespaces to create or join, the cgroup path and limits, the mounts,
the capabilities, the seccomp filter and the program to run. The Linux
part of the spec describes itself as built from namespaces, cgroups,
capabilities, security modules and filesystem jails. How runtimes are
organized around that file is [[container-runtimes]].

![Two stacks side by side. Left, virtual machines: hardware, a host kernel, a hypervisor, then two VMs, each with its own guest kernel and its own processes. Right, containers: hardware, one Linux kernel, then two containers, each an ordinary process wrapped in its own namespaces, a cgroup limit and an overlay root filesystem, all calling the same kernel directly.](img/containers-vs-vms.svg)

*A virtual machine brings its own kernel; a container is a process on the host's kernel with a restricted view.*

## What it looks like from the host

From outside, nothing about the container is hidden:

- The API server shows up in the host's `ps` with an ordinary host PID.
  You can [[strace]] it, look at `/proc/<pid>/` and send it signals.
- Its limits are plain files under `/sys/fs/cgroup`.
- Its files are a directory on the host's disk: the overlay's upper
  directory holds everything it wrote.
- Its namespaces are handles in `/proc/<pid>/ns/`. `nsenter` can join
  them.

Starting one is cheap for the same reason. There's no kernel to boot:
you create a few namespaces, a cgroup directory and an overlay mount,
then exec. Many containers from the same image share the image's
read-only layers on disk; each only adds its own
thin writable layer (how that works is in [[overlayfs]]). When a container is deleted, its writable layer
goes with it, and the image is unchanged.

## Not a little VM

A [[virtual-machines|virtual machine]] uses hardware support to give
each sandbox its own virtual hardware, page tables and kernel. A
container runs on the host's kernel, the same one every other container
and the host itself use. That one difference drives most of the
trade-offs: the usual view is VMs for strong isolation at a higher
cost, containers for low overhead with weaker isolation.

**Isolation is a set of filters on a shared kernel.** A container's
process makes [[system-call|system calls]] into the same kernel as everything else.
Namespaces decide what it can name, cgroups decide how much it can
consume, capabilities and seccomp decide what it's allowed to ask for.
A bug in any of those, or in the kernel behind them, can let a process
out. Of these, the seccomp filter, which limits which system calls can
reach the kernel at all, is often the most important boundary. VMs, Solaris Zones and BSD Jails were designed from the start as
isolation boundaries. Linux containers are assembled from separate
primitives, and that extra complexity is where escapes come from.

**Not everything is namespaced.** Anything the kernel doesn't wrap in
one of the namespace types is shared by every container on the machine
(the list is in [[linux-namespaces]]). And a namespace doesn't change how big the
machine looks: a language runtime that doesn't read its cgroup v2
limits can size its heap from the host's total memory instead of the
container's limit, and get OOM-killed.

**The pieces can be mixed.** Because a container is just a set of
namespaces and a cgroup, two containers can share some namespaces and
not others. A debugging container can join your app's network namespace
and capture its packets, or its PID namespace and `strace` it. A VM
can't be half-shared like that.

## Where it gets tricky

**Root in a container can become root on the host.** In 2019 runc, the runtime under Docker,
containerd, CRI-O and Kubernetes, had a bug (CVE-2019-5736) that let a
root process in a container overwrite the host's runc binary and get
root on the host, by running any command in a malicious image or by
`docker exec` into a container the attacker could write to. The default
AppArmor policy didn't block it. A user namespace that didn't map host
root into the container did. Run as a non-root user inside, and use
user namespaces where you can.

**Capabilities and seccomp are part of the container.** Since Linux 2.2,
root's powers are split into capabilities that can be granted one by
one, so a runtime can give a container only the few it needs. A seccomp
filter is a small BPF program that decides which system calls the
process may make. Both shrink what a process can do to the shared
kernel. Switching them off to get something working throws that
protection away.

**PID 1 is special.** Your program is init in its PID namespace. It
ignores signals it has no handler for, and if it exits, the kernel kills
everything else in the container. That's why a server that shuts down
fine on your laptop can hang until SIGKILL in a container; see
[[signals]] and [[graceful-shutdown]].

**Writes to the container's filesystem are slower and temporary.** The
first write to an image file copies the whole file up to the writable
layer, and all of it disappears with the container. Data you care about
goes on a volume.

**"Container" means several things.** People use it for the running
process, for the image, and for the whole Docker or Kubernetes tool
chain. The image format is [[container-images]]; running many
containers across machines is [[kubernetes]].

## What this means when you build

- Think of a container as a process with a restricted view, not a
  machine. Debug it with the host tools you already know.
- Don't treat a container as a security boundary for hostile code on
  its own. Use a user namespace, drop capabilities, keep a seccomp
  filter, and reach for a VM or microVM when tenants don't trust each
  other. AWS Lambda, for example, first ran containers to separate
  functions and VMs to separate customer accounts.
- Make sure your runtime (JVM, Go, Node.js) sizes itself from the cgroup
  limits, not from the host.
- Handle SIGTERM in PID 1, or run a small init in front of your program.
- Keep state on volumes; treat the writable layer as scratch space.

## Further reading

- [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html), man-pages 6.19. The namespace types a container is built from, and the clone, unshare and setns calls.
- [Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html), Tejun Heo, Linux kernel docs. The resource limits side of a container.
- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec), Open Container Initiative. The standard recipe for a container: a bundle, a `config.json`, and the Linux features it asks for.
- [Storage drivers](https://docs.docker.com/engine/storage/drivers/), Docker docs. Image layers, the thin writable container layer, and copy-on-write.
- [Setting the Record Straight: containers vs. Zones vs. Jails vs. VMs](https://blog.jessfraz.com/post/containers-zones-jails-vms/), Jessie Frazelle, 2017. Why a container isn't a kernel object, and what that means for sharing and for security.
- [CVE-2019-5736: runc container breakout](https://www.openwall.com/lists/oss-security/2019/02/11/2), Aleksa Sarai, 2019. A real escape from root in a container to root on the host, and why user namespaces stopped it.
- [Firecracker: Lightweight Virtualization for Serverless Applications](https://www.usenix.org/system/files/nsdi20-paper-agache.pdf), Alexandru Agache and others, AWS, NSDI 2020. The container versus VM trade-off from people who run untrusted code at scale.
- [pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html), man-pages 6.19. Why your program is PID 1 in the container and which signal rules come with that.
- [pivot_root(2)](https://man7.org/linux/man-pages/man2/pivot_root.2.html), man-pages 6.19. The call that switches a new mount namespace onto the container's root filesystem.
- [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html), man-pages 6.19. Root's powers split into units a runtime can grant or withhold.
- [seccomp(2)](https://man7.org/linux/man-pages/man2/seccomp.2.html), man-pages 6.19. Filtering which system calls a container's processes may make.
- [About cgroup v2](https://kubernetes.io/docs/concepts/architecture/cgroups/), Kubernetes docs, v1.36. Which language runtimes read cgroup v2 limits, and what happens when they don't.
