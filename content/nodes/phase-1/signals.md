---
id: signals
title: Signals
depth: short
phase: 1
note: >-
  Messages the kernel delivers to a process: SIGTERM, SIGKILL, SIGPIPE.
  Where graceful shutdown starts.
needs: [process]
leads_to: []
compare_with: []
---

# Signals

A signal is a small notification the kernel delivers to a [[process]]:
"please stop", "you're being killed", "the pipe you wrote to has no
reader". Each one is identified by a number. For a backend service,
signals are how the outside world tells you to shut down, and handling
them well is the difference between a clean deploy and dropped requests.

## What happens when a signal arrives

Every signal has a **disposition** in the receiving process, which decides
what happens when it's delivered. There are three choices:

- **Default.** Each signal has a default action. For most, including
  SIGTERM, it's to terminate the process. Some default to dumping core,
  stopping, continuing or being ignored.
- **Ignore.** The signal is thrown away.
- **Handle.** The process registers a function, a signal handler, with
  `sigaction`. The kernel interrupts whatever the process was doing and
  runs the handler.

Two signals don't give you a choice. **SIGKILL and SIGSTOP can't be
caught, blocked or ignored.** SIGKILL ends the process with no chance to
clean up.

A signal can also be **blocked**. It then stays pending until it's
unblocked. Instead of a handler, a program can wait for signals as ordinary
events, with `sigwaitinfo` or through a file descriptor from `signalfd`.

## The signals a backend engineer meets

| Signal | Number (x86) | Default | Where it comes from |
|---|---|---|---|
| SIGTERM | 15 | terminate | "please shut down": the `kill` command, Kubernetes |
| SIGKILL | 9 | terminate, can't be caught | "you're done now" |
| SIGINT | 2 | terminate | an interrupt from the keyboard |
| SIGPIPE | 13 | terminate | writing to a pipe nobody reads |
| SIGCHLD | 17 | ignore | a child process stopped or exited |

![The kernel sends a signal to a process, which checks its disposition for that signal and either takes the default action, ignores it, or runs a handler set with sigaction. Notes below say blocked signals stay pending and that SIGKILL and SIGSTOP can't be caught, blocked or ignored.](img/signals-disposition.svg)

*What decides what a signal does to a process.*

## Graceful shutdown starts with SIGTERM

Here's what happens when Kubernetes deletes a pod running your service:

1. If the container has a preStop hook, it runs first.
2. The container runtime sends **SIGTERM** to process 1 in each container
   (or the image's configured stop signal instead).
3. At the same time, Kubernetes starts taking the pod out of the service's
   endpoints and marks it not ready, so load balancers stop sending it new
   regular traffic.
4. The pod has a grace period, 30 seconds by default, to finish.
5. When the grace period ends, anything still running gets **SIGKILL**.

So your SIGTERM handler has one job: stop taking new work, finish what's in
flight, flush and close what needs closing, and exit before the grace
period runs out. If you ignore SIGTERM, you get killed 30 seconds later
with requests half done.

![A timeline of a pod deletion. The preStop hook runs first if there is one, then process 1 gets SIGTERM and drains while Kubernetes, at the same time, takes the pod out of endpoints. At the end of the grace period, 30 seconds by default, anything still running gets SIGKILL.](img/signals-pod-shutdown.svg)

*How Kubernetes shuts a pod down. Not to scale. Adapted from Kubernetes documentation, "Pod Lifecycle" (kubernetes.io).*

## Where it gets tricky

**SIGPIPE kills servers by default.** Writing to a pipe with no reader
sends SIGPIPE, and its default action is to terminate the process. A
process that doesn't expect it can die because its reader went away.

**In a threaded process, any thread may get it.** The disposition is shared
by all [[thread|threads]], but each thread has its own signal mask. A
signal sent to the process goes to whichever thread isn't blocking it; if
several aren't, the kernel picks one arbitrarily. One way to keep this
simple is to block signals in every thread and accept them in one place,
with `sigwaitinfo` or `signalfd`.

**Signals interrupt system calls.** If a handler runs while a
[[system-call]] is blocked, the call is either restarted automatically or
fails with `EINTR`. Which one depends on the call and on whether the
handler was set up with the `SA_RESTART` flag.
Code that treats `EINTR` as a real error breaks under signals.

**exec resets handlers.** When a process execs a new program, handled
signals go back to their defaults, while ignored ones stay ignored. A
child can inherit "ignore SIGPIPE" without knowing it.

**SIGTERM and endpoint removal race.** In Kubernetes, the pod gets SIGTERM
at the same time as it starts coming out of the load balancer, not after.
Traffic can still arrive for a moment after SIGTERM, so shutting the
listener instantly can drop requests.

## What this means when you build

- Handle SIGTERM in every service. Drain, finish in-flight work, exit with
  a clear code, and do it within the grace period.
- Never count on cleanup after SIGKILL. Anything that must survive a crash
  has to be safe without a clean shutdown; that's [[crash-consistency]].
- Decide deliberately what SIGPIPE should do in your process.
- If your service is process 1 in its container, it's the process that
  receives SIGTERM, so it has to handle it.

## Further reading

- [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html), Linux man-pages, 2026. Dispositions, the full signal table, threads and blocked system calls.
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/), Kubernetes documentation. The exact shutdown sequence a pod goes through, with SIGTERM, the grace period and SIGKILL.
