---
id: google-sre-workbook-error-budget-policy
title: Example Error Budget Policy (The Site Reliability Workbook, appendix B)
author: Steven Thurgood (Google)
url: https://sre.google/workbook/error-budget-policy/
kind: book
primary: true
---

## Summary

Appendix B of Google's SRE Workbook (2018): a complete, short example
of a written error budget policy for a made-up game service. Goals and
non-goals, what happens on an SLO miss, when a single incident forces
a postmortem, and who settles disagreements.

## Key claims

- The policy isn't punishment. "This policy is not intended to serve as a punishment for missing SLOs." (Non-Goals)
- Over budget for the last four weeks: halt changes except P0 fixes and security fixes. "If the service has exceeded its error budget for the preceding four-week window, we will halt all changes and releases other than P0¹ issues or security fixes until the service is back within its SLO." (SLO Miss Policy)
- The team must work on reliability if its own bug caused the miss. "A code bug or procedural error caused the service itself to exceed the error budget." (SLO Miss Policy)
- It may keep shipping features if the cause was outside it, such as a company-wide network problem. "The outage was caused by a company-wide networking problem." (SLO Miss Policy)
- Budget spent by users out of scope (load tests) doesn't count against the team. "The error budget was consumed by users out of scope for the SLO (e.g., load tests or penetration testers)." (SLO Miss Policy)
- One incident over 20% of the four-week budget requires a postmortem. "If a single incident consumes more than 20% of error budget over four weeks, then the team must conduct a postmortem." (Outage Policy)
- That postmortem needs a top-priority action item. "The postmortem must contain at least one P0 action item to address the root cause." (Outage Policy)
- Disagreements escalate to the CTO. "the issue should be escalated to the CTO to make a decision." (Escalation Policy)
- Changes cause roughly 70% of outages. "Changes are a major source of instability, representing roughly 70% of our outages" (Background)
- Error budget is 1 minus the SLO; 99.9% on 1,000,000 requests in four weeks allows 1,000 errors. "If our service receives 1,000,000 requests in four weeks, a 99.9% availability SLO gives us a budget of 1,000 errors over that period." (Background)
- The policy gives permission to focus on reliability. "this policy gives teams permission to focus exclusively on reliability when data indicates that reliability is more important than other product features." (Non-Goals)
- The team may keep shipping if another team's service caused it and that team has frozen. "The outage was caused by a service maintained by another team, who have themselves frozen releases to address their reliability issues." (SLO Miss Policy)

## Visuals worth redrawing

None.

## My notes

- The page header carries its own approval and review dates; they
  aren't copied here.
