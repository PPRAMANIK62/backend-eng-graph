---
id: container-runtimes
title: Container runtimes
depth: deep
phase: 14
note: >-
  The OCI runtime spec, runc and crun, and the containerd and CRI layers
  above them. What the phase 14 build imitates.
needs: [containers, container-images]
leads_to: [kubernetes]
compare_with: []
---

# Container runtimes

"Container runtime" names two different layers. At the bottom, a
low-level runtime like runc or crun takes a directory and a JSON file
and turns them into a running [[containers|container]]: namespaces,
cgroups, root filesystem, then exec. Above it, a daemon like containerd
or CRI-O pulls [[container-images|images]], unpacks them, keeps track of
containers and answers requests from Docker or [[kubernetes]]. Knowing
where the line falls tells you which piece to blame when a container
won't start, and it's exactly the piece this phase's lab builds.

## The bottom layer: the OCI runtime

The OCI runtime spec defines what a low-level runtime gets and what it
must do. The input is a **bundle**: a directory holding a `config.json`
and the container's root filesystem. `config.json` lists everything
about the container: the program and its arguments, environment, user,
which [[linux-namespaces|namespaces]] to create or join, the
[[cgroups|cgroup]] path and limits, the mounts, the [[linux-capabilities|capabilities]], the
[[seccomp|seccomp]] filter.

A runtime has to support a handful of operations on a container ID:
`create`, `start`, `state`, `kill` and `delete`. The lifecycle is
split so that setup and running are separate steps:

1. **`create`** builds the whole environment described in `config.json`
   (namespaces, cgroup, mounts) but must not run the user's program yet.
   The container is now `created`.
2. Hooks (`createRuntime`, `createContainer`, and the older `prestart`,
   now deprecated) run here, so other tools can finish setting up the
   environment.
3. **`start`** runs the program. The container is `running`.
4. The process exits, or `kill` sends it a signal. The container is
   `stopped`.
5. **`delete`** undoes everything `create` did.

`state` returns JSON with the ID, status, PID and bundle path. The spec
defines these as operations, not as a command line; each runtime picks
its own CLI.

A namespace entry with a `path` joins an existing namespace instead of
making a new one. That's how several containers can share one network
namespace. A namespace type that isn't listed at all is inherited from
the runtime's own.

**runc**, written in Go, is the most used implementation. **crun** does
the same job in C. Its author argues that C fits a tool this close to
the kernel better, pointing out that runc re-executes itself and uses a
C module to set up the environment before the container process
starts. The crun README
reports running 100 containers of `/bin/true` in 1.69 s against 3.34 s
for runc on its author's machine, and running with memory limits too
small for runc. That's one machine's number with no versions given; the
lab measures both properly.

## The layer above: containerd and the shim

A low-level runtime only creates, starts and stops containers. Something
has to fetch the image's config and layers, lay the layers out on disk
(containerd calls this component a snapshotter), set up the root
filesystem and `config.json`, and only then call the runtime. That's
containerd (or CRI-O).

![A chain of boxes from top to bottom. The kubelet talks gRPC over the Container Runtime Interface to containerd. containerd pulls the image, unpacks layers with its snapshotter and writes the bundle, then starts containerd-shim-runc-v2 and talks to it with ttRPC over a Unix socket. The shim runs the runc binary with the bundle. runc creates the namespaces and cgroup, then execs the container process.](img/container-runtimes-stack.svg)

*From Kubernetes down to the container process. Adapted from the containerd "Runtime v2" docs.*

containerd doesn't launch containers directly. For each container (or
group, like a pod) it starts a small **shim** process and talks to it
over a Unix socket using ttRPC. The shim, for
example `containerd-shim-runc-v2`, runs the actual `runc` binary with
the bundle. The split means any runtime that implements the OCI spec can
slot in underneath the same shim, and one shim can manage many
containers.

## Kubernetes and the CRI

Kubernetes doesn't talk to runc or to containerd's own API. The kubelet
on each node talks to the runtime through the **Container Runtime
Interface (CRI)**, a [[grpc|gRPC]] API with the kubelet as client. Any runtime
that implements it (containerd, CRI-O) works without rebuilding
Kubernetes. The CRI has been stable since Kubernetes v1.23, and since
v1.26 the kubelet requires the v1 version of the API.

Before v1.24, Kubernetes had a built-in adapter for Docker Engine
called dockershim. It was removed in v1.24; nodes now run containerd or
CRI-O directly.

## Sandboxed runtimes: a different kind of bottom layer

Because the low layer is just "something that implements the OCI
runtime spec", it can be swapped for a runtime that isolates more than
namespaces do. An ordinary container calls the host kernel directly;
[[seccomp]] narrows which calls it can make, but a bug in
any allowed call is still a bug in the shared kernel.

- **gVisor** puts an application kernel between the container and the
  host. It's written in Go, runs in user space, and implements a
  Linux-like interface itself, so the container's system calls are
  handled by gVisor's kernel, one per sandbox, instead of the host's.
  It ships as an OCI runtime called `runsc`, so containerd and Docker
  use it like runc. Its authors describe it as neither a system call
  filter nor a VM.
- **Hardware-virtualized runtimes** run each pod inside a lightweight
  [[virtual-machines|virtual machine]] with its own guest kernel. That
  isolates well, but for containers it usually means extra agents and
  proxies, a bigger footprint and slower start.

Kubernetes picks between runtimes per pod with **RuntimeClass**. The
node's CRI runtime is configured with named handlers, a RuntimeClass
object points at one, and a pod asks for it with `runtimeClassName`.
The point is to trade performance for isolation where it matters, for
example running untrusted workloads in a sandboxed runtime, and a
RuntimeClass can declare the extra overhead so the scheduler counts it.

## Where it gets tricky

**Agree on the cgroup driver.** The kubelet and the runtime both create
cgroups, and they must use the same driver. On a systemd machine that
means the `systemd` driver, and with cgroup v2 you should use `systemd`
rather than `cgroupfs`. Two cgroup managers give two views of
the node's resources, and nodes set up that way can become unstable
under pressure.

**The runtime is part of your security boundary.** A bug in runc
(CVE-2019-5736) let a container overwrite the host's runc binary. The
details are in [[containers]]; the lesson here is to keep the runtime
patched like the kernel.

## What this means when you build

- When a container won't start, find the layer: image pull and unpack
  (containerd), bundle and namespaces (runc), or the kubelet's request
  (CRI).
- Pin by digest and keep runc or crun up to date.
- Run untrusted code under a sandboxed runtime through a RuntimeClass,
  and accept the overhead only where you need the isolation.
- For your own runtime, implement the OCI lifecycle: parse `config.json`,
  do all setup in `create`, run the program in `start`, and make
  `delete` undo every step even after a failed `create`. Then you can
  benchmark it against runc and crun with the same bundle.

## Further reading

- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec), Open Container Initiative, v1.3.0 and later. The bundle, `config.json`, the lifecycle and the Linux namespaces and cgroups settings.
- [Runtime v2](https://github.com/containerd/containerd/blob/main/docs/runtime-v2.md), containerd maintainers. How containerd, the shim and runc divide the work.
- [crun README](https://github.com/containers/crun), Giuseppe Scrivano and contributors. Why a runtime in C, and the author's runc comparison.
- [Container Runtime Interface (CRI)](https://kubernetes.io/docs/concepts/architecture/cri/), Kubernetes docs, v1.36. The gRPC API between the kubelet and the runtime.
- [Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/), Kubernetes docs, v1.37. Choosing a runtime per pod, and declaring its overhead.
- [What is gVisor?](https://gvisor.dev/docs/), gVisor docs. An application kernel in user space as a sandboxed OCI runtime, compared with filters and VMs.
- [Container Runtimes](https://kubernetes.io/docs/setup/production-environment/container-runtimes/), Kubernetes docs, v1.36. dockershim's removal and the cgroup driver setting.
