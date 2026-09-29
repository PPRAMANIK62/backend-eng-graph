---
id: async-await
title: Async/await
depth: deep
phase: 4
note: >-
  How languages turn callbacks back into straight-line code: futures,
  state machines, colored functions.
needs: [event-loop, cpu-bound-vs-io-bound]
leads_to: []
compare_with: [green-threads, c10k, thread-pool]
---

# Async/await

Async/await is a language feature that lets you write code for an
[[event-loop]] as if it were ordinary blocking code. You mark a function
`async`, put `await` in front of each slow call, and the compiler cuts
the function into pieces that the event loop can pause and resume. You'll
meet it in JavaScript, Python, C#, Rust and others, and to use it well
you need to know what it turns your code into.

## The problem: an event loop can't wait

Take a request handler. It reads a request from a socket, looks
something up in a database, and writes a response. Written for a
[[thread-per-connection|thread per connection]], it's three lines, and
each line blocks its [[thread]] until the data is there.

An event loop can't do that. It's one thread serving thousands of
connections, and if the handler blocks on the database, every other
connection waits too. So each slow step has to start the operation,
register "call me back when it's done", and return to the loop. Your
handler becomes a chain of callbacks: read, and in the callback query,
and in that callback write.

The real cost is where the handler's state goes. In the blocking
version, the request and the query result are local variables on the
thread's stack. In the callback version, the stack is gone the moment
you return to the loop, so every variable a later step needs has to be
captured in a closure that lives on the heap. That transformation has a
name, continuation-passing style: "the rest of the function" becomes a
function you pass along. It started out as a form compilers use
internally, not something people were meant to write. Doing it by hand
means loops, `try`/`catch` and early returns no longer work across the
steps, because each step is a separate function.

Promises (also called futures) help a little. A promise is an object
that stands for a result that will arrive later, so you can pass it
around and chain `.then(...)` on it. You're still writing the rest of
the function as a callback.

## What `await` does

`await` tells the compiler where to cut the function. Everything after
an `await` becomes the continuation, and the compiler builds it for you.
Local variables that are still needed after the cut get saved
automatically. You write:

```
async fn handle(conn) {
    let req  = read_request(conn).await;
    let rows = db.query(req.key).await;
    write_response(conn, rows).await;
}
```

and it reads like the blocking version, with loops, error handling and
early returns working as usual.

Calling an async function doesn't run it the way a normal call would.
It returns an object that represents the work: a `Future` in Rust, a
coroutine object in Python, a `Task` in C#. In
Rust, nothing inside the function runs until someone polls that future.
Python warns you if a coroutine object is garbage collected without ever
being awaited, because that's almost always a bug.

C# had async/await long before most languages. Python added `async def`
and `await` in 3.5 (2015), and Rust shipped its version in 2019.

## What the compiler builds

Most languages compile an async function into continuation-passing
style: a chain of closures, one per piece. Python builds on generators,
so every chain of `await`s ends in a `yield` that hands control back to
the event loop.

Rust does it as a state machine, which is the clearest version to look
at. The compiler generates an enum with one state per `await` point.
Each state holds exactly the variables that are alive across that
`await`, plus the inner future being waited on.

![State diagram of the handle function compiled to a state machine. Start leads to Reading, which holds conn and the read future; then Querying, which holds conn, req and the query future; then Writing, which holds the write future; then Done. Each waiting state has a loop back to itself labelled Pending, taken when a poll finds the inner future not ready, and moves forward when it is ready.](img/async-await-state-machine.svg)

*The handler above as the state machine the compiler builds. Each state keeps only the variables still needed. Adapted from the Tokio tutorial, "Async in depth".*

When the future is polled, it runs forward as far as it can. If the
inner future isn't ready, it saves where it is and returns "pending".
The next poll picks up in the same state. The whole thing is one value
whose size is known at compile time, a "perfectly sized stack" that
holds only what's needed, instead of a thread's stack that has to be
big enough for anything.

Futures nest. Polling `handle` polls whichever inner future it's
waiting on, which polls the socket read below it. At the top sits one
outer future per request, called a task.

## Who runs it: executors and wakers

Something has to call poll on the task. In Rust that's the executor, a
runtime such as Tokio. In Python it's the asyncio event loop, in
JavaScript the browser's or Node's event loop.

A naive executor would poll every task in a loop, and burn a CPU doing
it, since most tasks are waiting most of the time. So a pending future
also hands over a way to be woken. In Rust that's a `Waker`:

1. The executor polls the task. The socket read isn't ready, so the
   read future records the task's waker with the socket's resource in
   the runtime and returns pending. (How a runtime learns that one of
   thousands of sockets is ready is [[io-multiplexing]].)
2. The executor moves on to other tasks, or sleeps if there are none.
3. Data arrives. The resource becomes ready, calls the waker, and the
   task goes back on the executor's queue.
4. The executor polls it again. This time the read completes and the
   state machine moves on to the query.

If a future returns pending and never arranges for the waker to be
called, the task hangs forever. That's a common bug when you write
futures by hand, and one reason to use the runtime's building blocks
instead.

## Colored functions

Async/await has a cost that spreads. An async function can only be
awaited from another async function, because only an async function
has a state machine to pause. If a function deep in your code starts
calling something async, it has to become async, then so does its
caller, and so on up to `main` or the event loop. This is the "colored
functions" problem: every function is either sync or async, and the two
don't mix freely.

Python made the color explicit on purpose. Without the `async` keyword,
a function would be async just because it contains an `await`, and
removing the last `await` during a refactor would silently turn it into
a normal function and break everything that awaits it.

Languages without colors have a different mechanism: several call
stacks that the runtime can switch between. A goroutine in Go can call
a function that reads from a socket, and the runtime parks the whole
goroutine, stack and all, until the data arrives. Nothing up the stack
needs to know. That's [[green-threads]], the main alternative to
async/await.

## Where it gets tricky

**Blocking inside async code stalls everything.** Tasks are scheduled
cooperatively: the executor can only switch tasks at an `await`. Three
tasks that each call a blocking one-second sleep, joined together, take
three seconds and run one after the other. With the runtime's async
sleep, they take one second. A CPU-heavy loop, a blocking file read or
a blocking database driver does the same thing. A Tokio maintainer's
rule of thumb (2020) is no more than 10 to 100 µs between `await`s.
Move longer work off the executor: to a [[thread-pool]] made for
blocking calls (`spawn_blocking` in Tokio), or for CPU-bound work to a
pool with one thread per core (see [[cpu-bound-vs-io-bound]]).

**It hides in tests.** Tokio's default runtime runs one worker thread
per core. A task that blocks only takes out one worker, so on a laptop
with 8 cores the problem may not show. Under production load, a handful
of blocking tasks takes out all of them.

**`await` in sequence is sequential.** Two `await`s in a row run one
after the other, even if the operations are independent. To overlap
them you have to ask for it, for example with Tokio's `join!`, which
runs several futures at the same time.

**Stackless vs stackful is a real disagreement.** Async/await is a
stackless design: the saved state lives in a compiler-built object.
Green threads are stackful: each task gets a real, growable stack. Rust
chose stackless because it has no garbage collector to move stacks
around, must be cheap to call from C, and wanted zero-cost state
machines. Those reasons are Rust's own; the person who designed Rust's
async/await doesn't claim it's the right choice for every language.
Java went the other way in JDK 21 with virtual threads, partly
because asynchronous code breaks stack traces, debuggers and profilers,
which lose track of which request a piece of work belongs to.

**Hand-written state machines are what async/await replaces.** Servers
in C often do the same thing by hand, with an explicit state per
connection. That's fast and error-prone: forgetting to save one piece of
state across a transition is an easy bug to write, and a curl CVE came
from exactly that.

## What this means when you build

- The phase 4 lab is in Go, which has no async/await. You'll meet it in
  the clients, proxies and tools around it, in Node, Python and Rust.
- In async code, never call something that blocks. Check that your
  database driver, HTTP client and file I/O are async versions, or move
  them to a blocking pool.
- If one slow request makes every request on the server slow, look for
  blocking code on the event loop first.
- Start independent operations together and await them together, when
  they don't depend on each other.
- Choosing between async/await and threads or green threads is a choice
  of language and runtime more than of code style. Know which one your
  stack uses.

## Further reading

- [Async in depth (Tokio tutorial)](https://tokio.rs/tokio/tutorial/async), Tokio project. The state machine an async fn compiles to, a tiny executor, and wakers, with code.
- [Why async Rust?](https://without.boats/blog/why-async-rust/), without.boats, 2023. Stackful vs stackless, why Rust dropped green threads, and how futures became state machines, from the designer.
- [What Color is Your Function?](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/), Bob Nystrom, 2015. The colored-functions problem, and why callbacks, promises and async/await all share it.
- [Async: What is blocking?](https://ryhl.io/blog/async-what-is-blocking/), Alice Ryhl, 2020. Cooperative scheduling in practice, the 10 to 100 µs rule, and where to put blocking work.
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444), Ron Pressler, Alan Bateman, JDK 21. Why Java chose cheap threads over asynchronous code, including what async does to stack traces and debuggers.
- [PEP 492: Coroutines with async and await syntax](https://peps.python.org/pep-0492/), Yury Selivanov, 2015. How Python added async/await on top of an event loop, and why the async keyword matters.
