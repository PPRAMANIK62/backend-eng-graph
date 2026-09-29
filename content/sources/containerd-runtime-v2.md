---
id: containerd-runtime-v2
title: Runtime v2
author: containerd maintainers
url: https://github.com/containerd/containerd/blob/main/docs/runtime-v2.md
kind: docs
primary: true
---

## Summary

containerd's design doc for how it runs containers: containerd pulls and
unpacks the image and prepares the rootfs and config, then starts a shim
process per container (or group) that talks ttRPC over a socket and
calls an OCI runtime engine such as runc.

## Key claims

- containerd doesn't launch containers itself. "containerd, the daemon, does not directly launch containers." (intro)
- What containerd does before the runtime runs. "containerd will retrieve container image config and its content as layers, use the snapshotter to lay it out on disk, set up the container's rootfs and config, and then launch a runtime that will create/start/stop the container." (intro)
- The runtime listens on a socket for ttRPC. "Instead it expects to invoke the runtime, which will expose a socket - Unix-domain on Unix-like systems, named pipe on Windows - and listen for container commands via [ttRPC](https://github.com/containerd/ttrpc) over that socket." (containerd-runtime communication)
- Shim plus engine lets one shim drive any OCI runtime. "The separate "shim+engine" pattern is used because it makes it easier to integrate distinct runtimes implementing a specific runtime engine spec, such as the [OCI runtime spec](https://github.com/opencontainers/runtime-spec)." (containerd-runtime communication)
- runc is the most common engine and is called by the shim. "The most commonly used runtime _engine_ is [runc](https://github.com/opencontainers/runc), which implements the [OCI runtime spec](https://github.com/opencontainers/runtime-spec)." (containerd-runtime communication)
- containerd-shim-runc-v2 invokes the runc binary. "The shim then invokes the actual `runc` binary, passing it the container configuration, and the `runc` binary creates/starts/stops the container typically via `libcontainer`->system apis." (runtime engine)
- One shim can drive many containers. "it is possible to have one shim for multiple containers and invocations." (Shim and runtime lifecycle)
- Containers of one Kubernetes pod share a shim. "containers launched by Kubernetes, that are part of the same Kubernetes pod, are handled by a single shim" (Shim and runtime lifecycle)

## Visuals worth redrawing

containerd, shim, runc, container process as a chain.

## My notes

- containerd README (read, not cited separately): designed to be
  embedded in a larger system; supports any OCI Distribution registry;
  overlay snapshotter by default.
