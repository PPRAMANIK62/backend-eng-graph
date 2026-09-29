---
id: kubernetes
title: Kubernetes
depth: deep
phase: 14
note: >-
  Desired state stored in etcd, and controllers that make it real. Pods,
  scheduling, and where health checks and shutdown fit.
needs: [containers, control-loops, coordination-services, container-runtimes]
leads_to: [kubernetes-networking, autoscaling]
compare_with: [infrastructure-as-code]
---


# Kubernetes

Kubernetes runs your [[containers]] across a fleet of machines. You
don't tell it what to do step by step. You write down what you want in
API objects, it stores them in etcd, and a set of independent
[[control-loops|control loops]] keeps working to make the cluster match.
Once you see it that way, most of its surprising behavior makes sense:
why a pod is replaced instead of moved, why a rollout happens a few pods
at a time, and why a pod that's shutting down can still get requests.

## From one file to a running container

Take one object: a Deployment that asks for three copies of a web
server image. You send it to the cluster with `kubectl apply`. Here's
what happens, one loop at a time.

1. **The API server** checks the object and stores it in etcd. Nothing
   runs yet. You've only changed the desired state.
2. **The controllers**, running in the controller manager, see a
   Deployment that wants three pods. The Deployment controller creates
   a ReplicaSet, and the ReplicaSet controller creates three Pod objects
   from the pod template. These are still just records, with no machine
   assigned.
3. **The scheduler** watches for pods that aren't bound to a node. For
   each one it picks a node and writes that choice back through the API.
   This is called binding.
4. **The kubelet** on that node watches for pods bound to it. It asks
   the [[container-runtimes|container runtime]] to start the containers, then reports their
   state back into the pod's `status`.

![The Kubernetes control plane. The API server sits in the middle and is the only component that talks to etcd. The controller manager, the scheduler and the kubelets on each node all watch the API server and write back to it; none of them talk to each other directly. On each node the kubelet drives the container runtime, which starts the containers.](img/kubernetes-control-plane.svg)

*Every component watches the API server and writes back to it. Only the API server touches etcd. Adapted from the Kubernetes documentation, "Kubernetes Components".*

None of these components calls another. Each one watches the API for
objects it cares about, acts, and writes the result back. The
controller that made the pods doesn't know which node they went to, and
the kubelet doesn't know a Deployment exists. They coordinate only
through shared state.

## The API server and etcd hold all the state

The control plane has a few parts: the API server, etcd, the scheduler,
and the controller manager, which runs the built-in controllers. Every
node runs a kubelet, a container runtime and usually kube-proxy.

etcd is a consistent key-value store and the only place cluster state
lives (it's a [[coordination-services|coordination service]]). Only the API server reads and writes it. Everything else goes
through the API server's REST API, which validates objects, fills in
defaults and handles versions.

This design came from two earlier systems at Google. Borg had one big
master that knew the meaning of every operation. Omega put cluster
state in a shared store and let every component read and write it
directly, with all the logic in the clients. Kubernetes took the middle
path: separate components like Omega, but with one API server in front
of the store to enforce the rules.

Every object carries a `resourceVersion`, the version it was stored at.
That gives you two tools:

- **Watching.** A client lists a set of objects, notes the
  `resourceVersion`, then opens a watch from that version and gets a
  stream of every change after it. This is how every controller keeps
  its local copy of the cluster up to date without polling.
- **[[optimistic-concurrency|Optimistic concurrency]].** When you
  update an object you send the version you read. If someone else
  changed it in the meantime, the API server rejects your write with
  409 Conflict, and you read again and retry.

## Pods are the unit it runs

Kubernetes doesn't schedule containers. It schedules pods. A pod is one
or more containers that share a network namespace, so they have one IP
address and can reach each other on `localhost`, and can share
volumes. Under the hood that's a set of
[[linux-namespaces|Linux namespaces]] and [[cgroups]], the same things
that isolate a single container. Most pods hold one container, and you
can think of the pod as a thin wrapper around it.

Pods are disposable. A pod is scheduled once, to one node, and stays
there until it ends. It's never moved. If its node dies, a controller
notices and creates a new pod, with a new ID, that the scheduler places
somewhere else. Changing a Deployment's pod template doesn't edit
running pods either. New pods are made from the new template and
replace the old ones, which is how a rollout works
([[deployment-strategies]] covers the choices). An
[[autoscaling|autoscaler]] fits the same pattern: it only changes the
desired replica count and leaves creating and deleting pods to the
controllers.

Inside one pod, the kubelet restarts containers that exit. It waits
longer after each crash, 10 s, then 20 s, then 40 s, up to 5 minutes.
That wait is what `CrashLoopBackOff` means in `kubectl get pods`.

Controllers find their pods through labels, key-value pairs like
`app=web`, and label selectors. A Deployment, a Service and a
monitoring tool can all select the same pods without owning a list of
them.

## Scheduling works from what you ask for

When a pod needs a node, the scheduler first filters out nodes that
can't run it: not enough resources, wrong constraints. Then it scores
the rest and picks the highest, breaking ties at random. If no node
fits, the pod stays unscheduled until one does.

The resources it checks are the pod's **requests**, what you said the
containers need. Not what they actually use. **Limits** are a separate
thing, enforced by the kernel on the node through cgroups: a container
that hits its CPU limit gets throttled, and one that goes over its
memory limit gets killed by the out-of-memory killer. CPU limits can
throttle a container even when the node has spare CPU, which hurts
latency-sensitive services.

## Health checks and shutdown

Kubernetes decides whether a pod should get traffic, and whether a
container should be restarted, with probes ([[health-checks]] covers
them in detail):

- A failing **readiness** probe takes the pod's IP out of the
  endpoints of every Service that selects it. The container keeps
  running.
- A failing **liveness** probe restarts the container.

When a pod is deleted, two things start at the same time. The kubelet
sends [[signals|SIGTERM]] to process 1 in each container, and the
control plane starts removing the pod from Service endpoints. The pod
gets a grace period, 30 seconds by default, to finish its work
([[graceful-shutdown]]). Anything still running after that gets
SIGKILL.

How traffic finds a pod in the first place, through Services, virtual
IPs and cluster DNS, is [[kubernetes-networking]].

## Where it gets tricky

**Restarting isn't rescheduling.** A crashing container is restarted
in place by the kubelet, on the same node, forever, with a growing
wait. It won't be moved to a healthier node. Only a new pod, made by a
controller, goes somewhere else.

**Shutdown races the endpoint update.** SIGTERM and endpoint removal
start at the same time, not one after the other. Nothing makes every
proxy and load balancer stop sending traffic before the signal
arrives, so a pod can still get new requests after SIGTERM. A server
that stops accepting connections the moment SIGTERM arrives can drop
some of them. Keep serving for a short while, then drain.

**Liveness probes can make an overload worse.** If a liveness probe
fails because the service is busy, Kubernetes restarts it. The
remaining pods take its load, get slower, fail their probes too, and
get restarted. A liveness probe should check that the process is stuck,
not that it's slow or that a dependency is down. That's a job for
readiness.

**Watch history is short.** The API server keeps only a few minutes of
change history (5 minutes by default with etcd 3). A client that falls
behind gets 410 Gone and must list everything again. On a big cluster,
many controllers re-listing at once is a real load on the control
plane.

**etcd is small on purpose.** It's a single replicated group with no
sharding, meant for metadata, and reliable up to several gigabytes.
Cluster state has to stay small. Don't use ConfigMaps or custom objects
as a general-purpose database.

**A container isn't a strong wall.** Containers on a node share one
kernel, and they can still interfere through things the kernel doesn't
divide up, like the CPU's L3 cache and memory bandwidth. For untrusted
code, people add a [[virtual-machines|virtual machine]] boundary
underneath.

## What this means when you build

- Don't create bare pods. Use a Deployment (or a Job, or a StatefulSet)
  so a controller replaces them.
- Set CPU and memory requests. They decide where a pod lands. Think
  twice before setting CPU limits on a latency-sensitive service.
- Use readiness for "should I get traffic" and keep liveness simple.
- Handle SIGTERM: keep serving briefly, finish in-flight work, exit
  well inside the grace period.
- If you write your own controller, make it level-based, retry on 409,
  and re-list on 410.

## Further reading

- [Borg, Omega, and Kubernetes](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44843.pdf), Brendan Burns, Brian Grant, David Oppenheimer, Eric Brewer, John Wilkes, ACM Queue, 2016. Why Kubernetes looks the way it does: pods, labels, spec and status, reconciliation loops, and the API server in front of the store.
- [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/), Kubernetes documentation, Kubernetes 1.37. The map of the control plane and the node.
- [Kubernetes API Concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/), Kubernetes documentation, Kubernetes 1.37. resourceVersion, list and watch, 410 Gone and 409 Conflict.
- [Pods](https://kubernetes.io/docs/concepts/workloads/pods/), Kubernetes documentation, Kubernetes 1.37. What a pod shares, why pods are disposable, requests and limits.
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), Kubernetes documentation, Kubernetes 1.37. How a Deployment works through ReplicaSets to create and replace pods.
- [Kubernetes Scheduler](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/), Kubernetes documentation, Kubernetes 1.37. Filtering, scoring and binding.
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/), Kubernetes documentation, Kubernetes 1.37. Scheduling once, restart backoff, and the termination flow.
- [Liveness, Readiness, and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/), Kubernetes documentation, Kubernetes 1.37. What each probe does and how liveness probes cause cascading failures.
- [etcd versus other key-value stores](https://etcd.io/docs/v3.6/learning/why/), etcd authors, etcd v3.6. What etcd is for, and why it stays small.
