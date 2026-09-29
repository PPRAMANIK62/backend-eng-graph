---
id: cisa-sbom-minimum-elements-2026
title: 2026 Minimum Elements for a Software Bill of Materials (SBOM)
author: CISA, NSA, FBI and international partners
url: https://www.cisa.gov/resources-tools/resources/2026-minimum-elements-software-bill-materials-sbom
kind: spec
primary: false
---

## Summary

Joint guidance (2026) that replaces NTIA's 2021 minimum elements for an
SBOM: which data fields an SBOM must carry, how complete it must be,
and in which formats. Read from the PDF linked on the page.

## Key claims

- Replaces the NTIA 2021 document. "updates and replaces the minimum elements for an SBOM published by the National Telecommunications and Information Administration (NTIA) in 2021." (landing page)
- What an SBOM is. "An SBOM is a nested inventory, a list of ingredients that make up software applications and systems." (PDF, Introduction)
- It's hierarchical: components have subcomponents, first party and third party. (PDF, Why SBOM)
- Not a fix for everything. "SBOMs will not resolve all software security and supply chain concerns, but they are a necessary step for enabling and empowering risk-informed security decision-making." (PDF, Why SBOM)
- Coverage includes transitive dependencies. "An SBOM should include information for all components that make up the target software, including transitive dependencies." (PDF, Coverage)
- The point of completeness: rule out a new vulnerability. "the recipient of an SBOM should be able to conclude that a newly reported vulnerability does not affect them if the SBOM does not list the component associated with the vulnerability." (PDF, Coverage)
- New fields in 2026 include SBOM Author Signature, Component Hash Value and Algorithm, Component License, SBOM Generation Context, tool name and version. (PDF, Notable Updates)
- The two widely used formats are SPDX and CycloneDX. (PDF, Machine-Processable Data)
- Unknown information should be marked as unknown explicitly, not left out. (PDF, Notable Updates list; Component Version)
- Issued jointly. "CISA, the National Security Agency, the Federal Bureau of Investigation, and international partners released joint guidance" (landing page)
- The two formats. "The two data formats currently widely used by software ecosystem stakeholders to generate and consume SBOMs are SPDX and CycloneDX." (PDF, Machine-Processable Data; footnote markers dropped)
- Unknown version marked as unknown. "If no version identifier is available, the SBOM author should indicate that the information is unknown." (PDF, Component Version)
- Component Producer is a field. "The Component Producer element replaces the Supplier Name element from the 2021 SBOM Minimum Elements." (PDF, Component Producer)

## Visuals worth redrawing

None.

## My notes

- VEX (whether a product is actually affected by a vulnerability) is
  mentioned as a related document type.
- PDF: https://www.cisa.gov/sites/default/files/2026-07/2026_cisa_sbom_minimum_elements_508c.pdf
  (the path contains a year-month; keep it out of articles).
