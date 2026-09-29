---
id: alerting
title: Alerting
depth: deep
phase: 14
note: >-
  Alert on what users feel, not on causes. SLO burn-rate alerts.
needs: [sli-slo-sla, metrics, red-method, error-budgets, on-call]
leads_to: [canary-analysis]
compare_with: [observability]
---

# Alerting

An alert is a message from your monitoring meant for a person. The most
expensive kind is a page: it interrupts someone's work, dinner or sleep,
and asks them to act now. Good alerting pages only when users are being
hurt, or are about to be, and does it rarely enough that every page is
taken seriously. The best tool for that is the [[sli-slo-sla|SLO]] you
already have, turned into rules about how fast its error budget is
burning.

## Pages, tickets and the cost of a false alarm

Alerts come in three kinds, by where they land:

- **A page** goes to a pager or phone and wants a response now.
- **A ticket** goes into a queue and wants a response in the next
  working day or so.
- **An email** goes to a mailing list, where it gets buried in noise.
  A dashboard of the problems that aren't urgent does that job better.

Only pages and tickets get a human to act, so those are the two to
design.

When pages come too often, people skim them, second-guess them and
ignore them, and sooner or later a real page gets lost in the noise. So
the bar for a page is high:

- It's **urgent**: it can't wait until morning.
- It's **actionable**: there is something to do. "It paged again" isn't
  an action.
- It **needs thought**. If the response is the same script every time,
  automate the script and delete the page.
- It's **real**: users are affected, or will be soon.

A useful rough measure: an alert that turns out to be right less than
half the time is broken, and even one that's wrong 10% of the time
deserves a look. Removing a noisy alert is almost always the right move,
because too much alerting is harder to recover from than too little.

The second half of the design is somewhere for the not-urgent things to
go. A disk that will fill in four days is worth knowing about, but not at
3 a.m. Send it to a ticket queue that someone owns and triages every
shift. Without someone accountable, a ticket queue is just a quieter
mailing list.

## Alert on the symptom, not the cause

A monitoring system answers two questions: what's broken, and why. The
"what" is a symptom: the service is returning 500s, or responses are
slow. The "why" is a cause: the database is refusing connections, a CPU
is pegged, a cable is bad.

Page on symptoms. Take the database example. You might think "if the
database is down, users get errors, so alert on the database". But:

- **You need the symptom alert anyway.** Users can get errors for
  reasons you haven't thought of: a network problem, CPU contention, or
  something else entirely. Only an alert on the errors themselves catches them all.
- **Two alerts for one problem** means two things to tune, and either
  duplicate pages or a tangle of rules about which one wins.
- **The cause doesn't always lead to the symptom.** The database might be
  down because someone is moving it on purpose, or because a failover
  already sent traffic elsewhere. Then you've woken someone for nothing.

Users care about a short list of things: the service works and returns
the right answer, it's fast, their data is safe and fresh, and their
features work. Those are what to alert on, and what a good
[[sli-slo-sla|SLI]] already measures. The
[[red-method]]'s request rate, errors and duration are the same idea
applied to one service.

**Measure as close to the user as you can.** The client sees retries,
network delay and the combined result of every backend it called. For
many services the best vantage point is the front
[[load-balancing|load balancer]]: if all
your servers are down, or one is quietly dropping connections, the load
balancer knows even when the servers don't. Page on latency at one point
in the stack, not at every layer. If a backend is slow but users aren't,
nobody needs to wake up.

**One team's symptom is another's cause.** Slow database reads are a
symptom for the team running the database and a cause for the team
running the website.

**Causes still have two jobs.** Some problems have no symptom until it's
too late: a disk, memory or quota running out. There a cause rule is the
only warning, best as a ticket days ahead, with a page only as a last
resort. And causes help whoever got paged: list the cause rules
currently firing inside the symptom page ("also firing: user database
shard down"), or show them on the dashboards you debug with, next to the
[[use-method]]'s per-resource checks.

## From an SLO to a rule

Say your API has a 99.9% availability SLO over 30 days. The
[[error-budgets|error budget]] is the 0.1% of requests allowed to fail.
The alert should fire on a *significant event*: something that eats a
big piece of that budget. You judge any rule by four things:

- **Precision**: of the alerts that fire, how many were significant.
- **Recall**: of the significant events, how many fired an alert.
- **Detection time**: how long before it fires.
- **Reset time**: how long it keeps firing after the problem is fixed.

The obvious rules each fail one of these. The numbers below are
Google's worked examples.

**Error rate over the last 10 minutes above 0.1%.** It catches a total
outage in 0.6 seconds. But it also fires on 10 minutes at 0.1% errors,
which uses 0.02% of the month's budget. It could fire 144 times a day,
every day, while you still meet the SLO. Terrible precision.

**The same check over a 36-hour window.** Now an alert means about 5% of
the budget is gone, and a full outage is still caught in about two
minutes. But once it fires, it keeps firing for 36 hours after the
outage ends, because the average takes that long to fall.

**A short window with a duration** (Prometheus's `for: 1h`: the
condition must hold for an hour before the alert fires). A full outage now takes an hour to page, the same
as a 0.2% error rate, and by then it has used 140% of the month's
budget. Worse, if the error rate dips back under the line even briefly,
the timer resets. In one example with a 10-minute duration, 5-minute spikes of 100%
errors every 10 minutes never fire the alert at all, while eating 35% of the budget.

The fix is to stop asking "is the error rate above the SLO?" and ask
"how fast is the budget going?"

## Burn rate

[[error-budgets|Burn rate]] is how fast you're spending the budget,
relative to the speed that would use exactly all of it by the end of the
window. For a 99.9% SLO, a steady 0.1% error rate is burn rate 1. A 1%
error rate is burn rate 10 and empties a 30-day budget in 3 days. A total
outage is burn rate 1,000 and empties it in 43 minutes.

A burn-rate alert picks a slice of budget worth waking up for and a
window to watch. "5% of the budget in one hour" works out to burn rate
36: fire if the error rate over the last hour is above 36 × 0.1% = 3.6%.
Precision is good, the window is short and cheap to compute, and it
resets in 58 minutes. The weak spot is recall: burn rate 35 never fires,
yet it empties the whole budget in 20.5 hours.

So you use several burn rates, each with its own window, and let the
speed decide who hears about it. The starting point Google recommends:

| Severity | Long window | Short window | Burn rate | Budget used when it fires |
|---|---|---|---|---|
| Page | 1 hour | 5 minutes | 14.4 | 2% |
| Page | 6 hours | 30 minutes | 6 | 5% |
| Ticket | 3 days | 6 hours | 1 | 10% |

Fast burns page. A slow burn that would still empty the budget within
the window becomes a ticket for the next working day. Because the rule
is written in burn rates, the same numbers carry over from service to
service: the threshold is always the burn rate times the error rate the
SLO allows.

The error rates come from [[metrics]]: two counters, bad events and all
events, and a recording rule that turns them into a ratio over each
window. "Bad" depends on the SLI. For an availability SLO it's a failed
request; for a latency SLO it's a request slower than the target.

## Two windows: fire fast, stop fast

The short-window column fixes the reset time. A 1-hour average stays
high for an hour after an outage ends. Requiring the 5-minute average to
be over the line too means the alert only fires while you're *still*
burning budget. The rule of thumb is a short window one twelfth of the
long one.

![A chart of error rate over 75 minutes. A shaded band shows 15% errors from minute 0 to 10. A grey line, the 5-minute average, shoots up past the top of the scale within a minute and falls back to zero at minute 15. A blue line, the 1-hour average, climbs until minute 10, stays level until minute 60, then falls to zero at minute 70. A dashed threshold sits at 1.44%, burn rate 14.4 times the 0.1% budget. Below the chart, a blue bar shows the page firing from about minute 5 to about minute 15, while both averages are above the threshold. A grey bar shows that the 1-hour rule alone would keep firing until about an hour after the errors stop.](img/alerting-multiwindow-burn.svg)

*A burst of errors against the 1-hour, burn-rate-14.4 page. Adapted from Steven Thurgood, "Alerting on SLOs" (Google SRE Workbook, 2018), figure 5-6.*

Walk through it. Errors jump to 15% for 10 minutes. The 5-minute
average crosses the threshold almost at once. The 1-hour average needs
about 5 minutes of errors to cross it, so the page fires then, once 2% of
the budget is spent. When the errors stop, the 5-minute average drops
back under the line about 5 minutes later and the alert clears. The
1-hour window alone would have kept it firing for about another hour.

## Getting the page to the right person

Deciding what's firing and telling people about it are separate jobs. In
the Prometheus world, Prometheus evaluates the rules and Alertmanager
sends the notifications. A rule is an expression, optional labels such as
`severity: page`, and annotations for a summary and a link to the
runbook.

Alertmanager handles what a rule can't:

- **Grouping.** A network partition leaves hundreds of instances unable
  to reach the database, and each one fires. You want one page that
  lists them, not hundreds of pages.
- **Inhibition.** When "the whole cluster is unreachable" is firing,
  mute every other alert about that cluster.
- **Silences.** Mute alerts that match some labels, for a set time.

Burn-rate rules need this too. A fast burn also crosses the slower
thresholds, so without suppression one incident sends three
notifications.

Each page links to a runbook. The good ones are short: what this alert
means and what's currently known about it. A long flow chart is a sign
the time should have gone into fixing the problem instead.
[[on-call]] and [[incident-response]] cover what happens after the page
arrives.

## Where it gets tricky

**Low traffic breaks the math.** At 10 requests an hour, one failed
request is a 10% hourly error rate: burn rate 1,000, 13.9% of the month's
budget, an instant page. A 99.9% SLO at that traffic allows seven
failures a month. The options are all trade-offs: send synthetic traffic
(which can hide errors that only real users hit, because the successful
probes dilute them), group several small services into one SLO, make
clients retry with [[retries-with-backoff|backoff]] so one failure hurts
less, or lower the SLO. Request types with very different traffic can
need their own rules for the same reason, or the small one gets drowned
out.

**Extreme targets.** At a 90% SLO, a full outage uses only 1.4% of the
budget in an hour, so the "2% in an hour" page can never fire; the
parameters need retuning. At 99.999% a month, a full outage empties the
budget in 26 seconds, faster than many systems even collect a metric. No
alert can defend that. Only a design where changes reach a small slice of
users first, such as a [[canary-analysis|canary]], can.

**Durations: avoid or use?** The SLO chapter recommends against `for`
clauses in SLO alerts, except to filter very short noise. Prometheus
advises slack for small blips and has `keep_firing_for` against
flapping. The short window of a multiwindow rule does what a duration
was trying to do, without its blind spots.

**"Smart" alerting.** It's tempting to let a system learn normal
behaviour and alert on anomalies. Google's SRE teams mostly avoid
systems that learn thresholds or guess at causes, and keep paging rules
simple enough that anyone on the team understands why they fired.

**One set of numbers for everything.** Tuning windows and burn rates per
service quickly turns into toil once you have many services. Pick the parameters
once and apply them everywhere. If request types really differ, sort
them into a few classes (critical, high and fast, high but slow, low, no
SLO) with a shared target per class.

**Who watches the monitoring?** If Prometheus or Alertmanager is down,
nothing pages, and everything looks quiet. Alert on the monitoring
itself, ideally with one end-to-end check that a test alert makes it all
the way to a notification, plus a black-box probe from outside.

**Batch jobs and pipelines.** They have no request rate to burn. Alert
when a batch job hasn't succeeded for long enough to hurt users,
usually at least two full runs (a job every 4 hours that takes an hour
gets about 10 hours). For offline pipelines, alert on how long data
takes to get through.

## What this means when you build

- Start from the SLO. Write the two counters (bad and total events)
  before you write any alert.
- Use multiwindow, multi-burn-rate rules: page at 14.4 over 1 hour and 6
  over 6 hours, ticket at 1 over 3 days, each with a short window of
  one twelfth. Adjust from there.
- Page on symptoms measured at the edge. Put causes on dashboards and in
  the page text.
- Give every page a runbook link and a severity label. Track every
  page, and delete or demote the ones that turned out to be nothing.
- In this lab, the phase 14 build puts burn-rate alerts on the phase 13
  SLOs, and the same alert is what rolls back a bad canary on its own
  (see [[canary-analysis]]).

## Further reading

- [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Steven Thurgood and others, Google SRE Workbook, 2018. The six alerting strategies step by step, burn rates, the multiwindow rule, low-traffic and extreme cases. The main source.
- [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Rob Ewaschuk, Google SRE book, 2016. Symptoms vs causes, black-box vs white-box, and the questions to ask of every page.
- [My Philosophy on Alerting](https://docs.google.com/document/d/199PqyG3UsyXlwieHaqbGiWVa8eMWi8zzAn0YfcApr8Q/edit), Rob Ewaschuk. The short essay the chapter grew from: alerting from the client's view, cause rules inside pages, tickets and playbooks.
- [Alerting best practices](https://prometheus.io/docs/practices/alerting/), Prometheus authors. What to alert on for serving systems, pipelines, batch jobs and the monitoring itself.
- [Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/), Prometheus authors. How a rule is written: `for`, `keep_firing_for`, labels and annotations.
- [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/), Prometheus authors. Grouping, inhibition and silences.
