---
id: ryhl-async-what-is-blocking-2020
title: "Async: What is blocking?"
author: Alice Ryhl
url: https://ryhl.io/blog/async-what-is-blocking/
kind: blog
primary: true
---

## Summary

A 2020 post by a Tokio maintainer for new users of async Rust. Because
async tasks are scheduled cooperatively, a task that runs a long time
without reaching an `.await` stops every other task on that thread. It
shows the three-timers example, gives a rule of thumb for how long is
too long, and explains where to move blocking work (`spawn_blocking`,
rayon, a dedicated thread).

## Key claims

- Async Rust uses cooperative scheduling. "The async/await feature in Rust is implemented using a mechanism known as cooperative scheduling" (intro)
- The one rule. "Async code should never spend a long time without reaching an .await." (intro)
- Every runtime solves many-tasks the same way: swap the running task quickly; in Rust the swap happens at `.await`. "In Rust, this swapping happens when you .await something." (Blocking vs. non-blocking code)
- Blocking the thread, in async, means stopping the runtime from swapping tasks. "the phrase “blocking the thread” means “preventing the runtime from swapping the current task”." (Blocking vs. non-blocking code)
- Example: three tasks that each call `std::thread::sleep` for one second run one after another and take three seconds; with `tokio::time::sleep(...).await` they take one second. "The example will take three seconds to run, and the timers will run one after the other with no concurrency whatsoever." (Blocking vs. non-blocking code)
- Tokio's default runtime has one worker thread per core, so blocking can hide in tests and show up in production. "The default Tokio runtime spawns one thread per CPU core" (Blocking vs. non-blocking code)
- Rule of thumb for too long. "a good rule of thumb is no more than 10 to 100 microseconds between each .await." (Blocking vs. non-blocking code)
- The two usual reasons to block: CPU-heavy work and synchronous I/O. "Expensive CPU-bound computation." (What if I want to block?)
- `spawn_blocking` runs on a separate pool of up to around 500 threads, good for blocking I/O. "This thread pool has an upper limit of around 500 threads" (The spawn_blocking function)
- CPU-bound work runs best with one thread per core. "CPU-bound computations run most efficiently if the number of threads is equal to the number of CPU cores." (The spawn_blocking function)

## Visuals worth redrawing

None.

## My notes

- The 500-thread limit is Tokio's default as of the post (2020); check
  the Tokio docs before quoting it as current.
