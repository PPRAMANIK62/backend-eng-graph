---
id: error-budgets
title: Error budgets
depth: short
phase: 13
note: >-
  The failure your SLO allows, spent on shipping.
needs: [sli-slo-sla]
leads_to: [alerting]
compare_with: [postmortems, canary-analysis]
---

# Error budgets

An error budget is the amount of failure your [[sli-slo-sla|SLO]]
allows over a window: 100% minus the target. A 99.9% SLO leaves a 0.1%
budget. You spend it on launches, experiments and the outages that
happen anyway, and when it runs out, you slow down and fix reliability.
It turns "should we ship this?" from an argument into a lookup.

## From an SLO to a number

Say your API has a 99.9% availability SLO over a four-week window and
gets 1,000,000 requests in that time. The budget is 0.1% of them: 1,000
failed requests.

Every incident then has a price. At 3 million requests and a 99.9%
SLO, the budget is 3,000 errors, and an outage that fails 1,500
requests costs half of it. The same works at stricter targets: with a
99.999% SLO, a problem that fails 0.0002% of a quarter's queries has
spent 20% of that quarter's budget.

## Why a budget instead of just a target

Developers are rewarded for shipping; the people running the service,
for stability. Left alone, they argue about how much testing is enough
and how often to push, and whoever negotiates better wins.

The budget gives both sides one number, measured by the monitoring
system rather than by either team:

- While budget is left, releases go out.
- As it runs low, developers push for more testing and slower rollouts
  themselves, because they don't want to be the ones who freeze the
  next launch.
- When it's gone, releases stop until the service is back within its
  SLO.

It only works if someone can actually stop a launch. And it cuts both
ways: a team that keeps hitting the freeze and can't ship at all can
decide the target is too strict and loosen it, which makes the budget
bigger.

![A chart of error budget remaining, from 100% at day 0 down to 0%, over a 30-day window for a 99.9% SLO. Three straight lines fall at different speeds: burn rate 1 (a steady 0.1% error rate) reaches zero at day 30, burn rate 2 (0.2% errors) at day 15, and burn rate 10 (1% errors) at day 3.](img/error-budgets-burn-rate.svg)

*How fast a 99.9% budget runs out at different burn rates. Adapted from Steven Thurgood, "Alerting on SLOs" (Google SRE Workbook, 2018), figure 5-4 and table 5-4.*

## How fast you're spending it

The speed matters as much as the total. Burn rate is how fast you're
using the budget compared with the pace that would use exactly all of
it by the end of the window. With a 99.9% SLO over 30 days, a steady
0.1% error rate is burn rate 1: the budget hits zero on the last day.
A 1% error rate is burn rate 10 and empties it in 3 days. A full
outage, burn rate 1,000, empties it in 43 minutes. Burn-rate alerts
page someone when the budget is going too fast; that belongs to
[[alerting]].

Looking back, you can rank incidents by budget spent. In one worked
example, a bad release took 13% of a four-week budget and a 20-hour
database restore took 65%. But bad releases came two or three times a
year and the server loss once in five years, so releases cost more
over time, and release safety was the better investment.

## When it runs out: the policy

A budget needs a written policy saying what happens when it's spent,
agreed before it's needed. One published example says:

- If the service used more than its budget over the last four weeks,
  all changes stop except the most urgent bug fixes and security fixes,
  until the service is back within its SLO.
- The team must work on reliability if its own bug or process caused
  the miss. It may keep shipping if the cause was a company-wide
  network problem, or a load test that wasn't meant to count.
- Any single incident that took more than 20% of the four-week budget
  gets a [[postmortems|postmortem]] with at least one top-priority fix.
- Disagreements about the numbers go up to the CTO.

It isn't a punishment: it gives the team permission to drop feature
work when the data says reliability matters more. Freezing changes
works because changes cause most outages, roughly 70% at Google.

A freeze isn't the only lever. You can slow releases down, or roll
them back, as the budget nears zero, instead of switching
between "ship everything" and "ship nothing".

## Where it gets tricky

**Outages you didn't cause spend it too.** A network or datacenter
failure eats the budget the same as your bug. Teams disagree on
whether a dependency's outage should freeze your releases. Freezing
anyway protects users better; the example policy above lets the team
keep shipping if the other team has frozen its own releases.

**Windows change the feel.** A rolling window gives budget back
gradually; a calendar month resets it at once. Services above 99.99%
often use a quarter, because a month's budget is only minutes.

**Unspent budget isn't a win.** Beating the target by a wide margin
means you could have shipped faster, paid down technical debt or run
the service more cheaply. The target works as a floor and a ceiling.

## What this means when you build

- Write the budget as a count of allowed failures.
- Write the policy before the first miss, and get product, developers
  and operators to agree to it.
- Rank incidents by budget spent, and fix the class of failure that
  costs the most over a year, not the most dramatic one.
- Alert on burn rate, not on the budget hitting zero.

## Further reading

- [Embracing Risk](https://sre.google/sre-book/embracing-risk/), Marc Alvidrez and Mark Roth, Google SRE book, 2016. Where error budgets came from.
- [Example Error Budget Policy](https://sre.google/workbook/error-budget-policy/), Steven Thurgood, Google SRE Workbook, 2018. A complete, short policy you can copy.
- [Implementing SLOs](https://sre.google/workbook/implementing-slos/), Steven Thurgood, David Ferguson, Alex Hidalgo, Betsy Beyer, Google SRE Workbook, 2018. Budgets as counts; ranking incidents.
- [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Steven Thurgood, Google SRE Workbook, 2018. Burn rate and the time it takes to empty a budget.
- [The Calculus of Service Availability](https://static.googleusercontent.com/media/sre.google/en//static/pdf/calculus_of.pdf), Ben Treynor, Mike Dahlin, Vivek Rau, Betsy Beyer, ACM Queue, 2017. Freezes, sliding windows, and when to use a quarterly budget.
