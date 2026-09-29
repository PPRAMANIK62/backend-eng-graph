---
id: owasp-api-top-10-2023
title: OWASP Top 10 API Security Risks – 2023
author: OWASP API Security Project
url: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
kind: docs
primary: true
---

## Summary

The list page of the 2023 edition of the OWASP API Security Top 10, the
current edition when this was written (the site lists only 2019 and
2023). Ten risks, API1 to API10, each with a one-paragraph description.
The page's navigation also shows the 2019 list, so you can see what
changed.

## Key claims

- API1 is broken object level authorization, and the check belongs in every function that takes an ID from the user. "Object level authorization checks should be considered in every function that accesses a data source using an ID from the user." (API1:2023 row)
- API2 is broken authentication: attackers compromise tokens or abuse flaws to take over identities. "allowing attackers to compromise authentication tokens or to exploit implementation flaws to assume other user's identities temporarily or permanently." (API2:2023 row)
- API3 merges two 2019 entries into one root cause, authorization at the property level. "This category combines API3:2019 Excessive Data Exposure and API6:2019 - Mass Assignment, focusing on the root cause: the lack of or improper authorization validation at the object property level." (API3:2023 row)
- API4 is unrestricted resource consumption, including paid resources like SMS. "Successful attacks can lead to Denial of Service or an increase of operational costs." (API4:2023 row)
- API5 is broken function level authorization: reaching admin functions. "attackers can gain access to other users’ resources and/or administrative functions." (API5:2023 row)
- API6 is unrestricted access to sensitive business flows, which isn't necessarily a code bug. "This doesn't necessarily come from implementation bugs." (API6:2023 row)
- API7 is SSRF: fetching a user-supplied URI without validating it. "This enables an attacker to coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall or a VPN." (API7:2023 row)
- API8 is security misconfiguration. "Software and DevOps engineers can miss these configurations, or don't follow security best practices when it comes to configuration" (API8:2023 row)
- API9 is improper inventory management: old versions and debug endpoints nobody tracks. "A proper inventory of hosts and deployed API versions also are important to mitigate issues such as deprecated API versions and exposed debug endpoints." (API9:2023 row)
- API10 is unsafe consumption of APIs: trusting third-party API data more than user input. "Developers tend to trust data received from third-party APIs more than user input, and so tend to adopt weaker security standards." (API10:2023 row)
- The 2019 list (in the page navigation) had Injection at API8 and Insufficient Logging & Monitoring at API10; neither is in the 2023 list. "API8:2019 Injection" / "API10:2019 Insufficient Logging & Monitoring" (navigation, 2019 edition)
- The site lists two editions, 2023 and the earlier 2019 list. "OWASP Top 10 API Security Risks – 2019" (navigation; the project home page lists only the 2023 and 2019 editions)
- API4 resources include CPU, memory, bandwidth and paid services such as SMS. "Satisfying API requests requires resources such as network bandwidth, CPU, memory, and storage." (API4:2023 row)
- API6 examples. "expose a business flow - such as buying a ticket, or posting a comment - without compensating for how the functionality could harm the business if used excessively in an automated manner." (API6:2023 row)

## Visuals worth redrawing

None. It's a table.

## My notes

- Why Injection left the list is on the methodology page
  (owasp-api-2023-methodology).
- No 2025 or later API edition existed on owasp.org/API-Security when
  this was opened.
