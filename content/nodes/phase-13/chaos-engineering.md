---
id: chaos-engineering
title: Chaos engineering
depth: deep
phase: 13
note: >-
  Failure experiments with a hypothesis, a steady-state measure and a
  stop condition. The phase 13 harness.
needs: [fault-injection, sli-slo-sla, postmortems]
leads_to: []
compare_with: [deterministic-simulation-testing]
---

# Chaos engineering

Chaos engineering is running experiments on a live system to find out
whether it really survives the failures you designed it for. Each
experiment has a hypothesis about a business-level metric, a fault you
introduce on purpose, and a limit on how much harm it's allowed to do.
You'd care because a failover path, a fallback or a retry policy you've
never exercised is only a guess about what will happen.

## One experiment, start to finish

Netflix's bookmark service remembers where you stopped watching. It's
nice to have, not essential: if it fails, the player should just start
from the beginning. That's a claim you can test.

1. **Pick the steady state.** Netflix watches stream starts per second
   (SPS): how many people press play and get video. It follows a
   predictable daily curve, so engineers can tell normal wobble from a
   real problem.
2. **Write the hypothesis.** "If the bookmark service fails, SPS stays
   about the same."
3. **Split the users.** Take a small percentage of users and divide them
   into a control group and an experiment group.
4. **Inject the fault.** For the experiment group only, fail every
   request to the bookmark service. The control group sees nothing
   unusual.
5. **Compare.** Run for a while, then compare SPS between the two
   groups. The experiment tries to *disprove* the hypothesis.

If the groups match, you have more confidence the fallback works. If
the experiment group's SPS drops, you've found a weakness before a real
outage did, affecting only a sliver of users.

![Flow of one chaos experiment. A steady-state metric (stream starts per second) and a hypothesis feed a split of a small slice of users into a control group and an experiment group. The fault, failing all bookmark requests, is applied only to the experiment group. Both groups' metric is compared: same means more confidence, different means a weakness was found. A stop condition watches throughout and halts the experiment if an alarm fires.](img/chaos-engineering-experiment.svg)

*The shape of an experiment: hypothesis, two groups, one fault, a comparison, and a stop condition over all of it. Adapted from the bookmark example in Ali Basiri and others, "Chaos Engineering" (IEEE Software, 2016).*

## Measure the output, not the internals

The steady state is something users feel, measured at the edge of the
system: stream starts, sign-ups, completed purchases per second,
throughput, error rate, latency percentiles. Not CPU load or query
time.

The reason is that a well-built system is supposed to absorb failures
inside. If the bookmark service is down and SPS doesn't move, the system
worked, even though one service is broken. Chaos engineering checks
*that* the system works, not *how*. Internal metrics still matter while
the experiment runs: if latency or CPU inside some service climbs, the
team may stop early even though SPS looks fine.

For your own service, the steady-state metric is usually one of your
[[sli-slo-sla|SLIs]].

## Choose faults the real world will send you

Chaos variables should look like real events: a server dying, a disk
filling up, memory running out, network latency spiking, malformed
responses, a traffic spike. Past outages are a good
place to look; that's one more reason to write
[[postmortems]]. Netflix's list included terminating instances,
injecting latency between services, failing requests between services,
failing a whole internal service, and making an entire AWS region
unavailable.

Sometimes you simulate instead of inject. Netflix doesn't actually take
an AWS region offline; it can't. It acts as if one were gone,
redirecting traffic to other regions, and watches what happens. How
realistic to be against how much risk to take is a judgment call every
time.

The tools that do the breaking are the same ones used for
[[fault-injection]]: killing processes, dropping or delaying packets,
failing calls. What changes here is where you run them and what you
measure.

## Stop conditions and blast radius

Running a fault in production means some users can get hurt. The
practice accepts a small amount of short-term harm and makes containing
it the experimenter's job.

- **Blast radius.** Apply the fault to a subset: a few users, one
  instance, one cell (see [[cell-based-architecture]]). Netflix's
  experiment above touched a small percentage of users. Chaos Monkey,
  which kills random production instances, only ran during working
  hours so engineers were around to respond.
- **Stop condition.** Decide before you start what ends the experiment
  early, and automate it. In AWS's Fault Injection Service it's part of
  every experiment template: a stop condition is an alarm threshold,
  and when the alarm fires the experiment stops.
- **A way back.** At Google's company-wide disaster tests (DiRT), every
  test is reviewed by a cross-functional technical team and has a plan
  to revert, and a staffed command center watches all running tests and
  steps in when something unexpected happens.

## Why production, and when not

Test environments differ from production in ways you can't fully
remove: behavior depends on environment and traffic, synthetic clients
don't behave like real ones, DNS setups differ. Some failures only appear in the
interaction between services. Netflix saw a client that queued outbound
requests without a limit; when a server it called got slow, the queue
grew until the client ran out of memory. That's the case for running
on real traffic.

That doesn't mean starting there. AWS recommends a planning phase and
pre-production runs before using its tool in production. Google's DiRT
uses sandboxes for tests that have never been tried, while noting that
sandboxes are less realistic. The honest path is: start small and in
staging, then move to production with a narrow blast radius and a stop
condition, then widen.

## Run it continuously, and test people too

The system changes all the time, so the result of last month's
experiment decays. Netflix ran Chaos Monkey continuously on weekdays and
region-failure exercises (Chaos Kong) monthly. Automating the
experiment is what keeps a passing result true.

Big scheduled events test something automation can't: people and
processes. In one DiRT exercise, a simulated earthquake took a data
center down and broke authentication in ways nobody predicted, which
locked most teams out of their workstations. In another, the first test
of the emergency communications plan found that exactly one person
could locate it and join the right call. Documentation that says how
something should work doesn't show that anyone will use it, or that it
works.

## Where it gets tricky

**It isn't just "break things in production".** Without a steady-state
metric and a hypothesis, killing servers teaches you little, and
without a stop condition it's just an outage you caused. The discipline
is the experiment around the fault.

**It's not the same as fault injection or simulation testing.**
[[fault-injection]] in a test cluster and
[[deterministic-simulation-testing]] both keep the experiment in an
environment you control, and check correctness in detail. Chaos
engineering trades that control for realism: real traffic, real
dependencies, and a business metric as the judge.

**It can cause the outage.** DiRT has caused accidental outages and, in
some cases, lost revenue. The defense is the blast radius and stop
condition, not luck.

**A pass proves little.** One clean run says those faults, at that
moment, on that traffic, didn't hurt. Many real failures come from
combinations of events, and the space of combinations is huge. How to
choose which experiments to run was still an open question when
Netflix wrote the practice down.

**Finding problems isn't the point, fixing them is.** A test that turns
up weaknesses nobody fixes has almost no value. And when a test breaks something, the focus
belongs on fixing it, not on blaming a person or team.

**Services can't pre-pass.** At DiRT, a team can declare in advance that
it will fail a test and be excluded, since the result is already known.
There's no way to declare you'd pass; you have to run it.

## What this means when you build

- Write every experiment down before running it: the steady-state
  metric, the hypothesis, the fault, the blast radius, the stop
  condition. That's also the shape of the phase 13 harness in this
  project's lab.
- Use a user-facing metric, ideally an SLI, for the hypothesis, and
  watch internal metrics as early warning.
- Start with faults you already believe you handle: an instance dying,
  a dependency timing out. Then a dependency returning errors, then a
  zone, then combinations.
- Automate the stop condition, and decide it before you start.
- Use experiments to find the load at which the system stops healing
  itself; that's how you find [[metastable-failures]] before they find
  you.
- Test the humans too: on-call handoffs, restore procedures,
  communication plans.

## Further reading

- [Principles of Chaos Engineering](https://principlesofchaos.org/), chaos engineering community, last updated 2019. The definition, the four-step experiment and the five advanced principles, in one page.
- [Chaos Engineering](https://arxiv.org/pdf/1702.05843), Ali Basiri and others (Netflix), IEEE Software, 2016. Where the principles came from: SPS, the bookmark experiment, Chaos Monkey and Chaos Kong.
- [Weathering the Unexpected](https://queue.acm.org/detail.cfm?id=2371516), Kripa Krishnan (Google), ACM Queue, 2012. Google's DiRT: how it grew, what it tests including people and processes, and how risk is managed.
- [What is AWS Fault Injection Service?](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html), AWS. A concrete experiment template: actions, targets and stop conditions.
