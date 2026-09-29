---
id: system-design-method
title: A method for system design
depth: deep
phase: 17
note: >-
  Requirements, rough numbers, data model, API, then the bottlenecks.
needs: [backend-engineer, back-of-envelope-estimation]
leads_to: []
compare_with: [monolith-vs-microservices, feed-fan-out]
---

# A method for system design

System design, a core part of a [[backend-engineer|backend engineer]]'s
work, is deciding what the parts of a system are, what data
each one keeps, how they talk, and how it all holds up under load and
failure. A method gives that work an order: what it must do, how well,
rough numbers, the data and the API, the simplest design that works,
then the bottleneck, again and again. The order matters because each
step constrains the next, and skipping one usually means designing the
wrong system well.

## Start from what it must do, and how well

Take a real example from Google's SRE workbook: advertisers want a
dashboard showing the click-through rate of each of their ads, broken
down by search term. That's a clicks-divided-by-impressions number,
computed from two logs: one of searches and the ads shown, one of ad
clicks.

Requirements come in two kinds:

- **Functional**: what users can do. "An advertiser can see the
  click-through rate for each ad and search term." Keep this list
  short. Interview guides push you to the top three features, and a
  real design doc does the same with its goals and its **non-goals**:
  things that could reasonably be goals but that you've chosen not to
  do.
- **Non-functional**: how well it must do it. Fast, fresh, available,
  durable, secure. These only help when they're numbers tied to a
  specific part of the system. "Low latency" says nothing; "search
  answers in under 500 ms" names the part and the target.

The SRE example writes its non-functional requirements as
[[sli-slo-sla|SLOs]]: 99.9% of dashboard queries finish in under a
second, and 99.9% of the time the data shown is less than 5 minutes
old. It also fixes the load: 500,000 searches and 10,000 ad clicks a
second.

Those two SLOs end up deciding the design. Keep them in view.

## Put rough numbers on it

Next, a few lines of [[back-of-envelope-estimation|rough arithmetic]].
In the example, 500,000 log entries a second at a rounded-up 2 KB each
is about 100 TB a day. On spinning disks at an assumed 200 operations a
second, one write per entry needs 2,500 disks. That's the first thing
the numbers tell you: one machine won't do.

Other useful numbers at this stage: the read-to-write ratio, the peak
rate, how much data one request touches, and how many things are in
flight at once.

## Name the data, then the API

Before drawing servers, list the **core entities**, the nouns the
system stores and passes around. In the example: search queries, ads,
clicks. Start with a short list and add fields later, when the design
shows which ones matter.

Then write the **API**, the contract between the system and its users.
For most product-style systems a plain [[rest|REST]] interface over
those entities is the default ([[api-design]] covers the choices). One
rule worth keeping even in a sketch: who the caller is comes from the
authentication token, never from a user ID in the request body.

Keep both rough. A design doc should sketch the API and say how and in
what rough form data is stored; pasting full interface definitions or
schemas adds detail that goes stale and hides the trade-offs. The
[[data-models|data model]] gets detailed as the design shows what each
request reads and writes.

## Draw the simplest design that works

Now boxes and arrows. Start with the simplest design that meets the
functional requirements. The SRE example starts with one machine: an
SQL database with indexes on the query ID and search term, joining the
two logs to compute each rate. One way to build up a first design is
endpoint by endpoint: for each API call, follow the request through the
system and note what state it changes.

This first design exists to be wrong in useful ways. When you see a
place that will obviously need a [[caching|cache]] or a queue, note it
and move on. Adding complexity before the basic flow works is the most
common way to never finish.

## Then hunt the bottleneck

Now push on the design with the requirements. The workbook asks four
questions of every version:

1. **Is it possible?** Could it work at all, ignoring RAM, CPU and
   network limits?
2. **Can we do better?** Faster, smaller, simpler?
3. **Is it feasible?** Does it fit real hardware, money and time?
4. **Is it resilient?** What happens when a component, or a whole
   datacenter, fails?

Each answer either sends you back to change the design or lets you move
on. The example shows the loop:

- **One machine.** Not feasible: 2,500 disks' worth of writes, or about
  1,563 machines' worth of RAM. Not resilient either: a single power
  cycle breaks the SLO.
- **A batch job over the logs** (MapReduce). Feasible and scales by
  adding machines, but it can't produce joined data within 5 minutes,
  so it fails the freshness SLO. See [[batch-processing]].
- **A streaming joiner.** Clicks are only 2% as many as searches. So
  instead of joining everything, store queries by ID and, for each
  click as it arrives, look up its query. The work now scales with the
  smaller stream.
- **Sharded joiners.** One joiner can't keep up, so hash the query ID
  and send each record to one of N shards ([[partitioning]]), with a
  duplicate on another machine so a crash doesn't lose work.
- **Several datacenters.** One datacenter is still a single point of
  failure, so replicate the results with a [[consensus]] protocol. That
  costs about 25 ms per operation between datacenters a few hundred
  kilometres apart, or 40 sequential operations a second per process,
  so the numbers get redone: tens of thousands of processes, sharded,
  on roughly 64 machines' worth of RAM per datacenter.

![A loop of five steps. Requirements (functional, and non-functional as numbers) lead to rough numbers, then entities and API, then the simplest design, then hunting the bottleneck. From the last step an arrow returns to the simplest design, labelled with the four questions: is it possible, can we do better, is it feasible, is it resilient. A side note says each failed answer changes the design, and new requirements found along the way go back to the start.](img/system-design-method-loop.svg)

*The order of the steps, and the loop that does most of the work. Questions adapted from Salim Virji and others, "Introducing Non-Abstract Large System Design" (Google SRE workbook, 2018).*

Notice what drove each change: a number (disks, freshness, RAM,
milliseconds per consensus round) or a failure question. Designs that
only get argued about in the abstract skip exactly these checks, which
is why Google calls this style **non-abstract** design: every box has
to turn into disks, RAM, network and machines at every step.

## Write it down

For anything real, the result goes into a design doc. The parts that
earn their place:

- **Context and scope**: the facts, briefly.
- **Goals and non-goals.**
- **The design**, with the trade-offs made, a sketch of the API and of
  how data is stored, and often a diagram of the system among its
  neighbours.
- **Alternatives considered**, and why each lost. This is one of the
  most useful sections, because it answers the questions reviewers
  would otherwise ask.
- **Cross-cutting concerns**: security, privacy, observability.

The point of review is timing. Problems found in a document are cheap
to fix; the same problems found after launch are not. If a doc only
says how you'll build something, with no trade-offs or alternatives,
there was nothing to decide, and writing the code would have been
faster.

## Where it gets tricky

**Estimate up front, or only when it matters?** Most interview
frameworks put estimation early. One widely used guide argues the
opposite: many people compute storage and QPS only to conclude "it's
big", which changes nothing, so do the maths when it will decide
something, such as whether a data structure fits on one machine or must
be sharded. The SRE example shows both sides: its first estimate
instantly killed the one-machine design, and every later estimate was
made to answer a specific question. The useful rule is the second one:
estimate to decide.

**The steps aren't really in order.** Google's own description says
they bounce between the questions, and a design that passes most checks
can fail late and send you back. New requirements also turn up while
you design. The sequence is a default, not a script.

**Interviews and real design aren't the same.** Interview frameworks
fit the steps into a 45-minute or one-hour session and reward
communication:
clarifying questions, stated assumptions, a working design before
details. Real design has weeks, reviewers, prototypes and existing
systems to fit into. One piece of advice holds in both: a prototype
that works is one of the strongest arguments for a design.

**Over-engineering is the common failure.** Adding caches, queues and
shards before the numbers ask for them makes a design harder to finish
and to run. Whether to split into services at all is its own decision,
covered in [[monolith-vs-microservices]].

**There's no single right answer.** The right design for a small
startup is wrong for a company with millions of users, and the other
way round. The requirements, not the famous architecture, decide.

## What this means when you build

- Write functional requirements as a short list, and non-functional
  ones as numbers attached to a part of the system.
- Write down non-goals. They stop scope creep and settle arguments.
- Estimate the numbers that could change the design, and write the
  assumptions next to them.
- Start with the simplest design that works, then ask the four
  questions of it, and let a number or a failure drive every added
  component.
- For anything that needs other people's agreement, write a short
  design doc with alternatives considered.

## Further reading

- [The Site Reliability Workbook, chapter 12: Introducing Non-Abstract Large System Design](https://sre.google/workbook/non-abstract-design/), Salim Virji and others, Google, 2018. The four questions and a full worked design, from one machine to several datacenters, with the arithmetic at each step.
- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/), Malte Ubl, 2020. What goes in a design doc, when not to write one, and why review timing matters.
- [System Design in a Hurry: Delivery Framework](https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery), Evan King and Stefan Mai, Hello Interview, 2024. Requirements, entities, API, high-level design, deep dives, and the argument against estimating by habit.
- [A Framework For System Design Interviews](https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews), Alex Xu, ByteByteGo. The common four-step interview version, and the warning about over-engineering.
- [The System Design Primer](https://github.com/donnemartin/system-design-primer), Donne Martin and contributors. A compact version of the same steps, with the questions to ask at each.
