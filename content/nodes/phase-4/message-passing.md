---
id: message-passing
title: Message passing
depth: short
phase: 4
note: >-
  Threads share data by sending it over channels instead of locking it.
needs: [thread]
leads_to: []
compare_with: [mutex, deadlock]
---

# Message passing

Message passing is a way to share data between [[thread|threads]]
without locking it. Instead of several threads reading and writing one
structure under a [[mutex]], the data belongs to one thread at a time,
and it moves between them as messages over a channel. Go builds its
concurrency around this idea, summed up as "do not communicate by
sharing memory; instead, share memory by communicating".

## Hand the data over instead of guarding it

Take a program that polls a list of URLs with several workers. The
lock-based version keeps every resource in one shared slice with a
mutex. Each worker locks it, scans for a resource that isn't being
polled and was polled longest ago, marks it "polling", unlocks, polls,
then locks again to record the result. The bookkeeping (a `polling`
flag, a `lastPolled` time) lives in the shared data only so the workers
can coordinate.

The message-passing version gives each worker two channels:

```go
func Poller(in, out chan *Resource) {
    for r := range in {
        // poll the URL
        out <- r
    }
}
```

A resource is in exactly one place at a time: in the `in` channel,
held by one worker, or in the `out` channel. The worker that received
it is the only one that touches it, so there's nothing to lock. The
coordination is the channel itself. The idea goes back to Tony Hoare's
Communicating Sequential Processes.

## The channel is also the synchronization

Handing over a pointer is only safe if the receiver sees everything the
sender wrote before sending. Go's [[memory-model]] guarantees exactly
that: a send on a channel happens before the matching receive
completes. So if one goroutine fills in a struct and sends a pointer to
it, the goroutine that receives the pointer sees the filled-in struct,
with no lock and no atomic.

A few more rules come with it:

- Closing a channel counts like a send: it happens before any receive
  that returns because the channel is closed. Every receiver sees it,
  which makes closing a way to say "no more work".
- On an unbuffered channel, the receive also happens before the send
  completes. The two goroutines meet.
- A buffered channel with capacity C works as a counting semaphore. If
  every goroutine sends into it before its work and receives after,
  at most C run the work at once.

## Where it gets tricky

**It moves the bugs, it doesn't remove them.** A study of 171 real
concurrency bugs in Docker, [[kubernetes|Kubernetes]], etcd, gRPC, CockroachDB and
BoltDB tested the belief that message passing is less error-prone. For
bugs where goroutines get stuck, about 58% came from message passing
and 42% from protecting shared memory, even though the programs used
shared-memory primitives more often. Message passing did cause far
fewer of the other kind, bugs where nothing gets stuck but the
program does the wrong thing.

**A send can wait forever.** The study's first example is from
Kubernetes. A function starts a goroutine to do some work and send the
result on an unbuffered channel, then waits in a `select` for either
the result or a [[timeouts|timeout]]. If the timeout wins, the function returns and
nobody will ever receive, so the worker goroutine blocks on its send
forever. The fix was small: a buffer of 1, so the send can complete
with nobody listening. Go's built-in detector only reports a [[deadlock]] when
every goroutine is stuck, so it misses them.

**Ownership is a convention.** Sending a pointer doesn't stop the
sender from using it. If the sender writes to the data after the send,
nothing orders that write before the receiver's reads, and you have a
data race again ([[race-condition]]).

## What this means when you build

- Use channels to pass ownership of work between stages: a request
  goes to one worker, a result comes back. After sending something,
  don't touch it.
- Use a buffered channel as a semaphore to cap how many goroutines do
  something at once.
- For every send, know who will receive it, including when the
  receiver gives up early. A buffer big enough for the sends, as in the
  Kubernetes fix, lets a sender finish with nobody listening.
- Channels aren't always simpler. For a small piece of shared state, a
  mutex may make ownership more obvious. Pick whichever does.

## Further reading

- [Share Memory By Communicating](https://go.dev/blog/codelab-share), Andrew Gerrand, 2010. The URL poller written with a mutex and with channels.
- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors, 2022. Exactly what a channel send, receive and close guarantee.
- [Understanding Real-World Concurrency Bugs in Go](https://songlh.github.io/paper/go-study.pdf), Tengfei Tu, Xiaoyu Liu, Linhai Song, Yiying Zhang, 2019. Evidence that message passing causes as many blocking bugs as locks do.
