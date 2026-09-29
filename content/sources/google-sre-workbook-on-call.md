---
id: google-sre-workbook-on-call
title: On-Call (The Site Reliability Workbook, chapter 8)
author: Ollie Cook, Sara Smollett, Andrea Spadaccini, Cara Donnelly, Jian Ma, Garrett Plasky (Evernote), with Stephen Thorne and Jessie Yang
url: https://sre.google/workbook/on-call/
kind: book
primary: true
---

## Summary

The SRE Workbook's follow-up to the on-call chapter: setting up new
rotations at Google and Evernote, playbooks, what drives pager load,
response times, alert hygiene, shift length and team dynamics. Online
edition, copyright 2018.

## Key claims

- The goal: coverage without trading away the engineer's health. "we never achieve reliability at the expense of an on-call engineer’s health" (Recap)
- Target at most two incidents per shift. "We target a maximum of two incidents per on-call shift, to ensure adequate time for follow-up." (Recap) [footnote marker removed]
- Playbook style is contested: general entries that age slowly, or step-by-step ones. "This is a contentious topic." (Maintaining Playbooks)
- A playbook that is a fixed list of commands should be automated. "If your playbooks are a deterministic list of commands that the on-call engineer runs every time a particular alert fires, we recommend implementing automation." (Maintaining Playbooks)
- Playbooks go stale as fast as production changes. "Details in playbooks go out of date at the same rate as production environment changes." (Maintaining Playbooks)
- Pager load defined. "Pager load is the number of paging incidents that an on-call engineer receives over a typical shift length (such as per day or per week)." (Anatomy of Pager Load)
- Not everything needs a response within minutes. "Engineers shouldn’t have to be at a computer and working on a problem within minutes of receiving a page unless there is a very good reason to do so." (Appropriate Response Times)
- Many pages would be better as automated repair or a ticket. "it's generally better for a computer to fix a problem than requiring a human to fix it" (Appropriate Response Times)
- Table 8-1: revenue-impacting network outage, 5 minutes; stuck batch processing, 30 minutes; failing backups for a pre-launch service, a ticket. (Table 8-1)
- Every alert immediately actionable. "All alerts should be immediately actionable." (Alerting)
- Each alert has a playbook entry. "Each alert should have a corresponding playbook entry." (Alerting)
- New alerts run in a test mode, emailing instead of paging, for about a week first. "A week of testing is probably about right." (Alerting)
- Pages hurt, so add them sparingly. "Receiving a page creates a negative psychological impact." (Alerting)
- Shifts of at most 12 hours. "we recommend limiting shift lengths to 12 hours" (Shift Length)
- 24 hours without a break isn't sustainable. "In our experience, 24 hours of on-call duty without reprieve isn't a sustainable setup." (Shift Length)
- Noisy duplicate pages train people to ignore them. "I take a quick look at the page subject and know they are duplicates. So I just ignore them." (Scenario: A culture of "survive the week")

- With SLO- and symptom-based alerting, loosening thresholds is rarely the fix. "If a team fully subscribes to SLO-based and symptom-based alerting, relaxing alert thresholds is rarely an appropriate response to being paged." (Alerting)
- Test new alerts by emailing the author instead of paging. "For example, you might email the alert’s author when the alert fires, rather than paging the on-call engineer." (Alerting)
- Test long enough to see rollouts, maintenance and weekly peaks. "Be sure to run the new alerts in test mode long enough to experience typical periodic production conditions, such as regular software rollouts, maintenance events by your Cloud provider, weekly load peaks, and so on." (Alerting)
- One site can split a week between a day person and a night person. "it would be better for two engineers to split a week of on-call, with one person on-call during the day and one on-call overnight" (Shift Length)
- (For on-call.) What each response time means for the on-call, Table 8-1. "SRE needs to be within arm's reach of a charged and authenticated laptop with network access at all times" / "SRE can leave their home for a quick errand or short commute" (Table 8-1)
- The team approves new alerts together. "Explicitly approve or disallow the new alert as a team." (Alerting)

## Visuals worth redrawing

- Table 8-1 as a three-row ladder of response times.

## My notes

- Evernote's P1/P2/P3 tiers match PagerDuty's alert priorities.
