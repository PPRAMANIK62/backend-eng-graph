---
id: oci-runtime-spec
title: OCI Runtime Specification
author: Open Container Initiative
url: https://github.com/opencontainers/runtime-spec
kind: spec
primary: true
---

## Summary

The OCI runtime spec (read on main after v1.3.0): what a runtime like
runc or crun takes as input (a bundle: a `config.json` and a root
filesystem), the operations it must support (create, start, kill,
delete, state), the lifecycle with its hooks, and for Linux the
namespaces, cgroups and other kernel features a config can ask for.
Claims come from spec.md, bundle.md, runtime.md and config-linux.md.

## Key claims

- Scope: configuration, execution environment and lifecycle. "The Open Container Initiative Runtime Specification aims to specify the configuration, execution environment, and lifecycle of a container." (spec.md, Abstract)
- A bundle is config.json plus the root filesystem. "This REQUIRED file MUST reside in the root of the bundle directory and MUST be named `config.json`." (bundle.md)
- The rootfs is the directory named by root.path. "container's root filesystem: the directory referenced by [`root.path`](config.md#root), if that property is set in `config.json`." (bundle.md)
- States: creating, created, running, stopped. "`created`: the runtime has finished the [create operation](#create) (after step 2 in the [lifecycle](#lifecycle)), and the container process has neither exited nor executed the user-specified program" (runtime.md, State)
- create sets up the environment but doesn't run the program. "While the resources requested in the [`config.json`](config.md) MUST be created, the user-specified program (from [`process`](config.md#process)) MUST NOT be run at this time." (runtime.md, Lifecycle step 2)
- Hooks run between create and start. "The [`prestart` hooks](config.md#prestart) MUST be invoked by the runtime." (runtime.md, Lifecycle step 3)
- start runs it. "The runtime MUST run the user-specified program, as specified by [`process`](config.md#process)." (runtime.md, Lifecycle step 8)
- delete undoes create. "The container MUST be destroyed by undoing the steps performed during create phase (step 2)." (runtime.md, Lifecycle step 12)
- These are operations, not a CLI. "Note: these operations are not specifying any command-line APIs, and the parameters are inputs for general operations." (runtime.md, Operations)
- On Linux the spec is built from kernel features. "The Linux container specification uses various kernel features like namespaces, cgroups, capabilities, LSM, and filesystem jails to fulfill the spec." (config-linux.md)
- Namespace types a runtime should support: pid, network, mount, ipc, uts, user, cgroup, time. "**`network`** the container will have its own network stack." (config-linux.md, Namespaces)
- A namespace not listed is inherited from the runtime. "If a namespace type is not specified in the `namespaces` array, the container MUST inherit the [runtime namespace](glossary.md#runtime-namespace) of that type." (config-linux.md, Namespaces)
- A path joins an existing namespace instead of making one. "The runtime MUST place the container process in the namespace associated with that `path`." (config-linux.md, Namespaces)
- cgroupsPath says where in the cgroup tree the container goes. "**`cgroupsPath`** (string, OPTIONAL) path to the cgroups." (config-linux.md, Cgroups Path)
- config.json lists the process capabilities. "**`capabilities`** (object, OPTIONAL) is an object containing arrays that specifies the sets of capabilities for the process." (config.md, Linux Process)
- config.json carries a seccomp filter. "Seccomp configuration allows one to configure actions to take for matched syscalls and furthermore also allows matching on values passed as arguments to syscalls." (config-linux.md, Seccomp)
- config.json lists mounts. "**`mounts`** (array of objects, OPTIONAL) specifies additional mounts beyond [`root`](#root)." (config.md, Mounts)
- Runtimes must support state, create, start, kill and delete. "Unless otherwise stated, runtimes MUST support the following operations." (runtime.md, Operations: state, create, start, kill, delete)
- The state has the ID, status, PID and bundle path. "**`bundle`** (string, REQUIRED) is the absolute path to the container's bundle directory." (runtime.md, State: id, status, pid, bundle)
- createRuntime and createContainer hooks run during setup. "The [`createRuntime` hooks](config.md#createRuntime-hooks) MUST be invoked by the runtime." (runtime.md, Lifecycle step 4; createContainer is step 5)
- The prestart hooks are deprecated. "**`prestart`** (array of objects, OPTIONAL, **DEPRECATED**) is an array of [`prestart` hooks](#prestart)." (config.md, POSIX-platform Hooks)

## Visuals worth redrawing

The lifecycle: create (environment built, program not run), start, the
process exits, delete.

## My notes

- specs-go/version.go on main says 1.3.0 plus "+dev".
- The namespace `path` field is how a pod's containers share one
  network namespace.
