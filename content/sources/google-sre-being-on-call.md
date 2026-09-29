---
id: google-sre-being-on-call
title: Being On-Call (Site Reliability Engineering, chapter 11)
author: Andrea Spadaccini; edited by Kavita Guliani (Google)
url: https://sre.google/sre-book/being-on-call/
kind: book
primary: true
---

## Summary

The Google SRE book chapter on how on-call is organized at Google:
response times, rotation sizes, a cap on how much on-call and how many
incidents per shift, compensation, stress, and what to do when the pager
is too loud or too quiet. Online edition, copyright 2017.

## Key claims

- Response times are agreed with the business; typical values 5 minutes and 30 minutes. "Typical values are 5 minutes for user-facing or otherwise highly time-critical services, and 30 minutes for less time-sensitive systems." (Life of an On-Call Engineer)
- Response time follows from the availability target: 99.99% a quarter leaves about 13 minutes. "if a user-facing system must obtain 4 nines of availability in a given quarter (99.99%), the allowed quarterly downtime is around 13 minutes" (Life of an On-Call Engineer)
- Pages come before project work. "These activities are less urgent than paging events, which take priority over almost every other task, including project work." (Life of an On-Call Engineer)
- Many teams run a primary and a secondary rotation; duties split differently per team. "Many teams have both a primary and a secondary on-call rotation." (Life of an On-Call Engineer)
- At least 50% of SRE time goes to engineering; at most 25% to on-call. "of the remainder, no more than 25% can be spent on-call" (Balance in Quantity)
- So a single-site 24/7 rotation with primary and secondary needs at least eight people, a dual-site team six per site. "the minimum number of engineers needed for on-call duty from a single-site team is eight" (Balance in Quantity)
- Night shifts harm health; follow-the-sun rotations avoid them. "Night shifts have detrimental effects on people’s health" (Balance in Quantity)
- An incident takes about 6 hours of work, so at most 2 per 12-hour shift. "It follows that the maximum number of incidents per day is 2 per 12-hour on-call shift." (Balance in Quality)
- An incident here is everything with one root cause, covered by one postmortem. "Let’s define an incident as a sequence of events and alerts that are related to the same root cause and would be discussed as part of the same postmortem." (Balance in Quality)
- Out-of-hours work is compensated, with a cap that also limits how much on-call one person takes. "The compensation cap represents, in practice, a limit on the amount of on-call work that will be taken on by any individual." (Compensation)
- Stress pushes people toward fast, habitual action and confirmation bias. "Quick reactions are deep-rooted in habit, and habitual responses are unconsidered, which means they can be disastrous." (Feeling Safe)
- The on-call's key resources: escalation paths, incident procedures, blameless postmortems. "Clear escalation paths" (Feeling Safe, list)
- Paging alerts should match SLO-threatening symptoms and be actionable. "All paging alerts should also be actionable." (Operational Overload)
- Aim for one alert per incident. "Noisy alerts that systematically generate more than one alert per incident should be tweaked to approach a 1:1 alert/incident ratio." (Operational Overload)
- SRE can "give back the pager" to developers until the system meets their bar. (Operational Overload)
- Too little on-call is a problem too; be on call at least once or twice a quarter. "SRE teams should be sized to allow every engineer to be on-call at least once or twice a quarter" (A Treacherous Enemy: Operational Underload)

- After acknowledging a page, the on-call triages and works toward resolution, escalating as needed. "As soon as a page is received and acknowledged, the on-call engineer is expected to triage the problem and work toward its resolution, possibly involving other team members and escalating as needed." (Life of an On-Call Engineer)
- One use of the secondary: catching pages the primary misses. "One team might employ the secondary as a fall-through for the pages the primary on-call misses." (Life of an On-Call Engineer)
- The confirmation-bias example. "when the same alert pages for the fourth time in the week, and the previous three pages were initiated by an external infrastructure system, it is extremely tempting to exercise confirmation bias" (Feeling Safe)
- Wheel of Misfortune exercises (role-playing past incidents) keep troubleshooting skills up. "are also useful team activities that can help to hone and improve troubleshooting skills and knowledge of the service" (A Treacherous Enemy: Operational Underload)
- (For on-call.) The eight-person figure assumes week-long shifts. "assuming week-long shifts, each engineer is on-call (primary or secondary) for one week every month." (Balance in Quantity)

## Visuals worth redrawing

None.

## My notes

- Numbers here are Google's policy, not measurements of on-call in
  general.
