---
id: google-sre-workbook-incident-response
title: Incident Response (The Site Reliability Workbook, chapter 9)
author: Jennifer Mace, Jelena Oertel, Stephen Thorne, Arup Chakrabarti (PagerDuty), with Jian Ma and Jessie Yang
url: https://sre.google/workbook/incident-response/
kind: book
primary: true
---

## Summary

The SRE Workbook chapter on incident response, written by Google and
PagerDuty engineers. It sets out the "three Cs", the three main roles,
and four case studies, including a GKE outage that would have been much
shorter with a generic mitigation. Online edition, copyright 2018.

## Key claims

- Resolving and managing are different jobs. "Resolving an incident means mitigating the impact and/or restoring the service to its previous condition." (introduction)
- Managing means coordination and communication. "Managing an incident means coordinating the efforts of responding teams in an efficient manner and ensuring that communication flows both between the responders and to those interested in the incident’s progress." (introduction)
- Four basic principles: clear line of command, defined roles, a working record, declare early and often. "Declare incidents early and often." (introduction)
- ICS came from firefighting. "ICS was established in 1968 by firefighters as a way to manage wildfires." (Incident Command System)
- The three Cs. "Maintain control over the incident response." (Incident Command System; the other two are coordinate and communicate)
- The three main roles. "The main roles in incident response are the Incident Commander (IC), Communications Lead (CL), and Operations or Ops Lead (OL)." (Main Roles in Incident Response)
- Whoever declares usually becomes IC, and the IC holds undelegated roles. "By default, the IC assumes all roles that have not been delegated yet." (Main Roles in Incident Response)
- The IC may hand off command and become the Ops Lead, or assign the OL role. "The IC may either hand off their role to someone else and assume the OL role, or assign the OL role to someone else." (Main Roles in Incident Response)
- Roles shrink back as the incident shrinks. "If the incident becomes small enough, the CL role can be subsumed back into the IC role." (Main Roles in Incident Response)
- Google Home case: no incident was declared and the response relied on weekend heroics. "successful incident management shouldn’t rely on heroic efforts of individuals" (Case Study 1, Review)
- Stop impact first, then find the cause. "Google always aims to first stop the impact of an incident, and then find the root cause (unless the root cause just happens to be identified early on)." (Case Study 1, Review)
- Managed incidents resolve faster, in Google's experience. "Our experience shows that managed incidents are resolved faster." (Case Study 1, Review)
- GKE case numbers: CreateCluster failed in Europe for 6 hours 40 minutes; 41 people in IRC; 28 action items. "CreateCluster had failed in Europe for 6 hours and 40 minutes before it was fixed." (Case Study 2)
- The formal structure came two hours late. "Il-Seong put a formal incident response structure in place two hours after the first page." (Case Study 2, Review)
- Generic mitigations defined. "Generic mitigations are actions that first responders take to alleviate pain, even before the root cause is fully understood." (Case Study 2, Review)
- Generic mitigations are blunt but fast. "generic mitigations are blunt instruments and may cause other disruptions to the service" (Case Study 2, Review)
- Rolling back all images once the location was known would have mitigated by 10 a.m. (the fix came at 12:11 p.m.). "If the responders had rolled back all images to a known good state once they discovered the issue’s general location, the incident would have been mitigated by 10 a.m." (Case Study 2, Review)
- You only need the location of the cause to mitigate. "To mitigate an incident, you don’t have to fully understand the details—you only need to know the location of the root cause." (Case Study 2, Review)
- Build mitigation tools before incidents. "The right time to create general-purpose mitigation tools is before an incident occurs, not when you are responding to an emergency." (Case Study 2, Review)
- Mitigation first. "It’s important to remember that first responders must prioritize mitigation above all else, or time to resolution suffers." (Case Study 2, Review)
- Customers care about the errors stopping. "Ultimately, customers do not care whether or not you fully understand what caused an outage." (Case Study 2, Review)
- The order for an active incident: assess impact, mitigate, root-cause, then fix and write the postmortem. "Assess the impact of the incident." (Case Study 2, ordered list)
- PagerDuty case: IC and on-call engineers were rotated every four hours in a 10-hour incident. "During this time, we rotated on-call engineers and the IC every four hours." (Case Study 4)
- Stakeholders assume nothing is happening unless told. "Unless you acknowledge that an incident is happening and actively being addressed, people will automatically assume nothing is being done to resolve the issue." (Keep your audience informed)
- Decide the communication channel beforehand. "no Incident Commander wants to make this decision during an incident" (Decide on a communication channel)
- Drills: DiRT, Wheel of Misfortune, and treating minor problems as major ones for practice. "You can also practice incident response by intentionally treating minor problems as major ones requiring a large-scale response." (Drills)
- A working document helps once three or more people are involved. "When three or more people work on an incident, it’s useful to start a collaborative document that lists working theories, eliminated causes, and useful debugging information, such as error logs and suspect graphs." (footnote 1)

- Google's IMAG and PagerDuty's process are both ICS adaptations. "This chapter explores two such frameworks: PagerDuty’s Incident Response process and Incident Management At Google (IMAG)." (Incident Command System)
- The communicate C covers responders, the organization and outsiders. "Communicate between incident responders, within the organization, and to the outside world." (Incident Command System)
- The CL gives updates and handles inquiries. "The CL’s main duties include providing periodic updates to the incident response team and stakeholders, and managing inquiries about the incident." (Main Roles)
- Leads can build their own teams. "Both the CL and OL may lead a team of people to help manage their specific areas of incident response." (Main Roles)
- Google Home: a client bug fetched speaker files far more often than expected, exceeding quota. "A bug in Google Assistant version 1.88 caused speaker recognition files to be fetched 50 times more often than expected, exceeding this quota." (Case Study 1, Context)
- The team asked for quota increases as mitigations, and the rollout continued. "they requested another increase to the quota, which seemed to mitigate the problem" (Case Study 1, Incident)
- Developers rallied over the weekend. "First, the developers rallied on the weekend and provided valuable input to resolve the issue." (Case Study 1, Review)
- Mitigation worked three times, but only finding the cause stopped recurrence; the rollout should have been paused. "In this case, mitigation successfully stopped the impact on three separate occasions, but the team could only prevent the issue from recurring when they discovered the root cause." (Case Study 1, Review)
- Pause the rollout. "After the first mitigation, it would have been better to postpone the rollout until the root cause was fully determined" (Case Study 1, Review)
- The team didn't declare an incident. "Finally, the team did not declare an incident when problems first appeared." (Case Study 1, Review)
- GKE: the on-call was paged at 6:41 a.m. for CreateCluster prober failures. "One Thursday at 6:41 a.m. PST, London’s on-call SRE for GKE, Zara, was paged for CreateCluster prober failures across several zones." (Case Study 2)
- GKE: a plausible root cause (a corrupted image) was found at 9:56 a.m. "At 9:56 a.m., the team had identified a plausible root cause." (Case Study 2)
- Their bespoke mitigation meant rebuilding binaries, about an hour, then restarting the build. "For the second option, pushing a new configuration meant rebuilding binaries, which took about an hour." (Case Study 2)
- All European zones back to 0% errors at 12:11 p.m. "By 12:11 p.m., all European zones had fallen to 0% error." (Case Study 2)
- PagerDuty's NTP incident lasted more than 10 hours. "lasted more than 10 hours, but had very minimal customer impact" (Case Study 4)
- Forgetting to call off the response leaves people thinking it's still on. "if you forget to call off the response once the issue has been mitigated or resolved, people will assume the incident is ongoing" (Keep your audience informed)
- Prepare message templates and a contact list beforehand. "Having a list of people to email or page prepared beforehand saves critical time and effort." (Prepare a list of contacts)
- (For incident-response.) Google Home: the worst of it came over a weekend. "As the rollout increased progressively to all Google Home devices, however, users lost half of their requests during the weekend" (Case Study 1, Context)
- The rollout ran on a weekend. "The rollout was happening on a weekend, when developers were not readily available." (Case Study 1, Incident)

## Visuals worth redrawing

- The GKE timeline (assessed impact, found possible cause, bespoke
  mitigation, found root cause) with where a generic mitigation would
  have landed. (Case Study 2, Review)

## My notes

- The IC-doing-ops question: here the IC may take the OL role;
  PagerDuty's own docs say the IC is not a resolver.
