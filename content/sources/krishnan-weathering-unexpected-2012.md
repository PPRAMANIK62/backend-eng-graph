---
id: krishnan-weathering-unexpected-2012
title: "Weathering the Unexpected"
author: Kripa Krishnan (Google), with a sidebar by Thomas A. Limoncelli
url: https://queue.acm.org/detail.cfm?id=2371516
kind: blog
primary: true
---

## Summary

ACM Queue article (volume 10, issue 9, 2012) by the person who ran
Google's company-wide Disaster Recovery Testing event, DiRT. How it
started, what it tests (systems and business processes), how risk is
managed, and funny, useful failures it found. The sidebar is a
fictionalized on-call view, including a talk-through restore from
backup that found two bugs. queue.acm.org blocked the fetch
(Cloudflare), so the text was read from the Wayback Machine copy of the
same URL.

## Key claims

- DiRT is an annual, multi-day, company-wide disaster recovery test. "Google runs an annual, company-wide, multi-day Disaster Recovery Testing event—DiRT—the objective of which is to ensure that Google's services and internal business operations continue to run following a disaster." (opening)
- It breaks live systems and also removes key people. "DiRT tests both Google's technical robustness, by breaking live systems, and our operational resilience by explicitly preventing critical personnel, area experts, and leaders from participating." (opening)
- It has caused real outages and lost revenue. "DiRT has caused accidental outages and in some cases revenue loss." (Setting Expectations)
- Big events should test complex scenarios; routine failovers belong in continuous testing. "Large, DiRT-style, company-wide events should be less about testing routine failure conditions such as single-service failovers or on-call handoffs, and more about testing complex scenarios or less-tested interfaces between systems and teams." (Setting Expectations)
- One core service failing to fail over (DNS, LDAP) can choke a whole recovery. "All it would take to choke the recovery process, however, is the failure of a single instance of a core infrastructure service—such as DNS (Domain Name System) or LDAP (Lightweight Directory Access Protocol)—to failover." (Setting Expectations)
- Start small. "A good way to kick off such an exercise is to start small and let the exercise evolve." (Growing the Program)
- The simulated earthquake broke authentication and locked teams out of their workstations. "the data-center outage caused authentication systems to fail in unexpected ways, which in turn locked most teams out of their workstations." (Growing the Program)
- The first emergency communications test: one person found the plan; later the bridge held only 40 callers. "The first DiRT exercise revealed that exactly one person was able to find the plan and show up on the correct phone bridge at the time of the exercise." (What to Test)
- Documentation doesn't prove anything works. "Copious documentation on how something should work doesn't mean anyone will use it, or that it will work if they do. The only way to make sure is through testing." (What to Test)
- Every test is reviewed and has a plan to revert. "At minimum, all tests need to be thoroughly reviewed by a cross-functional technical team and accompanied by a plan to revert should things go wrong." (Risk Mitigation)
- Sandboxes are safer but less realistic. "these environments may have configurations that are significantly different from those in production, resulting in less realistic outcomes." (Risk Mitigation)
- Services can exempt themselves by failing in advance, but can never pass in advance. "While services can "prefail" and exempt themselves, there is no concept of "prepassing" the test—services have to make it through to "pass."" (Risk Mitigation)
- A command center watches all tests and reverts when needed. "When the unforeseen happens, the team in the command center (made up largely of technical experts in various areas) jumps in to revert the test or fix the offending issue." (Risk Mitigation)
- Tests are worthless without fixes. "Of course, tests are of almost no value if no effort is put into fixing the problems that surface during the tests." (What to Test)
- Sidebar restore drill: a command in the doc needed new parameters, and the restore area was too small because the database had grown. "Second, the temporary area used to do the restore does not have enough space. It had enough space when the procedure was written, but the database has grown since then." (Sidebar: Google DiRT: The View from Someone being Tested)
- Treat failures as learning, not blame. "When they do, the focus needs to be on fixing the error instead of reprimanding an individual or team for a failure of complex systems." (Setting Expectations)
- A failed-over approvals system was useless because all approvers were in the lost site. "The system on its own was useless, however, since all the critical approvers were in Mountain View and therefore unavailable." (What to Test)
- The bridge held only 40 callers. "This is when we learned the bridge wouldn't hold more than 40 callers." (What to Test)
- Never-tried tests can run in a sandbox. "If the test has never been attempted before, running it in a sandbox can help contain the effects." (Risk Mitigation)
- The restore-drill sidebar is fictionalized and a talk-through, not a live test. "This is a fictionalized account of a Google DiRT (Disaster Recovery Testing) exercise as seen from the perspective of the engineers responsible for running the services being tested." / "No, just talk me through it." (Sidebar)

## Visuals worth redrawing

None.

## My notes

- The sidebar is labelled fictionalized ("The names, location, and situation have been changed"); treat the restore story as an illustration, not a report.
