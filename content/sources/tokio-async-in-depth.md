---
id: tokio-async-in-depth
title: Async in depth (Tokio tutorial)
author: Tokio project
url: https://tokio.rs/tokio/tutorial/async
kind: docs
primary: true
---

## Summary

The Tokio tutorial's chapter on how Rust async works underneath. It
shows the `Future` trait, the enum state machine the compiler generates
for an `async fn`, a tiny executor ("mini-tokio") that polls tasks, and
wakers, which let a resource tell the executor a task can make progress.
Written by the team that builds Tokio, Rust's most used async runtime.

## Key claims

- A future holds an in-progress computation and implements `Future`, whose one method is `poll`. "They are values that contain the in-progress asynchronous computation." (Futures)
- A Rust future doesn't run in the background; its owner drives it by polling. "a Rust future does not represent a computation happening in the background, rather the Rust future is the computation itself." (Futures)
- Calling an async function runs nothing yet. The example's comment after calling `my_async_fn()`: "Nothing has been printed yet." (Futures)
- The compiler turns an async fn into an enum of states, one per await point. "Rust futures are state machines." (Async fn as a Future)
- `poll` advances as far as it can, then returns `Ready` or `Pending`. "When poll is invoked, the future attempts to advance its internal state as much as possible." (Async fn as a Future)
- Futures are nested: polling the outer one polls the inner one. "Calling poll on the outer future results in calling the inner future's poll function." (Async fn as a Future)
- The executor polls the outermost future (the task). "The executor is responsible for calling Future::poll on the outer future, driving the asynchronous computation to completion." (Executors)
- An executor that polls everything in a loop burns CPU; it should poll only tasks that can progress. "Ideally, we want mini-tokio to only poll futures when the future is able to make progress." (Mini Tokio)
- Wakers are how a resource tells the executor a task is ready. "Wakers are the missing piece." (Wakers)
- Returning Pending without arranging a wake hangs the task. "Forgetting to wake a task after returning Poll::Pending is a common source of bugs." (Wakers)
- Summary of the model: operations are lazy and must be polled. "Asynchronous Rust operations are lazy and require a caller to poll them." (Summary)

## Visuals worth redrawing

- The `MainFuture` enum (State0, State1(Delay), Terminated) as a small
  state diagram of an async function.

## My notes

- Tokio's tutorial page has no version in the text; the code uses
  `futures = "0.3"` and Tokio 1.x APIs.
