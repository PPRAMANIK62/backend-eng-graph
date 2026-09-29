---
id: owasp-api-2023-methodology
title: "OWASP API Security Top 10 2023: Methodology and Data"
author: OWASP API Security Project
url: https://owasp.org/API-Security/editions/2023/en/0xd0-about-data/
kind: docs
primary: true
---

## Summary

How the 2023 API Top 10 was put together: public incident data from bug
bounty platforms and reports, a call for data that got nothing usable,
expert review, and the OWASP Risk Rating Methodology. Also says why
generic risks like injection aren't on the list.

## Key claims

- The call for data produced nothing usable for statistics. "Unfortunately, this call for data did not result in data that would have enabled a relevant statistical analysis of the most common API security issues." (Overview)
- Incident data came from bug bounty platforms and public reports, 2019 to 2022. "Such data were collected from bug bounty platforms and publicly available reports. Only issues reported between 2019 and 2022 were considered." (Methodology)
- Prevalence ratings were a team consensus, not measured. "Prevalence ratings were decided from a consensus among the project team members, based on their experience in the field." (Methodology)
- The list covers API-specific risks; injection and outdated components were left out on purpose. "we didn't include risks such as "Vulnerable and Outdated Components" or "Injection", even though you might find them in API based applications." (API Specific Risks)
- Why: they don't behave differently in APIs. "These risks are generic, they don't behave differently in APIs, nor their exploitation is different." (API Specific Risks)
- It doesn't replace other Top 10 lists. "The goal of this project isn't to replace other top 10 lists, but instead to cover the existing and upcoming top API security risks that we believe the industry should be aware and diligent about." (Overview)
- It's meant as a forward-looking awareness document. "we believe to have a good forward-looking awareness document for the next three or four years" (Overview)

## Visuals worth redrawing

None.

## My notes

- The release notes page (0x04-release-notes) adds that the 2023 edition
  merged Excessive Data Exposure and Mass Assignment and added two new
  categories; the list page (owasp-api-top-10-2023) already shows the
  merge, so the release notes weren't given a note.
