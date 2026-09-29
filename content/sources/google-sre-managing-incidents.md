---
id: google-sre-managing-incidents
title: Managing Incidents (Site Reliability Engineering, chapter 14)
author: Andrew Stribblehill; edited by Kavita Guliani (Google)
url: https://sre.google/sre-book/managing-incidents/
kind: book
primary: true
---

## Summary

The Google SRE book chapter on running an incident. It tells the same
outage twice, once unmanaged and once managed, and lays out Google's
version of the Incident Command System: separate roles, one place to
coordinate, a live incident document, and explicit handoffs. Online
edition, copyright 2017.

## Key claims

- The unmanaged incident went wrong through three hazards: focus on the technical problem, poor communication, and freelancing. "Note that everybody in the preceding scenario was doing their job, as they saw it." (The Anatomy of an Unmanaged Incident)
- The on-call engineer was too deep in the fix to see the bigger picture. "She wasn’t in a position to think about the bigger picture of how to mitigate the problem because the technical task at hand was overwhelming." (Sharp Focus on the Technical Problem)
- Freelancing: someone made an uncoordinated change that made things worse. "His changes made a bad situation far worse." (Freelancing)
- Google's process is based on the Incident Command System. "Google’s incident management system is based on the Incident Command System, which is known for its clarity and scalability." (Elements of Incident Management Process) [footnote marker removed]
- Clear roles give people more autonomy, not less. "Somewhat counterintuitively, a clear separation of responsibilities allows individuals more autonomy than they might otherwise have, since they need not second-guess their colleagues." (Recursive Separation of Responsibilities)
- The incident commander holds every role not delegated. "De facto, the commander holds all positions that they have not delegated." (Incident Command)
- Only the ops team changes the system during an incident. "The operations team should be the only group modifying the system during an incident." (Operational Work)
- The communication role is the public face and sends periodic updates. "This person is the public face of the incident response task force." (Communication)
- Planning handles longer-term work: bugs, dinner, handoffs, tracking what was changed so it can be reverted. "tracking how the system has diverged from the norm so it can be reverted once the incident is resolved" (Planning)
- People need to know where to find the incident commander (a war room, or a chat channel). "Interested parties need to understand where they can interact with the incident commander." (A Recognized Command Post)
- The commander's most important job is the living incident document. "The incident commander’s most important responsibility is to keep a living incident document." (Live Incident State Document)
- Don't host the incident tooling on the system you're fixing. "depending on the software you are trying to fix as part of your incident management system is unlikely to end well" (Live Incident State Document)
- Handoffs of command are explicit and acknowledged. "You’re now the incident commander, okay?" (Clear, Live Handoff)
- Declare early. "It is better to declare an incident early and then find a simple fix and close out the incident than to have to spin up the incident management framework hours into a burgeoning problem." (When to Declare an Incident)
- The author's team's criteria: a second team is needed, customers can see it, or it's unsolved after an hour. "Is the issue unsolved even after an hour’s concentrated analysis?" (When to Declare an Incident)
- Skills fade without use, so use the framework for other cross-team changes and practice it. "Incident management proficiency atrophies quickly when it’s not in constant use." (When to Declare an Incident)
- The order of priorities. "Stop the bleeding, restore service, and preserve the evidence for root-causing." (Best Practices for Incident Management, Prioritize)
- Rotate roles between incidents. "Encourage every team member to acquire familiarity with each role." (Best Practices, Change it around)

- The story: data centers fail one after another, the rest overload; the on-call rolls back, a developer is woken; executives ask for an ETA; someone deploys a CPU affinity change without coordinating and the servers restart and die. "Independently, the vice presidents are nagging you for an ETA" (Unmanaged Incidents)
- The uncoordinated change. "He felt certain that he could optimize the remaining server processes if he could just deploy this one simple change to the production environment, so he did so." (Unmanaged Incidents)
- The commander can remove roadblocks for ops. "If appropriate, they can remove roadblocks that prevent Ops from working most effectively." (Incident Command)
- The same framework can run other cross-team operational changes, which keeps skills in use. "the incident management framework can apply to other operational changes that need to span time zones and/or teams" (When to Declare an Incident)
- Teams role-play old, already-solved incidents to practice. "We often role-play the response to an on-call issue that has already been solved, perhaps by colleagues in another location, to further familiarize ourselves with incident management." (When to Declare an Incident)
- (For incident-response.) The story starts with three of five datacenters failing. "Then the third out of your five datacenters fails." (Unmanaged Incidents)
- The on-call rolls back, then calls the code's author. "so you decide to revert the servers to the previous release. When you see that the rollback hasn’t helped, you call Josephine, who wrote most of the code for the now-hemorrhaging service." (Unmanaged Incidents)

## Visuals worth redrawing

None on the page. The role structure (commander over ops, communication,
planning) is easy to draw.

## My notes

- Compare with the workbook chapter, which renames the roles (IC, Ops
  Lead, Communications Lead) and drops planning from the main three.
