---
id: littles-law
title: Little's law
depth: short
phase: 9
note: >-
  Items in the system = arrival rate × time in the system.
needs: []
leads_to: [queueing-theory, load-testing, back-of-envelope-estimation, consumer-lag, admission-control]
compare_with: [bounded-queues, amdahls-law]
---

# Little's law

Little's law says that the average number of things inside a system
equals the rate they arrive times the average time each one spends
inside: L = λW. For a server, that's requests in flight = requests per
second × average latency. It's the quickest way to size a
[[thread-pool|thread pool]] or a [[connection-pooling|connection pool]],
and to see why a slow dependency suddenly eats all your threads.

## One service, three numbers

Say a service gets 200 requests a second and each takes 50 ms on
average, queueing included. Then on average 200 × 0.05 = 10 requests
are inside it at any moment. If it hands each request to its own
thread, it needs about 10 threads busy on average, plus room for
bursts.

Now its database slows down and the average request takes 500 ms. The
arrival rate hasn't changed, so the number inside goes up tenfold, to
100. With a pool of 64 threads, the extra requests now wait in a
queue, and that waiting adds to their latency, which pushes the count
up further. Nothing about your code changed; the law just made the
consequence of slower requests visible.

Name the three numbers the same way every time:

- **L**, the average number in the system. For a server, requests in
  process, including ones still waiting in a queue.
- **λ** (lambda), the average arrival rate, in requests per second.
- **W**, the average time one request spends in the system. For a
  server, that's its latency.

Know any two and you get the third. Rate and latency are easy to
measure; concurrency often isn't, so you usually compute L. The
reverse works too: a pool of 20 database connections, each held about
40 ms per query, can serve at most 20 ÷ 0.04 = 500 queries a second.

## Why it holds

Draw the number of items in the system over some window of time, from
0 to T. Every arrival steps the line up by one, every departure steps
it down. Now look at the area under the line.

![A step chart of the number of items in the system over a window from 0 to T. Each arrival steps the line up by one and each departure steps it down; the shaded area under the line is labelled "area A, item-seconds spent inside". Below: L = A ÷ T is the average number inside, W = A ÷ N is the average time per item for N items, λ = N ÷ T is the arrival rate, so A ÷ T = (N ÷ T) × (A ÷ N), which is L = λ × W.](img/littles-law-area.svg)

*The whole proof is one area counted two ways. Adapted from John D. C. Little, "Little's Law as Viewed on Its 50th Anniversary", figure 2 (2011).*

That area, A, is counted in item-seconds. Divide it by the length of
the window and you get the average number inside, L. Divide it by the
number of items that came through, N, and you get the average time
each one spent inside, W. Since N ÷ T is the arrival rate, the two
views multiply out to L = λW.

The reason it works is plain: while an item waits, it's also being
counted. Every second it spends inside adds to the time in the system
and to the number in the system at once.

Because the proof uses nothing but that area, the law needs very
little:

- **No particular distribution.** Arrivals can be bursty, service
  times wildly uneven.
- **No queue order.** First-in-first-out, last-in-first-out, or
  priorities; the averages still fit.
- **No steady state.** Over a window you actually measured, it's exact,
  even if traffic rose and fell during it.
- **Any class of item.** It holds for one class of request alone
  (just the writes, say) as well as for all of them together.

## Where it gets tricky

**It's about averages only.** L = λW tells you the mean number in
flight, nothing about the worst moment or about p99 latency (see
[[latency-percentiles]]). Averages over a long window also blur spikes;
a burst at the top of every minute from cron jobs can sit inside a
calm-looking average.

**It describes, it doesn't predict.** The law ties together numbers you
measured. It won't tell you what latency will be at twice the load.
That needs a model of how waiting grows as the server gets busy, which
is [[queueing-theory]].

**The three numbers push on each other.** On paper λ and W are
independent. In a real system, latency rises as concurrency rises,
because requests compete for the same resources (a limit
[[amdahls-law]] describes). How arrivals react depends on the clients.
A fixed set of clients that each wait for a reply before sending the
next one send less when latency grows. Clients that send on their own
schedule don't slow down at all. And clients that time out and retry
send more when latency grows, which raises L, which raises W again.
That last loop is where overloads spiral (see
[[retries-with-backoff]]).

**Count the queue too.** L includes requests waiting for a thread, not
just the ones being worked on. If you size a pool from L measured
inside the workers, you miss the ones stuck in front of them.

## What this means when you build

- Size pools and limits from rate × latency, using the latency you'll
  see at peak, then add headroom for bursts.
- Watch in-flight requests. A rising count at a steady request rate
  means latency is rising.
- A [[timeouts|timeout]] caps W, and so caps how many requests one
  slow dependency can pin down. A [[bounded-queues|bounded queue]] caps
  L directly.
- In a load test, you can get the average concurrency from the request
  rate and mean latency you already record, without tracking the queue
  (see [[load-testing]]).
- For quick sizing math in a design discussion, this is the formula
  behind most of it ([[back-of-envelope-estimation]]).

## Further reading

- [Little's Law as Viewed on Its 50th Anniversary](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf), John D. C. Little, 2011. The author's own short proof, why the law holds, what it doesn't need, and a server load test read through it.
- [Telling Stories About Little's Law](https://brooker.co.za/blog/2018/06/20/littles-law.html), Marc Brooker, 2018. How arrival rate, latency and concurrency push on each other in real systems, and where the averages mislead.
