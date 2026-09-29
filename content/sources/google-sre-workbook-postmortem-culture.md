---
id: google-sre-workbook-postmortem-culture
title: "Postmortem Culture: Learning from Failure (The Site Reliability Workbook, chapter 10)"
author: Daniel Rogers, Murali Suriar, Sue Lueder, Pranjal Deo, Divya Sudhakar, with Gary O'Connor and Dave Rensin
url: https://sre.google/workbook/postmortem-culture/
kind: book
primary: true
---

## Summary

The SRE Workbook chapter on postmortems. It shows a bad and a good
postmortem of the same real Google outage (automation sent a whole
fleet of edge machines to disk erase), explains what makes the good one
better, and lists how organizations reward or undermine the practice.
Online edition, copyright 2018.

## Key claims

- The case: a bug in maintenance automation plus weak rate limits took thousands of servers offline at once. "A bug in our maintenance automation, combined with insufficient rate limits, caused thousands of servers carrying production traffic to simultaneously go offline." (Case Study)
- Bad action items are mostly mitigative; changing people is less reliable than changing systems. "In general, trying to change human behavior is less reliable than changing automated systems and processes." (Key action item characteristics missing)
- Vague verbs make success unmeasurable. "The first two action items in the list use ambiguous phrases like “Improve” and “Make better.”" (Key action item characteristics missing)
- Untracked action items get forgotten. "Without a formal tracking process, action items from postmortems are often forgotten, resulting in outages." (Key action item characteristics missing)
- A postmortem with no follow-up is worthless to users. "To our users, a postmortem without subsequent action is indistinguishable from no postmortem." (Note, quoting Ben Treynor Sloss)
- Naming individuals makes people risk-averse and hide facts. "They may be motivated to cover up facts critical to understanding and preventing recurrence." (Counterproductive finger pointing)
- No animated language. "A postmortem is a factual artifact that should be free from personal judgments and subjective language." (Animated language)
- One owner, many collaborators. "It’s better to have a single owner and multiple collaborators." (Missing ownership)
- Share widely. "The value of a postmortem is proportional to the learning it creates." (Limited audience)
- The bad one was published four months after the incident, and the incident recurred in the meantime. "Our example postmortem was published four months after the incident." (Delayed publication)
- The good one had owners, tracking numbers, priorities and measurable, preventive action items. "All action items have both an owner and a tracking number." (Concrete action items)
- Focus on what, not who. "Focuses on “what” went wrong, not “who” caused the incident." (Blamelessness)
- The good one went out within a week. "The postmortem was written and circulated less than a week after the incident was closed." (Promptness)
- Reward closing action items, not just writing. "If you reward engineers for writing postmortems, but not for closing the associated action items, you risk an unvirtuous cycle of unclosed postmortems." (Reward action item closeout)
- Repeat incidents mean digging deeper: are action items closing, is feature work winning? "Are action items taking too long to close?" (Repeating incidents)
- Postmortems are for future teammates. "Postmortems are letters you write to future team members" (Lacking time to write postmortems)

- Give numbers for impact; an estimate beats nothing. "Even if there is no concrete data, a well-informed estimate is better than no data at all." (Key details omitted)
- Use the Background and Glossary sections for context. "use the Background and/or Glossary sections (which can link to longer documents)" (Missing context)
- The template's lessons sections: things that went well, things that went poorly, where we got lucky. (Bad Postmortem and Good Postmortem, Lessons Learned headings)
- The bad example's one "preventative" item asked humans to be less error-prone. "The one “preventative” action item suggests we “make humans less error-prone.”" (Key action item characteristics missing)
- Only one action item had a tracking bug. "Only one action item was assigned a tracking bug." (Key action item characteristics missing)
- Action items had no owners. "The Action Items section has little or no ownership for its entries." (Missing ownership)
- The good example's action items have checkable end states. "The action items have a verifiable end state (e.g., “Add an alert when more than X% of our machines have been taken away from us”)." (Concrete action items)
- The good example includes preventive items. "Each action item “theme” has Prevent/Mitigate action items that help avoid outage recurrence" (Concrete action items)
- Examples of animated language to avoid. "Superfluous language (e.g., “careless ignorance”)" (Animated language)
- The incident recurred before the late postmortem came out. "had the incident recurred (which in reality, did happen)" (Delayed publication)
- Share even with customers. "We recommend proactively sharing your postmortem as widely as possible—perhaps even with your customers." (Limited audience)
- Include everyone involved in writing it. "It can be easy to overlook key contributing factors to an outage when the postmortem is written in isolation or by a single team." (Include all incident participants in postmortem authoring)
- Wheel of Misfortune reuses old postmortems to train new engineers. "Use the Wheel of Misfortune when training new engineers: a cast of engineers reenacts a previous postmortem, assuming roles laid out in the postmortem." (Hold training exercises)
- Repeat incidents: is feature velocity winning over reliability fixes? "Is feature velocity trumping reliability fixes?" (Repeating incidents)
- (For postmortems.) What the automation did: sent satellite (edge) machines to disk erasure. "From there, datacenter automation executed the decom workflow, wiping the hard drives of the majority of satellite machines before this action could be stopped." (Case Study)

## Visuals worth redrawing

None worth redrawing; the side-by-side of the two documents is the lesson.

## My notes

- The page's example documents contain calendar dates; none copied here.
