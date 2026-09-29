---
id: graceful-shutdown
title: Graceful shutdown
depth: short
phase: 4
note: >-
  Stop taking new work, finish what's in flight, then exit, after the
  load balancer stops sending.
needs: [signals, load-balancing]
leads_to: [deployment-strategies]
compare_with: [zero-downtime-reload]
---

# Graceful shutdown

A graceful shutdown stops a server without failing the requests it's
in the middle of. It stops taking new work, finishes what it already
has, then exits, and it does this only once the
[[load-balancing|load balancers]] have stopped sending it traffic.
Deploys and scale-downs stop old [[process|processes]] all the time, so a server
that gets this wrong drops requests on every release.

## What happens when Kubernetes stops a pod

Take a Go HTTP server running in [[kubernetes]], behind a Service. A
deploy replaces the pod, so the old one is deleted. From there:

1. If the container has a **preStop hook**, the kubelet runs it first.
2. The kubelet then sends **SIGTERM** to process 1 in each container
   (or the image's STOPSIGNAL, if it sets one).
3. **At the same time**, the control plane marks the pod's endpoint as
   not ready, so load balancers stop sending it regular traffic, and
   each one notices on its own schedule.
4. After the **grace period**, 30 seconds by default and counted from
   the start (so the preStop hook uses part of it), anything still
   running gets **SIGKILL**.

![A timeline from "pod deleted" to "grace period ends (30 s by default)", where SIGKILL arrives. The kubelet runs the preStop hook, then sends SIGTERM to process 1. Load balancers are still sending new work for a while, because the endpoint is marked not ready at the same time and each one catches up on its own. The server keeps accepting, then stops accepting and drains in-flight work, then exits, with spare time left before SIGKILL.](img/graceful-shutdown-timeline.svg)

*The shape of a shutdown in Kubernetes. Adapted from the Kubernetes docs, "Pod Lifecycle", Termination of Pods.*

The [[signals|signal]] is the server's cue, so the server has to catch
SIGTERM and act on it. SIGKILL gives it no chance to clean up:
whatever wasn't finished by then is lost.

## The three steps

**1. Stop taking new work.** Close the listening socket so no new
connections are accepted. Stop keeping idle connections open for more
requests (Go's `SetKeepAlivesEnabled(false)` is meant for servers
that are shutting down).

**2. Finish what's in flight.** Let requests that already started run
to the end and write their replies. Close connections as they go idle.

**3. Exit, with a deadline.** If something is still running when the
deadline hits, give up and exit anyway. The deadline must fall inside
the grace period, or SIGKILL makes the choice for you.

In Go, `http.Server.Shutdown(ctx)` does steps 1 and 2: it closes the
listeners, closes idle connections, and waits for active ones to go
idle. The context is step 3: when it expires, `Shutdown` returns its
error. One detail catches people: as soon as `Shutdown` is called,
`ListenAndServe` returns `ErrServerClosed`. If `main` returns then, the
process exits with requests still running. `main` has to wait for
`Shutdown` to finish.

## Where it gets tricky

**SIGTERM and "stop sending" race.** Kubernetes marks the endpoint not
ready at the same time as it sends SIGTERM, not before. A server that
closes its listener the instant SIGTERM arrives can still get new
connections from load balancers that haven't caught up, and those
connections are refused. The fix is to keep accepting for a short
while after SIGTERM (or sleep in a preStop hook) before step 1. There's
no fixed number; it depends on how quickly your load balancers react.

**Long-lived connections aren't drained for you.** Go's `Shutdown`
doesn't close or wait for hijacked connections like [[websockets|WebSockets]]. You
have to tell them yourself (`RegisterOnShutdown` is the hook) and wait
if you want to.

**The signal has to reach your server.** Kubernetes sends SIGTERM to
process 1 in the container. If process 1 is a wrapper that doesn't
pass signals on, your server never hears it and dies to SIGKILL at the
end of the grace period.

**"Idle" isn't "done".** Background workers, buffered writes and
queued jobs aren't HTTP requests. `Shutdown` knows nothing about them;
stop and flush them yourself before exiting.

**Clients see closed idle connections.** A client's pool may pick a
pooled connection just as the server closes it. Go's HTTP client
retries such a failure only for idempotent requests on a connection
that had already worked, so a POST can still fail. Clients should
expect this; see [[connection-pooling]].

## What this means when you build

- Catch SIGTERM. On it: fail [[health-checks|readiness]], keep serving
  briefly, stop accepting, drain with a deadline, exit.
- Keep the whole thing, preStop hook included, well inside the grace
  period.
- Make sure the server is process 1, or that process 1 forwards
  signals.
- Test it: send SIGTERM under load and check that no request fails.
  The phase 4 lab's load client, which checks every reply, can do
  exactly that.

A [[zero-downtime-reload]] is the close cousin: there a new process
takes over the same listening socket, so nothing has to reroute. A
graceful shutdown removes the instance and relies on the load balancer
to send work elsewhere. [[deployment-strategies]] build on both.

## Further reading

- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/), Kubernetes docs. The termination flow: preStop, SIGTERM, endpoint removal, grace period and SIGKILL.
- [net/http](https://pkg.go.dev/net/http), The Go Authors, go1.27.1. `Server.Shutdown`, `RegisterOnShutdown` and the client's retry rule for reused connections.
