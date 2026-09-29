---
id: gabrielson-challenges-distributed-systems
title: Challenges with distributed systems (Amazon Builders' Library)
author: Jacob Gabrielson (Amazon Web Services)
url: https://aws.amazon.com/builders-library/challenges-with-distributed-systems/
kind: blog
primary: true
---

## Summary

An AWS senior principal engineer on why request/reply services are the
hardest kind of distributed system: one network call turns into eight steps
that can each fail independently, a timeout leaves the result UNKNOWN, the
test matrix explodes, and distributed bugs stay latent and spread. The live
URL now redirects to builder.aws.com, which renders with JavaScript; the
text was read from the Internet Archive's copy of the original page.

## Key claims

- The two root problems. "Independent failures and nondeterminism cause the most impactful issues in distributed systems." (Introduction)
- You can't always tell whether something failed. "What's worse, it's impossible always to know whether something failed." (Introduction)
- Three kinds of distributed system by difficulty: offline (batch), soft real-time, hard real-time (request/reply). "hard real-time distributed systems are the most difficult to get right." (Types of distributed systems)
- Offline systems get the benefits without most of the pain. "offline distributed systems get almost all of the benefits of distributed computing (scalability and fault tolerance) and almost none of the downsides" (Types of distributed systems)
- A request/reply round trip is always eight steps: post request, deliver request, validate request, update server state, post reply, deliver reply, validate reply, update client state. "Those are a lot of steps for one measly round trip!" (Request/reply messaging)
- On one machine, failures share fate, which cuts down what you must handle. "Fate sharing cuts down immensely on the different failure modes that an engineer has to handle." (Hard real-time systems are weird)
- Across a network, client, server and network don't share fate. "if the network fails, the client machine will keep working." (Handling failure modes)
- A timeout means the outcome is unknown. "timing out means that the result of the request is UNKNOWN. It may or may not have happened." (Handling failure modes)
- A refused connection is different: the client knows the server never got it. "the client knows, deterministically, that the request could not possibly have been received by the server machine." (Handling failure modes)
- The test matrix grows: 10 single-machine scenarios become 200 when each call can end five ways. "the test matrix balloons from 10 to 200!" (Testing)
- Distributed bugs can sit for months before the right combination triggers them. "they can be caused by bugs that were deployed to production months earlier." (Distributed bugs are often latent)
- Example: one catalog server with a full disk returned empty responses fast, the load balancer sent it more traffic, and amazon.com went down. "the entire website went down because one remote server couldn't display any product information." (Distributed bugs spread epidemically)
- Summary point: any network result can be UNKNOWN. "The result of any network operation can be UNKNOWN, in which case the request may have succeeded, failed, or received but not processed." (Summary)
- On one machine, the rare faults (overheating CPU, failed power supply, kernel panic) take everything down together. "For example, the CPU could spontaneously overheat at runtime." (Hard real-time systems are weird)
- Each remote call can end five ways. "four points in that code that have five different possible outcomes, as illustrated earlier (POST_FAILED, RETRYABLE, FATAL, UNKNOWN, or SUCCESS)." (Testing)

## Visuals worth redrawing

- The client, network, server diagram with the eight numbered steps.

## My notes

- Good for the "one call becomes many outcomes" framing in `distributed-system`.
