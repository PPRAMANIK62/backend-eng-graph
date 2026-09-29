---
id: frazelle-containers-zones-jails-vms-2017
title: "Setting the Record Straight: containers vs. Zones vs. Jails vs. VMs"
author: Jessie Frazelle
url: https://blog.jessfraz.com/post/containers-zones-jails-vms/
kind: blog
primary: true
---

## Summary

A short post (2017) by a Docker and container-security engineer: Linux
has no container object. A container is what people call a combination
of namespaces and cgroups, unlike Solaris Zones, BSD Jails and VMs,
which were designed as first-class isolation. That makes containers
flexible (you can share single namespaces) and more complex, and the
complexity is where escapes come from.

## Key claims

- Containers aren't a kernel object. "A “container” is just a term people use to describe a combination of Linux namespaces and cgroups." (The Design of ...)
- Zones, Jails and VMs are first-class. "Solaris Zones, BSD Jails, and VMs are first class concepts." (The Design of ...)
- You can share one namespace between containers, e.g. a debugger in the same net or PID namespace. "You can have your application running in one container, then in a different container sharing a net namespace you can run wireshark and inspect the packets from the first container." (Sharing Namespaces)
- Built from primitives, not designed as isolation. "Again, containers were not a top level design, they are something we build from Linux primitives." (Complexity == Bugs)
- Complexity leads to escapes. "This extra complexity leads to bugs that lead to container escapes." (Complexity == Bugs)
- Sharing a PID namespace lets you strace from another container. "You could also do the same with sharing a pid namespace, except instead of running wireshark you can run strace and debug your application from an entirely different container." (Sharing Namespaces)
- Sharing is something VMs, Jails and Zones cannot do. "Let’s go over some of the things you can do with containers that you CANNOT do with Jails or Zones or VMs." (Sharing Namespaces)

## Visuals worth redrawing

None.

## My notes

- Primary in the sense that the author built container tooling and
  security profiles; it's an opinion post, used for the framing.
