---
id: docker-seccomp-profiles
title: Seccomp security profiles for Docker
author: Docker, Inc.
url: https://docs.docker.com/engine/security/seccomp/
kind: docs
primary: true
---

## Summary

How Docker applies seccomp to containers: a default profile that allows
most system calls and blocks a few dozen dangerous ones, how to pass a
custom profile, and a table of the notable calls the default blocks and
why.

## Key claims

- The default profile's size. "The default seccomp profile provides a sane default for running containers with seccomp and disables around 44 system calls out of 300+." (Pass a profile for a container)
- It's an allow-list. "In effect, the profile is an allowlist that denies access to system calls by default and then allows specific system calls." (Pass a profile for a container)
- Denied calls fail with an error. "The effect of SCMP_ACT_ERRNO is to cause a Permission Denied error." (Pass a profile for a container)
- Some rules look at arguments. "some specific rules are for individual system calls such as personality, and others, to allow variants of those system calls with specific arguments." (Pass a profile for a container)
- Don't change the default. "It is not recommended to change the default seccomp profile." (Pass a profile for a container)
- Blocked example: the kernel keyring. "Prevent containers from using the kernel keyring, which is not namespaced." (Significant syscalls blocked, keyctl)
- Blocked example: mount, also gated by a capability. "Deny mounting, already gated by CAP_SYS_ADMIN." (Significant syscalls blocked, mount)
- Turning it off. "unconfined to run a container without the default seccomp profile." (Run without the default seccomp profile)

## Visuals worth redrawing

None.

## My notes

- Docker docs, current when read; the count of blocked calls changes as
  new system calls appear.
