---
id: brooker-littles-law-stories-2018
title: "Telling Stories About Little's Law"
author: Marc Brooker
url: https://brooker.co.za/blog/2018/06/20/littles-law.html
kind: blog
primary: false
---

## Summary

A 2018 post by an AWS engineer (EC2, EBS, serverless). Little's law
assumes long-term averages and treats arrival rate and time in system
as independent. In real systems each one pushes on the others: latency
rises with concurrency, and arrival rate can fall, stay put or rise
with latency, depending on how clients behave. He suggests stepping
through time as a way to tell the story of an overload.

## Key claims

- The law in his notation. "The law says that the mean concurrency in the system (𝐿) is equal to the mean rate at which requests arrive (λ) multiplied by the mean time that each request spends in the system (𝑊)" (opening)
- Why concurrency is worth knowing. "Concurrency is a useful measure of capacity in real systems, because it directly measures consumption of resources like threads, memory, connections, file handles and anything else that’s numerically limited." (opening)
- The assumptions. "each of the terms are long-term averages, and λ and 𝑊 are independent. In the real world, distributed systems don’t tend to actually behave this nicely." (Feedback)
- Latency grows with concurrency. "Request time (𝑊) tends to increase as concurrency (𝐿) increases." (Feedback)
- Closed clients: a fixed number of clients, each with fixed concurrency, send less when latency rises. "Arrival rate drops as request time increases (λ ∝ 1/𝑊)." (Feedback)
- Open clients ignore latency. "The widely-used Poisson process client model behaves this way." (Feedback)
- Timeouts and retries make arrival rate rise with latency. "One cause of this is timeout and retry" (Feedback)
- The result. "the dynamic behavior of distributed systems has scary cliffs." (Feedback)
- Means hide the tail. "The mean is very convenient in the mathematics of Little’s law, but tends to hide effects caused by high-percentile behavior." (Arrival Processes and Spiky Behavior)
- A big source of spikes. "For many systems, though, the biggest cause of spikes is the combination of human biases and computer precision: cron jobs." (Arrival Processes and Spiky Behavior)
- Amdahl's law is the simplest model of latency rising with concurrency, and an optimistic one. "Amdahl’s law is also wildly optimistic" (Feedback)

## Visuals worth redrawing

None; the post has no figures.

## My notes

- Written by a practitioner, not the law's author, so primary: false.
- The difference-equation "story" at the end is a thinking tool, not a
  result.
