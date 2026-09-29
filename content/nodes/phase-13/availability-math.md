---
id: availability-math
title: Availability math
depth: short
phase: 13
note: >-
  Nines, and how availability combines across dependencies in series and
  in parallel.
needs: []
leads_to: [sli-slo-sla, failure-domains]
compare_with: []
---

# Availability math

Availability is the share of time, or of requests, in which your
service works. A little arithmetic on it tells you how much downtime a
target allows, and what the services you depend on let you promise.

## What each nine allows

Targets are written in nines: 99.9% is "three nines", 99.99% is "four
nines". Each extra nine cuts the allowed downtime by ten.

| Target | Down per year | Down per month | Down per day |
|---|---|---|---|
| 99% | 3.65 days | 7.2 hours | 14.4 minutes |
| 99.9% | 8.76 hours | 43.2 minutes | 1.44 minutes |
| 99.95% | 4.38 hours | 21.6 minutes | 43.2 seconds |
| 99.99% | 52.6 minutes | 4.32 minutes | 8.64 seconds |
| 99.999% | 5.26 minutes | 25.9 seconds | 0.87 seconds |

Downtime has two parts: how often you fail and how long each failure
lasts. As a formula, availability is MTTF / (MTTF + MTTR): mean time to
failure over itself plus mean time to repair, which includes the time
before anyone notices.

That gives a quick sanity check. Three full outages a year, 20 minutes
each, add up to 60 minutes, and four nines allows about 53. The only
ways out are fewer outages, shorter ones, or smaller ones (an outage
that hits one shard out of five costs a fifth as much).

## Counting time, or counting requests

"Down for 52 minutes" assumes the service is either up or down. A
service spread over many machines is rarely all the way down; some part
of it is usually answering. So the other common way to count is by
requests: successful requests divided by all requests.

With that definition, a service taking 2.5 million requests a day with
a 99.99% daily target can fail 250 of them. The request count also
weights failures by traffic, so an outage at 3 a.m. costs less than one
at peak. Which definition you pick is part of choosing an indicator;
see [[sli-slo-sla]].

## Dependencies in series multiply

If your service can't work when a dependency is down (a hard, or
critical, dependency), their availabilities multiply. A service with
hard dependencies of availability a₁, a₂ and a₃ is at most
a₁ × a₂ × a₃ × (its own availability). Every number is below one, so
every dependency you add pulls the result down.

This is where the "rule of the extra 9" comes from: a critical
dependency should offer one more nine than you promise. Here's a worked
budget for a 99.99% service with five critical dependencies at 99.999%:

- The whole year allows 0.01% of 525,600 minutes, about 53 minutes.
- Each dependency may use 0.001%; five of them take 0.005%, about 26
  minutes.
- That leaves about 27 minutes a year for your own bugs, bad deploys
  and slow recoveries.

The rule doesn't compound down the tree: a dependency of a dependency
doesn't need two extra nines. Count each unique critical dependency
once, wherever it sits, and share the budget among them.

## Redundant copies in parallel multiply the failures

When you have two copies and either one is enough, the system is down
only when both are down at once. Now you multiply the chances of
failure instead. Two copies at 99% each fail at the same time 1% × 1%
of the time, 0.01%, so together they're 99.99%. Three copies at 99.9%
give, on paper, nine nines.

![Two panels. Left, dependencies in series: a request passes through service A, then B, then C, and the availability is a1 times a2 times a3, so each added dependency lowers it. Right, redundant copies in parallel: a request can be served by copy 1 or copy 2, and the system is down only when both are, so availability is 1 minus (1 minus a) squared; two copies at 99% give 99.99%. A warning under the right panel says this holds only if the copies fail independently.](img/availability-math-series-parallel.svg)

*Series multiplies availabilities; parallel multiplies failure chances. Adapted from Michael Haken, "Availability and Beyond" (AWS, 2021), and Ben Treynor et al., "The Calculus of Service Availability" (ACM Queue, 2017).*

Each spare costs about as much as the original, and returns shrink
fast: past three spares of something that's already 99% available, the
gain is fractions of a second a year. And a spare only counts if it
fails separately. Ten spare machines in one zone don't help when that
zone goes down; what you need is a spare zone. Place spares across the
[[failure-domains|units that actually fail together]]: machine, rack,
zone, region.

## Where it gets tricky

**Independence is the big lie in the parallel formula.** Real copies
share networks, power, deploys and control planes. The correlation is
never zero: one network backbone failure can take out many copies at
once. Three copies at 99.9% end up far below nine nines,
though well above three. Distance doesn't buy independence either: two different systems
in nearby places can be a better pair than two copies of the same
system far apart.

**The series product is a ceiling, not a forecast.** Dependencies often
do better than their published numbers, so a service built on a few
99.99% dependencies can itself reach 99.99%. The product gives an order
of magnitude, not a prediction.

**MTTF and MTTR are averages.** Real outages vary around them, and the
next failure likely has a new cause.

## What this means when you build

- List your critical dependencies before picking a target.
- For each dependency without an extra nine, make it softer: a cache,
  failing open, [[graceful-degradation]], or an async call so it's no
  longer on the request path.
- Check frequency × duration. If you can't fix an outage in the
  minutes your budget allows, make outages smaller (shards,
  [[cell-based-architecture|cells]]) or roll back automatically.
- Add spares at the level that fails together, and stop at a few.

## Further reading

- [Embracing Risk](https://sre.google/sre-book/embracing-risk/), Marc Alvidrez, Google SRE book, 2016. Nines, and time-based vs request-based availability.
- [Availability Table](https://sre.google/sre-book/availability-table/), Google SRE book appendix A, 2016. The downtime each target allows per year, month, week, day and hour.
- [The Calculus of Service Availability](https://static.googleusercontent.com/media/sre.google/en//static/pdf/calculus_of.pdf), Ben Treynor, Mike Dahlin, Vivek Rau, Betsy Beyer, ACM Queue, 2017. The rule of the extra 9 and a worked outage budget.
- [Availability and Beyond](https://docs.aws.amazon.com/whitepapers/latest/availability-and-beyond-improving-resilience/understanding-availability.html), Michael Haken, AWS, 2021. Series and parallel formulas, diminishing returns from spares, and the unit of failure. Marked historical by AWS.
