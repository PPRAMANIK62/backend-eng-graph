---
id: on-call
title: On-call
depth: short
phase: 13
note: >-
  Being the one who gets paged: rotations, pages worth waking for,
  runbooks for known problems, not burning out.
needs: [incident-response]
leads_to: [alerting]
compare_with: []
---

# On-call

Being on-call means that for a stretch of time you're the person who
gets paged when your service breaks, day or night, and you're expected
to start working on it within minutes. It's how a team turns "someone
should keep this running" into a named person. Done badly, it burns
people out and makes them worse at fixing things. Done well, it's a
sustainable part of the job.

## How fast, and why that fast

The response time comes from what the service promises. Google's
typical values are 5 minutes for user-facing or time-critical services
and 30 minutes for less urgent ones. The link to the target is direct:
a service that must hit 99.99% availability over a quarter can afford
about 13 minutes of downtime in that quarter (see [[availability-math]]), so
the on-call can't take half an hour to open a laptop.

Not everything deserves that. A useful ladder:

- **5 minutes:** a revenue-hitting network outage. You stay within
  reach of a charged, logged-in laptop the whole shift.
- **30 minutes:** a stuck order-processing batch job. You can run a
  short errand.
- **A ticket for working hours:** backups failing for a service that
  hasn't launched yet.

Once a page arrives, the on-call acknowledges it, triages, works toward a
fix, and pulls others in when needed. If it grows past one person, it
becomes an [[incident-response|incident]] with its own roles.

## Pages worth waking for

A page is expensive. It interrupts your work by day and your sleep by
night. When pages come too often, people start skimming or ignoring
them, and then a real one gets missed. So every page should pass a few
tests:

- **Actionable now.** There's something a human must do right away that
  the system can't do itself.
- **Needs thought.** If the response is the same fixed steps every time,
  automate it instead of paging.
- **About a symptom users feel,** like errors or slowness against the
  SLO, rather than a cause like high CPU. Causes help with debugging,
  not with deciding whether to wake someone. That's the job of
  [[alerting]].
- **One page per incident.** Group related alerts so one problem
  doesn't fire ten pages.

New alerts should first run in a test mode, emailing their author
instead of paging, for about a week, long enough to see normal deploys
and weekly peaks. Then the team decides together whether it becomes a
page.

## Runbooks for known problems

Each paging alert should have a runbook (Google calls them playbooks):
what the alert means, how to check it, and what to try. They go stale as
fast as production changes. Teams disagree on the style: short general
entries that age slowly, or step-by-step ones that make every on-call
act the same. Either way, if a runbook is just a fixed list of commands
you run every time the alert fires, that's a script waiting to be
written.

## Not burning out

Google's rules give a sense of scale:

- **At most two incidents per 12-hour shift.** Handling one, with the
  debugging, fix and [[postmortems|postmortem]], takes about 6 hours on
  average, so more than two leaves no time to follow up properly.
- **At most 25% of an engineer's time on-call.** With a primary and a
  secondary on-call at all times and week-long shifts, that means a
  single-site team needs at least eight people; two sites need six each.
- **Shifts of 12 hours at most.** 24 hours with no break isn't
  sustainable. Two sites in different time zones can cover each other's
  nights; one site can split days and nights between two people.
- **Pay for it,** with a cap, which also stops anyone taking on too much
  on-call for the money.
- **A backup.** A secondary on-call catches missed pages, and a clear
  escalation path means nobody fixes a hard problem alone.

The reason is not only kindness. Under stress, people fall back on fast,
habitual reactions: the same alert fires for the fourth time this week,
and you assume it's the same cause as last time. That's how mistakes
happen during an outage.

The opposite problem exists too. If you're on-call too rarely, you lose
touch with production and find out what you don't know during a real
incident. Google aims for everyone to be on-call at least once or twice
a quarter, and uses role-play of old incidents to keep skills up.

## Where it gets tricky

**Loud pagers become normal.** A team getting many duplicate pages can
start saying "I know those are duplicates, I just ignore them". The fix
is to cut the noise, not to get used to it. Relaxing an SLO-based alert's
threshold is rarely the answer; fixing the thing that keeps breaking is.

**Overload needs a way out.** When pages keep exceeding the budget, the
team needs time set aside to fix causes. At Google, an SRE team can in
the extreme "give back the pager" to the developers until the service
is fit to run.

## What this means when you build

- Set response times from the SLO, and page only for what needs a human
  now; everything else is a ticket or a dashboard.
- Give every paging alert a runbook, and turn repeated runbook steps
  into automation.
- Track pages per shift, and treat more than a couple as a bug to fix.

## Further reading

- [Being On-Call](https://sre.google/sre-book/being-on-call/), Andrea Spadaccini, Google SRE book, chapter 11. Response times, rotation sizes, the two-incident limit, stress and operational overload.
- [On-Call](https://sre.google/workbook/on-call/), Ollie Cook, Sara Smollett, Andrea Spadaccini and others, The Site Reliability Workbook, chapter 8, 2018. Playbooks, pager load, realistic response times, testing new alerts and shift length.
- [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Rob Ewaschuk, Google SRE book, chapter 6. What makes a page worth sending: actionable, needing thought, about symptoms.
