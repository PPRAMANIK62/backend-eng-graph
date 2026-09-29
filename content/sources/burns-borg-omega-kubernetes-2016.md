---
id: burns-borg-omega-kubernetes-2016
title: Borg, Omega, and Kubernetes
author: Brendan Burns, Brian Grant, David Oppenheimer, Eric Brewer, John Wilkes (Google)
url: https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44843.pdf
kind: paper
primary: true
---

## Summary

ACM Queue article (2016, vol. 14 no. 1) by the people behind Google's
three container managers. Borg had a monolithic master; Omega put state
in a shared Paxos-based store that components read and wrote directly;
Kubernetes keeps a shared store but puts a REST API server in front of
it. It explains pods, labels, spec and status, reconciliation loops,
IP-per-pod, and what they'd still like to fix.

## Key claims

- Omega's design: a shared Paxos-based store that control-plane parts read and write, with optimistic concurrency. "using optimistic concurrency control to handle the occasional conflicts." (intro)
- Kubernetes: shared store, components watch it, access only through the API (a REST API with versioning, validation and policy, unlike Omega's direct access). "Like Omega, Kubernetes has at its core a shared persistent store, with components watching for changes to relevant objects." (intro)
- The API applies versioning, validation and policy. "In contrast to Omega, which exposes the store directly to trusted control-plane components" (intro)
- Container isolation isn't perfect. "containers cannot prevent interference in resources that the operating-system kernel doesn't manage, such as level 3 processor caches and memory bandwidth" (Containers)
- Containers need another security layer against malicious tenants. "containers need to be supported by an additional security layer (such as virtual machines) to protect against the kinds of malicious actors found in the cloud." (Containers)
- The pod is Borg's alloc, regularized. "In Borg, the outermost container is called a resource allocation, or alloc; in Kubernetes, it is called a pod." (Containers as the unit of management)
- Every object has metadata, spec and status. "every Kubernetes object has three basic fields in its description: ObjectMetadata, Specification (or Spec), and Status." (Orchestration is the beginning, not the end)
- Spec is desired, status is observed (status is read-only information about current state). "Spec is used to describe the desired state of the object" (Orchestration is the beginning, not the end)
- The autoscaler just changes the replica count; the replication controller does the rest. "The autoscaler, in turn, relies on this capability and simply adjusts the desired number of pods, without worrying about how those pods are created or deleted." (Orchestration is the beginning, not the end)
- The reconciliation loop is shared by all three systems. "it compares a desired state (e.g., how many pods should match a label-selector query) against the observed state (the number of such pods that it can find), and takes actions to converge the observed and desired states." (Orchestration is the beginning, not the end)
- Why it survives restarts. "when a controller fails or restarts it simply picks up where it left off." (Orchestration is the beginning, not the end)
- Choreography, not central orchestration. "The design of Kubernetes as a combination of microservices and small control loops is an example of control through choreography" (Orchestration is the beginning, not the end)
- Borg shared the host IP and handed out ports; Kubernetes gives each pod an IP. "we decided that Kubernetes would allocate an IP address per pod, thus aligning network identity (IP address) with application identity." (Don't make the container system manage port numbers)
- Why: off-the-shelf software can use well-known ports. "applications are free to use static well-known ports (e.g., 80 for HTTP traffic)" (Don't make the container system manage port numbers)
- Labels and selectors group objects, and the sets can overlap. "Sets can overlap, and an object can be in multiple sets" (Don't just number containers: give them labels)
- Removing a label takes a misbehaving pod out of a service while the controller replaces it. "that pod can be quarantined from serving requests by removing one or more of the labels that cause it to be targeted by the Kubernetes service load balancer." (Be careful with ownership)
- Borg: monolithic master; Omega: all logic in clients; Kubernetes: middle ground through a central API server. "It does this by forcing all store accesses through a centralized API server that hides the details of the store implementation and provides services for object validation, defaulting, and versioning." (Don't expose raw state)
- Borg's master was monolithic. "The Borgmaster is a monolithic component that knows the semantics of every API operation." (Don't expose raw state)

## Visuals worth redrawing

None in the paper; the three API architectures (monolith, shared
store, API server in front of a store) would make a good small figure.

## My notes

- The ACM Queue page itself (queue.acm.org) was behind a Cloudflare check
  and didn't open; this is Google Research's PDF of the same article.
