---
id: hayashibara-phi-accrual-2004
title: The φ Accrual Failure Detector
author: Naohiro Hayashibara, Xavier Défago, Rami Yared and Takuya Katayama
url: https://dspace.jaist.ac.jp/dspace/bitstream/10119/4784/1/IS-RR-2004-010.pdf
kind: paper
primary: true
---

## Summary

The JAIST research report (IS-RR-2004-010, 2004) that introduced accrual
failure detectors: instead of answering "trusted" or "suspected", the
detector outputs a suspicion level on a continuous scale, and each
application picks its own threshold. The φ detector computes that level
from the recent distribution of heartbeat arrival gaps. Evaluated on a
week of heartbeats between Japan and Switzerland.

## Key claims

- Classic failure detectors give a yes/no answer; accrual detectors give a level of suspicion. "Instead of providing information of a boolean nature (trust vs. suspect), accrual failure detectors output a suspicion level on a continuous scale." (Abstract)
- There's a built-in tradeoff between detecting fast and not being wrong. "there exists an inherent tradeoff between (1) conservative failure detection (i.e., reducing the risk of wrongly suspecting a running process), and (2) aggressive failure detection (i.e., quickly detecting the occurrence of a real crash)." (I)
- If the process really crashed, the value keeps growing. "If the process actually crashes, the value is guaranteed to accrue over time and tend toward infinity, hence the name." (I)
- Low threshold: fast detection, many mistakes; high threshold: the reverse. "A low threshold is prone to generate many wrong suspicions but ensures a quick detection in the event of a real crash." (I)
- Different reactions at different suspicion levels, e.g. a master that first stops sending jobs to a worker, then resubmits its jobs, then removes it. "the master simply flags the worker process pw and temporarily stops sending new jobs to pw ." (I, example)
- Consensus can't be solved deterministically in an asynchronous system with one crash, because crashed and slow look the same. "The impossibility is based on the fact that, in such a system, a crashed process cannot be distinguished from a very slow one." (II-A)
- The eventually perfect class ◇P is enough to solve consensus: strong completeness and eventual strong accuracy. "There is a time after which correct processes are not suspected by any correct process." (II-A, Property 2)
- Sending heartbeats faster doesn't help much: more traffic and more network stack work can raise the transmission time itself. "In fact, reducing ∆i further would generate both a larger amount of traffic on the network and a higher activity in the network stacks." (II-D-3)
- Two quality measures: detection time and mistake rate. "The detection time is the time that elapses since the crash of p and until q begins to suspect p permanently." (II-B)
- Heartbeat detection: p sends a heartbeat every interval; q suspects p if none arrives within the timeout. "Process q suspects process p if it fails to receive any heartbeat message from p for a period of time determined by a timeout" (II-C)
- A fixed timeout trades speed for mistakes. "If the timeout (∆to ) is short, crashes are detected quickly but the likeliness of wrong suspicions is high." (II-C)
- Adaptive detectors change the timeout with network conditions. "The principal difference with using a fixed heartbeat strategy is that the timeout is modified dynamically according to network conditions." (II-D)
- The heartbeat interval is set by the system more than by requirements: detection can't be faster than the transmission time. "Indeed, the detection time cannot possibly be shorter than the transmission time." (II-D-3)
- Failure detection has three parts: monitoring, interpretation, action; accrual detectors leave interpretation to the application. "In traditional timeout-based implementations of failure detectors, the monitoring and interpretation parts are combined within the failure detector" (III-A)
- φ is minus the log10 of the chance a heartbeat arrives this late or later. "ϕ(tnow ) = − log10 (Plater (tnow − Tlast ))" (IV-A, equation 2)
- Meaning of φ: threshold 1 means about a 10% chance the suspicion is wrong, 2 about 1%, 3 about 0.1%. "The likeliness is about 1 % with Φ = 2, 0.1 % with Φ = 3, and so on." (IV-A)
- Arrival times go into a fixed-size sliding window, from which mean and variance are kept. "The monitoring process (q in our model) stores heartbeat arrival times into a sampling window of fixed size WS ." (IV-B-1)
- It assumes the gaps between heartbeats follow a normal distribution. "The estimation of the distribution of inter-arrival times assumes that inter-arrivals follow a normal distribution." (IV-B-2)
- Experiment: UDP heartbeats about ten per second, for one week, nearly 6 million samples, Japan to Switzerland. "The experiment ran uninterruptedly for a period of one week, gathering a total of nearly 6 million samples." (I, Contribution)
- An accrual detector doesn't escape FLP; it can be built probabilistically, not deterministically. "both kinds of failure detectors can be implemented probabilistically." (III-C)

## Visuals worth redrawing

- Fig. 1: heartbeat failure detection and its parameters (interval, timeout, transmission time).
- Fig. 2 vs Fig. 3: traditional detector (monitoring and interpretation together, boolean out) vs accrual detector (applications interpret a shared value).
- Fig. 4: information flow of the φ detector, with two applications using different thresholds.

## My notes

- This is the research report; a shorter version appeared at SRDS 2004.
  Akka and Cassandra both implement φ.
- The normal-distribution assumption is a modelling choice; the paper
  doesn't claim gaps are really normal.
