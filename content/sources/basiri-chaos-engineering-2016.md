---
id: basiri-chaos-engineering-2016
title: Chaos Engineering
author: Ali Basiri, Niosha Behnam, Ruud de Rooij, Lorin Hochstein, Luke Kosewski, Justin Reynolds, Casey Rosenthal (Netflix)
url: https://arxiv.org/pdf/1702.05843
kind: paper
primary: true
---

## Summary

The Netflix Traffic and Chaos team's IEEE Software article (2016; arXiv
copy read). Explains why they moved from Chaos Monkey to a discipline,
the system (not functional) view, the four principles, stream starts per
second (SPS) as the steady-state metric, and a worked experiment that
fails the bookmark service for a small experimental group.

## Key claims

- Chaos Monkey terminates random production VM instances, only during working hours. "Chaos Monkey is only active during normal working hours so that engineers can respond quickly if a service fails due to an instance termination." (Introduction)
- Chaos Kong simulates losing a whole EC2 region; FIT fails requests between services. "we perform "Chaos Kong" exercises that simulate the failure of an entire Amazon EC2 region" (Introduction)
- Observe the system at its boundary. "we can better understand the behavior of this system by injecting real-world inputs (e.g., transient network failures, surges in incoming requests, malformed data inputs) and observing what happens at the system boundary." (Shifting to a system perspective)
- SPS, stream starts per second, is the primary health signal. "We call this metric SPS, for (stream) starts per second [9]." (Build a hypothesis around steady state behavior)
- Other domains use other business metrics, e.g. purchases per second. "an e-commerce site might use a metric such as number of completed purchases per second" (Build a hypothesis around steady state behavior)
- Finer metrics like CPU aren't the hypothesis, but can end an experiment early. "We may even conclude an experiment early if fine-grained metrics indicate that the system is not functioning correctly, even though SPS has not been impacted." (Build a hypothesis around steady state behavior)
- Inputs used at Netflix: kill instances, add latency, fail requests, fail a service, make a region unavailable. "inject latency into requests between services" (Vary real-world events)
- They don't really take a region offline; they simulate it by redirecting traffic. "at Netflix we do not actually take an entire Amazon region offline, since we don't have the capability to do so." (Vary real-world events)
- Apply the fault to a subset of users to reduce risk. "This allows us to reduce the scope of the experiment to a subset of users as a risk mitigation strategy." (Vary real-world events)
- Why production: test environments differ from real clients and DNS setup. "There will always be differences such as how synthetic clients behave compared to real clients, or DNS configuration issues." (Run experiments in production)
- Example failure found only through interaction: an unbounded client queue filled memory while a server was slow. "One of the clients places outbound requests on an unbounded local queue." (Run experiments in production)
- Confidence in old results decays as the system changes. "Because of these changes, our confidence in the results of past experiments decreases over time." (Automate experiments to run continuously)
- Chaos Kong ran monthly. "we run Chaos Kong exercises at a cadence of once a month." (Automate experiments to run continuously)
- Worked example: fail bookmark requests for the experimental group, compare SPS with the control group. "We hypothesize that the SPS values will be approximately equal for these two groups." (Running a Chaos experiment)
- Many failures come from combinations of events. "Research shows that many failures are triggered by combinations of events rather than single events [10]." (The Future of Chaos Engineering)
- Which experiments to run was an open question. "How do we decide what set of experiments to run?" (The Future of Chaos Engineering)
- (For chaos-engineering.) SPS follows a predictable daily curve, so engineers can judge fluctuations. "Similarly, the SPS metric varies slowly and predictably over the course of a day" (Build a hypothesis around steady state behavior)
- Real-world inputs include dying servers, full disks and latency spikes. "the servers we run on die, or their hard disks fill up, or their memory is exhausted, network latencies temporarily spike by several orders of magnitude, and traffic from our clients can spike unexpectedly." (Vary real-world events)
- Past outages are a source of experiment inputs, one more reason for postmortems. "Providing access to this historical data is yet another reason for doing post-mortems on system outages." (Vary real-world events)
- Chaos Monkey ran continuously on weekdays. "at Netflix, while we have Chaos Monkey running continuously during weekdays, we run Chaos Kong exercises at a cadence of once a month." (Automate experiments to run continuously)

## Visuals worth redrawing

- Figure 2: SPS over 24 hours against the prior week's trend (no y-axis values). Could be redrawn as a shape only.

## My notes

- The arXiv text has soft hyphens in some words (real-world, fine-grained); quotes use a plain hyphen there.
