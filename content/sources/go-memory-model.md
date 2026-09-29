---
id: go-memory-model
title: The Go Memory Model
author: The Go Authors (Russ Cox)
url: https://go.dev/ref/mem
kind: spec
primary: true
---

## Summary

The official Go memory model, in its 2022 revision. Says when a read in
one goroutine is guaranteed to see a write in another, defines data
races and happens-before, promises sequential consistency for race-free
programs (DRF-SC), and lists which operations synchronize: channels,
mutexes, Once, atomics, goroutine start. Also limits what a racy Go
program can do, and which compiler optimizations are banned.

## Key claims

- What it covers. "The Go memory model specifies the conditions under which reads of a variable in one goroutine can be guaranteed to observe values produced by writes to the same variable in a different goroutine." (Introduction)
- Shared data needs serialized access. "Programs that modify data being simultaneously accessed by multiple goroutines must serialize such access." (Advice)
- Tools for it: channels, sync, sync/atomic. "To serialize access, protect the data with channel operations or other synchronization primitives such as those in the sync and sync/atomic packages." (Advice)
- "Don't be clever." (Advice)
- Data race definition. "A data race is defined as a write to a memory location happening concurrently with another read or write to that same location, unless all the accesses involved are atomic data accesses as provided by the sync/atomic package." (Informal Overview)
- DRF-SC. "In the absence of data races, Go programs behave as if all the goroutines were multiplexed onto a single processor." (Informal Overview)
- Racy Go programs have limited outcomes, unlike C/C++ where anything can happen; word-sized reads must see a value actually written. "most races have a limited number of outcomes, and less like C and C++, where the meaning of any program with a race is entirely undefined" (Informal Overview)
- Happens before is the transitive closure of sequenced-before and synchronized-before. "The happens before relation is defined as the transitive closure of the union of the sequenced before and synchronized before relations." (Memory Model)
- A race is two accesses, at least one a write and one non-synchronizing, not ordered by happens before. (Memory Model, read-write and write-write data race)
- The same DRF-SC guarantee as other languages. "The intent of the formal definition is to match the DRF-SC guarantee provided to race-free programs by other languages, including C, C++, Java, JavaScript, Rust, and Swift." (Memory Model)
- The race detector halts on a race. "Implementations using ThreadSanitizer (accessed with “go build -race”) do exactly this." (Implementation Restrictions)
- Races on multiword values (interfaces, maps, slices, strings) can corrupt memory. "such races can in turn lead to arbitrary memory corruption." (Implementation Restrictions)
- The go statement orders before the new goroutine. "The go statement that starts a new goroutine is synchronized before the start of the goroutine's execution." (Goroutine creation)
- Goroutine start synchronizes; goroutine exit doesn't. "The exit of a goroutine is not guaranteed to be synchronized before any event in the program." (Goroutine destruction)
- Channel send happens before the receive completes. "A send on a channel is synchronized before the completion of the corresponding receive from that channel." (Channel communication)
- Channels are the main tool. "Channel communication is the main method of synchronization between goroutines." (Channel communication)
- Close counts like a send. "The closing of a channel is synchronized before a receive that returns a zero value because the channel is closed." (Channel communication)
- Unbuffered: the receive happens before the send completes. "A receive from an unbuffered channel is synchronized before the completion of the corresponding send on that channel." (Channel communication)
- A buffered channel of capacity C works as a counting semaphore. "The kth receive from a channel with capacity C is synchronized before the completion of the k+Cth send on that channel." (Channel communication)
- Mutex: unlock n happens before lock m returns, for n < m. "For any sync.Mutex or sync.RWMutex variable l and n < m, call n of l.Unlock() is synchronized before call m of l.Lock() returns." (Locks)
- Atomics behave as one sequentially consistent order, like C++ seq_cst and Java volatile. "All the atomic operations executed in a program behave as though executed in some sequentially consistent order." (Atomic Values)
- Racy readers can see writes out of order: after f does a = 1; b = 2, g can print b = 2 then a = 0. "it can happen that g prints 2 and then 0." (Incorrect synchronization)
- Double-checked locking with a plain bool is broken. "there is no guarantee that, in doprint, observing the write to done implies observing the write to a." (Incorrect synchronization)
- A busy-wait on a plain bool may never end. "The loop in main is not guaranteed to finish." (Incorrect synchronization)
- The fix for all of them. "In all these examples, the solution is the same: use explicit synchronization." (Incorrect synchronization)
- The compiler must not introduce writes, and must not let one read see several values. "a compiler must not introduce writes that do not exist in the original program, it must not allow a single read to observe multiple values, and it must not allow a single write to write multiple values." (Incorrect compilation)
- Example: the compiler must not invert `*p = 1; if cond { *p = 2 }` into `*p = 2; if !cond { *p = 1 }`. "a compiler must not invert the conditional in this program" (Incorrect compilation)
- C/C++ compilers may do these optimizations. "Note that all these optimizations are permitted in C/C++ compilers" (Incorrect compilation)

## Visuals worth redrawing

None as figures; the message-passing example with a channel (write a,
send on c, receive on c, print a) is a good happens-before chain to draw.

## My notes

- Follows Boehm and Adve's PLDI 2008 C++ model for the formal part.
