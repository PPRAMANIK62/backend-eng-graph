---
id: pagerduty-incident-roles
title: Different Roles (PagerDuty Incident Response documentation)
author: PagerDuty
url: https://response.pagerduty.com/before/different_roles/
kind: docs
primary: true
---

## Summary

PagerDuty's public, cut-down version of its internal incident response
docs: the roles in a major incident and what each one does. Read with
its "What is an Incident?" and "During an Incident" pages, which are
not cited here.

## Key claims

- Some roles have one person (IC), others many (SMEs). "Certain roles only have one person per incident (e.g. IC), whereas other roles can have multiple people (e.g. Subject Matter Expert, SME)." (intro)
- Roles collapse onto fewer people for small incidents. "It is not intended that every role be filled by a different person for every incident." (Flexible Structure)
- The IC is the single source of truth. "An Incident Commander acts as the single source of truth of what is currently happening and what is going to happen during a major incident." (Incident Commander, What is it?)
- The IC delegates all repair work. "Delegate all repair actions, the Incident Commander is NOT a resolver." (Incident Commander, responsibilities)
- The IC also starts the postmortem and assigns an owner. "Assigning the postmortem after the event is over, this can be done after the call." (Incident Commander, responsibilities)
- The Deputy is a hot standby IC, not a shadow. "This is not a shadow where the person just observes." (Deputy)
- The Scribe keeps the timeline for later review. "A Scribe documents the timeline of an incident as it progresses and makes sure all important decisions and data are captured for later review." (Scribe)
- Subject matter experts report in CAN form: condition, actions, needs. "Condition: What is the current state of the service? Is it healthy or not?" (Subject Matter Expert)
- Typically the service's primary on-call is the SME. "Typically the service's primary on-call will act as the SME for that service." (Subject Matter Expert, Who are they?)
- A Customer Liaison handles the public side so others can work the problem. "we need a role which is focused purely on the customer interaction side of things so that it can be done properly" (Customer Liaison, Why have one?)
- An Internal Liaison pages people and keeps stakeholders updated, to keep the call distraction free. "Interact with internal stakeholders to answer their questions, to keep the primary call distraction free." (Internal Liaison)

## Visuals worth redrawing

- The role hierarchy diagram (IC with Deputy and Scribe, over SMEs and
  liaisons). (top of page)

## My notes

- Names differ from Google's (Ops Lead vs SMEs, Comms Lead vs two
  liaisons) but the shape is the same.
