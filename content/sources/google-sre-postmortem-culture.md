---
id: google-sre-postmortem-culture
title: "Postmortem Culture: Learning from Failure (Site Reliability Engineering, chapter 15)"
author: John Lunney and Sue Lueder; edited by Gary O'Connor (Google)
url: https://sre.google/sre-book/postmortem-culture/
kind: book
primary: true
---

## Summary

The SRE book chapter on postmortems: what they contain, when to write
one, what "blameless" means, and how Google reviews and shares them.
Online edition, copyright 2017.

## Key claims

- What a postmortem is. "A postmortem is a written record of an incident, its impact, the actions taken to mitigate or resolve it, the root cause(s), and the follow-up actions to prevent the incident from recurring." (introduction)
- Its main goal is preventive action. "especially, that effective preventive actions are put in place to reduce the likelihood and/or impact of recurrence" (Google's Postmortem Philosophy)
- Not a punishment. "Writing a postmortem is not punishment—it is a learning opportunity for the entire company." (Google's Postmortem Philosophy)
- Common triggers: user-visible downtime past a threshold, any data loss, on-call intervention, long resolution, monitoring failure. "Data loss of any kind" (Google's Postmortem Philosophy, list)
- Set the triggers in advance; any stakeholder may ask for one. "It is important to define postmortem criteria before an incident occurs so that everyone knows when a postmortem is necessary." (Google's Postmortem Philosophy)
- Blameless defined. "A blamelessly written postmortem assumes that everyone involved in an incident had good intentions and did the right thing with the information they had." (Google's Postmortem Philosophy)
- Blame makes people hide problems. "people will not bring issues to light for fear of punishment" (Google's Postmortem Philosophy)
- Blameless culture came from healthcare and aviation. "Blameless culture originated in the healthcare and avionics industries where mistakes can be fatal." (Google's Postmortem Philosophy)
- Fix systems, not people. "you can fix systems and processes to better support people making the right choices when designing and maintaining complex systems" (Google's Postmortem Philosophy)
- Review questions include whether the root cause was deep enough and the action items at the right priority. "Was the root cause sufficiently deep?" (Collaborate and Share Knowledge)
- Every draft is reviewed. "An unreviewed postmortem might as well never have existed." (Best Practice: No Postmortem Left Unreviewed)
- Old postmortems are reused for training (Wheel of Misfortune) and reading clubs. (Introducing a Postmortem Culture)

- Don't stigmatize teams that write many postmortems. "It is also important not to stigmatize frequent production of postmortems by a person or team." (Best Practice: Avoid Blame and Keep It Constructive)
- Senior engineers review drafts for completeness. "In practice, teams share the first postmortem draft internally and solicit a group of senior engineers to assess the draft for completeness." (Collaborate and Share Knowledge)
- Any stakeholder may request a postmortem. "In addition to these objective triggers, any stakeholder may request a postmortem for an event." (Google's Postmortem Philosophy)

## Visuals worth redrawing

None.

## My notes

- Google keeps "root cause" as a term; compare cook-how-complex-systems-fail.
