---
id: owasp-api-top-10
title: The OWASP API Top 10
depth: short
phase: 15
note: >-
  The standard checklist of API security risks.
needs: [threat-modeling]
leads_to: [bola, ssrf]
compare_with: []
---

# The OWASP API Top 10

The OWASP API Security Top 10 is a list of the ten security risks that
OWASP's API security project thinks deserve the most attention in APIs.
The current edition is from 2023, the second after the first list in
2019. It works as a checklist when you review an API, and as a prompt
when you [[threat-modeling|threat model]] one. It's
meant to raise awareness, so covering all ten doesn't make an API
secure.

## The ten risks

| | Risk | What goes wrong |
|---|---|---|
| API1 | Broken object level authorization | The API takes an object ID from the client and doesn't check the caller may touch that object. See [[bola]]. |
| API2 | Broken authentication | Attackers compromise authentication tokens or exploit flaws in login to take over other users' accounts. |
| API3 | Broken object property level authorization | The check covers the object but not its fields: the API returns fields the caller shouldn't see, or accepts fields it shouldn't let them set. |
| API4 | Unrestricted resource consumption | No limits on CPU, memory, bandwidth or paid resources like SMS, so attackers cause outages or bills. |
| API5 | Broken function level authorization | Ordinary users can call admin functions. |
| API6 | Unrestricted access to sensitive business flows | A flow like buying tickets or posting comments works exactly as coded, but nothing stops someone automating it at scale. |
| API7 | Server side request forgery | The API fetches a URL the client supplied, and can be pointed at internal systems. See [[ssrf]]. |
| API8 | Security misconfiguration | Complex settings left wrong, or security practice not followed in [[configuration]]. |
| API9 | Improper inventory management | Nobody knows every host, API version and debug endpoint that's running, so old ones stay exposed. |
| API10 | Unsafe consumption of APIs | Data from third-party APIs is trusted more than user input, so attackers go through the third party. |

Three of the top five are authorization: API1 at the object level,
API3 at the field level, API5 at the function level. They're three
questions you ask on every endpoint: may this caller call this at all,
on this object, and see or change these fields? The
[[authorization-models]] page covers how to express the answers.

Two entries aren't code bugs in the usual sense. API6 can hold in an
API that does exactly what it was written to do. API10 is about where
you put your trust, which puts it near
[[supply-chain-security|supply chain security]].

## What changed from 2019

- **Merged.** 2019's "Excessive Data Exposure" and "Mass Assignment"
  became API3, because both come from the same missing check on
  properties.
- **New.** API6 (sensitive business flows) and API10 (unsafe
  consumption of APIs).
- **Gone.** "Injection" and "Insufficient Logging & Monitoring" are no
  longer on the list.

Injection didn't leave because it went away. The project dropped risks
that are generic, meaning they behave the same in APIs as in any web
application, to leave room for API-specific ones. [[sql-injection]]
still happens in APIs; this list just leaves it to other guides.

## Where it gets tricky

**It's expert opinion, not measured data.** The 2023 edition ran a
public call for data, and it produced nothing usable for statistics.
The team collected public incident reports and bug bounty data from
2019 to 2022 to guide the direction, but prevalence ratings were set by
consensus among the project team. Treat the order as informed judgment.

**Absent isn't safe.** Outdated components and injection were left off
on purpose, as generic risks. A review that checks only these ten items
misses them.

**A list isn't a threat model.** The ten are common failures across
many APIs. Your system has its own assets and attackers, and threat
modeling finds the ones specific to it. Use the list to make sure you
didn't skip the usual suspects.

## What this means when you build

- Put an authorization check in every handler that takes an ID, and
  decide which fields each role may read and write. That covers API1,
  API3 and API5.
- Write tests that try other users' objects and admin routes as a
  normal user.
- Set limits on anything a request can consume, and think about which
  flows are worth automating for an attacker.
- Keep an inventory of what's deployed, including old versions.
- Validate what third-party APIs send you as carefully as user input.
- This list doesn't replace OWASP's other Top 10 lists, like the
  general web one. Read those too.

## Further reading

- [OWASP Top 10 API Security Risks – 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/), OWASP API Security Project, 2023. The list with a paragraph per risk; each links to a page with examples and prevention.
- [Methodology and Data](https://owasp.org/API-Security/editions/2023/en/0xd0-about-data/), OWASP API Security Project, 2023. How the list was made, why the call for data failed, and why injection isn't on it.
