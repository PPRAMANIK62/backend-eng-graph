---
id: docker-run-reference
title: Running containers (docker run reference)
author: Docker, Inc.
url: https://docs.docker.com/engine/containers/run/
kind: docs
primary: true
---

## Summary

The reference for `docker run`. Read for its section on runtime
privilege and Linux capabilities: which capabilities a container keeps
by default, which it doesn't, how to add or drop them, and what
`--privileged` does.

## Key claims

- Containers are unprivileged by default. "By default, Docker containers are "unprivileged" and cannot, for example, run a Docker daemon inside a Docker container." [inner quotes around unprivileged] (Runtime privilege and Linux capabilities)
- --privileged gives everything. "The --privileged flag gives all capabilities to the container." (Runtime privilege and Linux capabilities)
- And more than capabilities. "Docker enables access to all devices on the host, and reconfigures AppArmor or SELinux to allow the container nearly all the same access to the host as processes running outside containers on the host." (Runtime privilege and Linux capabilities)
- A default list is kept. "By default, Docker has a default list of capabilities that are kept." (Runtime privilege and Linux capabilities)
- Kept by default includes, among others: AUDIT_WRITE, CHOWN, DAC_OVERRIDE, FOWNER, FSETID, KILL, MKNOD, NET_BIND_SERVICE, NET_RAW, SETFCAP, SETGID, SETPCAP, SETUID, SYS_CHROOT (table of default capabilities)
- Example description from the table. "Bypass file read, write, and execute permission checks." (DAC_OVERRIDE)
- ALL works with both flags. "Both flags support the value ALL, so to allow a container to use all capabilities except for MKNOD:" (Runtime privilege and Linux capabilities)

## Visuals worth redrawing

None.

## My notes

- Docker docs, current when read.
