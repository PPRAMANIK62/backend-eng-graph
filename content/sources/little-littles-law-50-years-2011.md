---
id: little-littles-law-50-years-2011
title: "Little's Law as Viewed on Its 50th Anniversary"
author: John D. C. Little
url: https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf
kind: paper
primary: true
---

## Summary

Little looks back on his 1961 proof of L = λW, in Operations Research
vol. 59 no. 3 (2011). He gives a short proof over a finite observation
window, explains why the law holds (an item in the queue is also
waiting), lists what it doesn't need (steady state, a service step, a
queue order), and shows it used on a server load test. The copy read is
a PDF hosted on a UMass course page.

## Key claims

- The law. "Little’s Law says that the average number of items in a queuing system, denoted L, equals the average arrival rate of items to the system, λ, multiplied by the average waiting time of an item in the system, W." (§1)
- Over a finite window it's exact, not an approximation. "the finite time interval guarantees that the relationship L = λW is numerically exact" (§2)
- The proof is one picture: plot items in the system over time; the area under the curve A gives L = A/T, λ = N/T and W = A/N, so L = λW. (§2.1.2, Figure 2)
- Why it's true. "An item in queue is also waiting." (§2.1.3)
- The same area is counted twice. "at the same time that a customer is standing in line and so can be counted, he or she is also accumulating minutes waiting." (§2.1.3)
- The three are different kinds of average. "Each of the quantities in the formula is a different average with different dimensions." (§2.1.4)
- It describes what happened; it doesn't predict. "It just says that we are in the measurement business, not the forecasting business." (§2.1.4)
- No steady state needed. "LL.1 holds under nonstationary conditions." (§2.1.4)
- Queue order doesn't matter (FIFO, LIFO, priority). "LL.1 holds independent of queue discipline." (§2.1.4)
- The system never has to be empty, and there doesn't have to be a service step. "LL.2 holds even if there is no service operation." (§2.2.3)
- It holds for each class of item separately (Lk = λk Wk) as well as for all of them together. (§2.2.3, corollary 3)
- Its main use. "If you know two of {L, λ, W}, you can quickly calculate the third." (§2.3)
- On a server: L is the average number of requests in process, λ requests per second, W the average response time, which is latency. "W = average response time per request (seconds) = latency" (§4.1)
- A load test of an Intel server run by a Microsoft FAST Search service: the queue grew about linearly with load, then climbed steeply. "After about 18 requests/second further requests are essentially dumped." (§4.1.1, Figure 4)
- In that test, big queues slowed the server itself, so it wasn't a fixed-rate queue. "An important feature is that increasing λ increases L, which in turn decreases μ." (§4.1.1, remark vi)
- The test measured W and used the law to get L, instead of tracking the queue. "It is much easier to use LL." (§4.1.1, remark v)

## Visuals worth redrawing

- Figure 2: number in the system n(t) over a window [0, T], with the
  area under the curve shaded. The whole proof in one picture.
- Figure 4: latency and requests in process against arrival rate for
  one server under a load test, both bending up sharply.

## My notes

- The PDF's text layer turns λ into another character; the quotes above
  use λ as printed.
- The load test figures are from 2010 hardware under a proprietary
  workload. Good for the shape, not for numbers to reuse.
