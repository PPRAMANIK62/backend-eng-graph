---
id: nystrom-function-color-2015
title: What Color is Your Function?
author: Bob Nystrom
url: https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/
kind: blog
primary: false
---

## Summary

The post (2015) that named the "function coloring" problem. Using a
made-up language where every function is red or blue, it shows how
async functions split a codebase in two: callbacks, promises and even
async/await keep the split, and only languages with multiple switchable
call stacks (threads, goroutines, Lua coroutines, Ruby fibers) avoid
it. Nystrom worked on Dart, a language with async/await, when he wrote
it; not primary for any one language.

## Key claims

- Rule 3 of the allegory: red (async) functions can only be called from red functions. "You can only call a red function from within another red function." (What color is your function?)
- Red functions are async ones. "Red functions are asynchronous ones." (A colorful allegory)
- Promises (futures) wrap a callback and error handler as an object but keep the split. "You’ve still divided your entire world into asynchronous and synchronous halves and all of the misery that entails." (I promise the future is better)
- Async/await makes async calls easy to write but keeps two colors. "Async-await solves annoying rule #4: they make red functions not much worse to call than blue ones." (I’m awaiting a solution)
- The world is still split with async/await. "But… you still have divided the world in two." (I’m awaiting a solution)
- Languages without colors all have multiple switchable call stacks. "Threads. Or, more precisely: multiple independent callstacks that can be switched between." (What language isn’t colored?)
- These can be user-space: goroutines, Lua coroutines, Ruby fibers. "It isn’t strictly necessary for them to be operating system threads." (What language isn’t colored?)
- The root problem is resuming after I/O without a call stack to come back to. "The fundamental problem is “How do you pick up where you left off when an operation completes”?" (Remembrance of operations past)
- Callbacks move the stack's data into closures on the heap; this is continuation-passing style. "There’s actually a name for this transformation: continuation-passing style." (Remembrance of operations past)
- await tells the compiler where to split the function. "it’s a clue to the compiler to say, “break the function in half here”." (Awaiting a generated solution)
- Everything above an async call must also return, so the color spreads to main. "You have to closurify the entire callstack all the way back to main() or the event handler." (Awaiting a generated solution)
- With threads, green or OS, you can suspend the whole stack instead. "You can just suspend the entire thread and hop straight back to the OS or event loop without having to return from all of those functions." (Reified callstacks)
- Go parks a goroutine on I/O, so its I/O functions look synchronous and there's no color. "As soon as you do any IO operation, it just parks that goroutine and resumes any other ones that aren’t blocked on IO." (Reified callstacks)
- Continuation-passing style started as a compiler intermediate representation, not something programmers were meant to write. "It was invented by language hackers in the 70s as an intermediate representation to use in the internals of their compilers." (Remembrance of operations past)

## Visuals worth redrawing

None.

## My notes

- Opinionated and funny; good for the "colored functions" idea, not
  for how any runtime is built.
- Java is praised as colorless because it used blocking threads; this
  predates Java's virtual threads (JEP 444).
