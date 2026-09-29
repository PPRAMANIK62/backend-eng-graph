---
id: postmortems
title: Postmortems
depth: short
phase: 13
note: >-
  Blameless write-ups that fix the system, not the person.
needs: [incident-response]
leads_to: [chaos-engineering]
compare_with: [error-budgets]
---

# Postmortems

A postmortem is the written record of an incident: what happened, who
and what it affected, how it was mitigated, why it happened, and what
will change so it doesn't happen again. The point is the last part.
Without a habit of writing them, the same outages come back, and the
lessons stay in the heads of whoever was on the call.

## When to write one

Decide the triggers before anything breaks, so nobody argues about it
afterwards. Common ones:

- Users saw downtime or degradation past some threshold.
- Any data was lost.
- The on-call had to step in: a rollback, rerouting traffic.
- Resolution took longer than some threshold.
- Monitoring failed, and a human found the problem instead.

Anyone involved can also ask for one. A postmortem isn't a punishment
for having had an incident, and a team that writes many shouldn't be
treated as a team that fails a lot.

## What goes in it

A good postmortem reads like a short report for someone who wasn't
there:

- **Summary and impact,** with numbers: how long, how many users, which
  requests. An informed estimate beats no number.
- **Background and glossary,** so readers outside the team understand
  the terms.
- **Timeline** of what happened and what responders did, taken from the
  [[incident-response|incident]] document and chat.
- **Causes and trigger,** dug into properly, with data linked.
- **What went well, what went badly, where you got lucky.**
- **Action items,** the part that matters most.

Action items are where most postmortems fail. Google's own "bad"
example of a real outage (automation wiped the disks of most of its
edge machines at once) had action items that said "improve"
and "make better", all at the same priority, mostly without owners,
with one tracking bug among them, and one that amounted to asking humans
to make fewer mistakes. The rewritten version gave every item one owner,
a priority, a tracking number, and an end state you could check, like
an alert above a given share of machines being taken away. It also
included items that *prevent* the failure, not only ones that shorten
it next time. A postmortem with no follow-up is, to users, the same as
no postmortem.

## Blameless means asking why it made sense

A blameless postmortem assumes everyone acted with good intentions and
did the reasonable thing with the information they had. It asks "what",
not "who". If an engineer ran a command that took down production, the
questions are why the command could do that, why nothing stopped it, and
why it looked like the right thing at the time.

This isn't about being nice. When people get named and shamed, they
learn to hide things, and the facts you need to prevent the next outage
stay hidden. You can't fix people, but you can fix the tools, the
defaults and the processes that let a normal action cause damage. The
idea came from healthcare and aviation, where mistakes can be fatal.

It also shows in the writing. "Careless ignorance", "which is
ridiculous" and exclamation marks turn a factual document into an
accusation. Plain language and linked data keep it a record.

## Getting it read and acted on

- **One owner,** with many collaborators, and everyone who was involved
  helps write it.
- **Reviewed.** An unreviewed postmortem might as well not exist. Senior
  engineers check that the data, the cause analysis and the action items
  hold up.
- **Fast.** Google's good example went out within a week of the incident
  closing; the bad one took four months, and the same incident happened
  again in between.
- **Shared widely,** across the company and sometimes with customers.
  Teams also reuse old postmortems as role-play drills for new on-call
  engineers (see [[on-call]]).
- **Rewarded for closing action items,** not just for writing documents.

## Where it gets tricky

**"Root cause" is disputed.** Google's templates have a "root causes and
trigger" section, and reviewers ask whether the root cause went deep
enough. The other view, from safety research on complex systems, is that
there is no single root cause: serious failures need several things going wrong at once,
each necessary and only together sufficient, and naming one cause
reflects a need to blame more than an understanding of the failure.
In practice, write down every contributing factor, don't stop at the
first plausible one, and don't accept "a person made a mistake" as an
answer.

**Hindsight makes everything look obvious.** Once you know the outcome,
the warning signs seem like they should have stood out. They didn't at
the time. Write the timeline from what people knew then.

**More rules can make things worse.** Fixes added after an incident
often add coupling and complexity, which creates new ways to fail.

**Repeat incidents mean the process is failing.** If the same kind of
outage keeps coming back, look at whether action items are closing, and
whether feature work keeps winning over reliability fixes.

## What this means when you build

- Agree on postmortem triggers and a template before the first outage.
- For every action item: one owner, a priority, a ticket, a checkable
  end state. Prefer changing systems over asking people to be careful.
- Write it within days, have it reviewed, share it, and follow the
  action items to done.

## Further reading

- [Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/), John Lunney and Sue Lueder, Google SRE book, chapter 15. What a postmortem is, when to write one, and what blameless means.
- [Postmortem Culture: Learning from Failure](https://sre.google/workbook/postmortem-culture/), Daniel Rogers, Murali Suriar, Sue Lueder, Pranjal Deo, Divya Sudhakar and others, The Site Reliability Workbook, chapter 10, 2018. A bad and a good postmortem of the same real outage, side by side, and how organizations keep the practice alive.
- [How Complex Systems Fail](https://how.complexsystems.fail/), Richard I. Cook, 1998 to 2000. Eighteen short points on why failures have many causes and why hindsight misleads.
