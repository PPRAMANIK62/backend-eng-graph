---
id: incident-response
title: Incident response
depth: deep
phase: 13
note: >-
  Roles, communication, and mitigating first while you investigate.
needs: []
leads_to: [on-call, postmortems]
compare_with: []
---

# Incident response

Incident response is how a team behaves while something in production
is broken and users can see it: who is in charge, who touches the
system, who tells everyone else what's going on, and in what order you
stop the damage and find the cause. It matters because a big outage
usually has two problems at once, the broken system and a crowd of
people trying to fix it, and the second one can make the first worse.

## What goes wrong when nobody is in charge

Picture the page arriving. One data center of five has stopped serving
traffic. The [[on-call]] engineer starts digging. A few minutes later a
second data center stops, then a third, and the two left can't take the
load. The engineer is reading logs and rolling back a release. A
colleague who wrote the code is woken up. Two more people start poking
at production from their own terminals, "just looking". Executives call
asking for an ETA. Someone who was pulled in by someone else has an idea
about CPU affinity, pushes a config change on his own, and the servers
that were still up restart and die.

Everyone in that story was doing their job as they saw it. Three things
went wrong, and none of them is technical:

- **Focus on the technical problem.** The person closest to the fix was
  too deep in it to think about the bigger picture, like whether there
  was a quicker way to stop users getting errors.
- **Poor communication.** Nobody knew what anyone else was doing.
  Leaders were angry, and people who could have helped weren't used.
- **Freelancing.** Someone changed production without telling anyone,
  and made it worse.

An incident response process exists to fix exactly these three things.
It's worth separating two jobs that get mixed up. **Resolving** the
incident means reducing the impact or putting the service back the way
it was. **Managing** the incident means coordinating the people doing
that, and keeping information flowing between them and to everyone who
wants to know.

## Borrowed from firefighters

The structure most software companies use comes from the Incident
Command System, which firefighters set up in 1968 to manage wildfires.
Google's version and PagerDuty's are both adapted from it. The goals are
often called the three Cs: **coordinate** the response, **communicate**
with responders, the rest of the company and the outside world, and keep
**control** of the response.

## Roles, not job titles

The core of the system is a small set of roles. Google's names are:

- **Incident commander (IC).** Holds the high-level state of the
  incident, decides who does what, and removes roadblocks. Any role the
  IC hasn't handed to someone else is still the IC's. Usually the person
  who declares the incident starts as IC.
- **Operations lead.** Works the problem with the tools: rollbacks,
  drains, config changes. The ops team is the only group allowed to
  change the system during the incident. That one rule is what stops
  freelancing.
- **Communications lead.** The public face of the response. Sends
  regular updates to responders and stakeholders, and answers their
  questions so they don't interrupt the people fixing things.
- **Planning.** Handles longer-term chores: filing bugs, arranging
  handoffs, ordering food, and tracking every way the system has been
  changed from normal so it can be put back once it's over.

![A tree of incident roles. The incident commander sits at the top and holds any role not delegated. Under it are three boxes: the operations lead, the only one who changes the system, with subject matter experts under it; the communications lead, who sends updates to stakeholders and customers; and planning or scribe, who keeps the timeline, tracks changes to revert, and arranges handoffs.](img/incident-response-roles.svg)

*The roles in a managed incident. Adapted from Google's "Managing Incidents" (SRE book, chapter 14), the "Incident Response" chapter of the SRE Workbook, and PagerDuty's "Different Roles".*

PagerDuty's version has the same shape with more pieces. A **deputy**
backs up the IC and can take over at any moment. A **scribe** writes the
timeline in the incident chat as it happens: key actions, status
reports, things to follow up. **Subject matter experts**, usually each
affected service's primary on-call, report in a fixed form: the
condition of their service, the actions they propose, and what they
need. A **customer liaison** handles public messages and an **internal
liaison** pages people and keeps other teams informed.

None of this means one person per role. In a small incident one person
holds everything. As it grows, the IC hands roles out, and each lead can
build a small team of their own. When it shrinks, the roles fold back
into the IC. A clear split gives people more freedom, not less: if you
own the ops work, you don't need to second-guess anyone else's.

## Mitigate first, understand later

The order of work is the other half of incident response. Stop the
bleeding, restore service, and keep the evidence you'll need to find the
cause. Written as steps for an active incident:

1. Assess the impact.
2. Mitigate the impact.
3. Find the root cause.
4. After it's over, fix what caused it and write the [[postmortems|postmortem]].

A **mitigation** is anything that reduces the damage. A **generic
mitigation** is one that works for many different outages, and its
defining property is that you don't need to understand the outage to
use it. Common ones:

- **Roll back** the binary or config to a known-good version (see
  [[deployment-strategies]]).
- **Roll back data** built by a pipeline.
- **Degrade**: do less work but stay up ([[graceful-degradation]]).
- **Upsize**: add capacity.
- **Block** a query of death or an abusive client.
- **Drain** traffic away from a bad region or cluster.
- **Quarantine** one hot row, user or traffic stream so its problem stops
  hurting everyone else.

![Two timelines that start the same: problem created, damage starts, on-call paged. On the top timeline the responder applies a generic mitigation right after being paged, and the user-impact bar stops there; investigation, the final fix and applying it happen afterwards with users fine. On the bottom timeline the responder investigates first, and the user-impact bar runs on through investigating and finding the perfect fix until the fix is applied.](img/incident-response-mitigate-first.svg)

*Mitigating first moves the end of user impact to the left; the fix still comes later. Adapted from Jennifer Mace, "Generic mitigations" (O'Reilly, 2020).*

The reason is simple: it's very hard to make finding a cause faster, and
much easier to make stopping the damage faster. Users don't care whether
you understand the outage. They care that the errors stop.

A Google Kubernetes Engine outage shows the cost of not having one ready.
Creating new clusters failed across Europe for 6 hours and 40 minutes.
The team found the rough location of the problem, a corrupted container
image, a little over three hours after the first page. Their plan was to
rebuild binaries so clusters fetched the image from somewhere else, which
took about an hour per build, and the real fix only landed after that. In
hindsight, rolling every image back to a known-good state as soon as
the location was known would have ended the impact by about 10 a.m.,
where the fix came at 12:11 p.m. To mitigate, you only need to
know *where* the cause is, not what it is.

## Declare early

A lot of incidents go badly because nobody calls them incidents. It's
cheaper to declare one, find a simple fix and close it than to start the
process hours in. One Google team's rule of thumb: it's an incident if
any of these is true:

- You need a second team to fix it.
- Customers can see it.
- It's still unsolved after an hour of focused work.

A Google Home outage shows the opposite. A
client bug made devices fetch data far more often than intended. The
team raised quotas three times as mitigations, never declared an
incident, let the rollout continue, and ended up with the problem
peaking over a weekend while developers worked through their days off.
The review's conclusion: managed incidents resolve faster, and success
shouldn't depend on heroes.

## Running the response

A few habits keep the response under control:

- **One place to talk.** Everyone joins one chat channel or call, chosen
  in advance. Decisions are made there and written down there.
- **A live incident document.** The IC's most important job is keeping
  a shared document of current state: impact, what's been tried, working
  theories, who is doing what. Newcomers read it instead of interrupting.
  Keep it somewhere that doesn't depend on the system you're fixing.
- **Name the person, set a time.** "Bob, please look at the latency on
  the web hosts, I'll come back to you in 3 minutes." Never "can
  someone...": when a task is thrown at a group, nobody picks it up.
- **Decide, then check for objections.** The IC gathers options and
  their risks, picks one, and asks "are there any strong objections?"
  With nothing but bad options, picking one beats waiting.
- **Loop.** Size up (what's broken, how big), stabilize (choose and
  assign actions), update everyone, verify the actions worked, and go
  back to size-up if they didn't.
- **Hand off out loud.** A new IC is briefed, then told explicitly
  "you're now the incident commander, okay?", and the old one stays
  until it's acknowledged. In a long incident, rotate people: PagerDuty
  swapped its IC and on-call engineers every four hours during one
  that lasted more than 10 hours.

Communication outwards matters as much as inwards. If you don't say an
incident is being worked on, people assume nobody is working on it. If
you forget to say it's over, they assume it's still going. Regular short
updates, prepared contact lists and message templates written in calm
times make this cheap.

## Where it gets tricky

**Should the IC fix things?** The strict rule: the IC is not a
resolver and shouldn't be reading graphs or logs, because then nobody is
watching the whole incident. A looser version (Google's): the IC can hand
command to someone else and become the ops lead, and in small incidents
one person does both. The practical answer is size: once more than a
couple of people are involved, the person coordinating should stop
typing commands.

**The IC doesn't need to be the most senior or most technical person.**
The job is coordination, so deep technical knowledge isn't required.
For the length of the call, the IC outranks everyone on it, whatever
their day-to-day rank.

**Generic mitigations are blunt.** A rollback or a drain can cause
disruption of its own, and none of them is magic. Drain one instance
because a new release is throwing errors, and you'll see the same
errors again when the next instance upgrades. You still need enough
diagnosis to know which kind of failure you're in.

**Mitigations you haven't used don't work.** Many teams find out during
an outage that their rollback isn't safe. Building a degraded mode while
the system burns goes badly. The tools have to be built and exercised
before the incident.

**The process fades without practice.** Incident skills fade quickly
when they aren't used. Teams keep them fresh by using the same structure
for big planned changes, by running drills such as Google's disaster
recovery tests (see [[disaster-recovery]] and [[chaos-engineering]]),
by replaying old incidents as role-play, and by treating small problems
as big ones on purpose.

**Mitigation isn't the end.** In the Google Home case, the quota bumps
stopped the pain three times, but the problem only stopped coming back
once the cause was found. After you mitigate, the cause still needs
finding, and the rollout that triggered it may need pausing until it is.

## What this means when you build

- Before launch, write down your service's generic mitigations and make
  sure each one works: rollback, drain, a degraded mode, extra capacity,
  a block list. Practise them.
- Agree in advance on when something is an incident, which channel to
  use, and who gets paged. Nobody wants to decide that mid-outage.
- In an incident: one IC, only ops changes production, one live
  document, named and time-boxed tasks, regular updates.
- Stop the user impact first. Keep logs and state you'll need, then find
  the cause and write the [[postmortems|postmortem]].

## Further reading

- [Managing Incidents](https://sre.google/sre-book/managing-incidents/), Andrew Stribblehill, Google SRE book, chapter 14. The unmanaged-vs-managed story, the four roles, the live document and when to declare.
- [Incident Response](https://sre.google/workbook/incident-response/), Jennifer Mace, Jelena Oertel, Stephen Thorne, Arup Chakrabarti and others, The Site Reliability Workbook, chapter 9, 2018. The three Cs, the IC, ops and comms leads, and four real incidents including the GKE outage.
- [Different Roles](https://response.pagerduty.com/before/different_roles/), PagerDuty Incident Response docs. The IC, deputy, scribe, subject matter experts and liaisons, and what each one does.
- [Incident Commander training](https://response.pagerduty.com/training/incident_commander/), PagerDuty Incident Response docs. How an IC runs a call: the size-up, stabilize, update, verify loop and the exact phrases.
- [Generic mitigations](https://www.oreilly.com/content/generic-mitigations/), Jennifer Mace, O'Reilly, 2020. Why you mitigate before you understand, and a list of mitigations to build in advance.
