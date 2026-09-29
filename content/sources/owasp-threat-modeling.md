---
id: owasp-threat-modeling
title: Threat Modeling Cheat Sheet
author: OWASP Cheat Sheet Series contributors
url: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's practical summary of threat modeling: the four questions turned
into four steps (model the system, identify and rank threats, respond,
review), data flow diagrams with trust boundaries, STRIDE with an
example per category, and the four kinds of response.

## Key claims

- What it is. "It involves modeling a system from a security perspective, identifying applicable threats based on this model, and determining responses to these threats." (Overview)
- Do it early and keep it up to date. "A threat model is something that should be maintained, updated and refined alongside the system." (Overview)
- No single standard process. "There is no universally accepted industry standard for the threat modeling process, no "right" answer for every use case." (Addressing Each Question)
- DFDs are the usual model. "data flow diagrams (DFDs) are arguably the most common approach." (System Modeling)
- What the model must show. "it is important that the solution provides a clear view of trust boundaries, data flows, data stores, processes, and the external entities which may interact with the system." (System Modeling)
- STRIDE maps each threat to a property it violates: spoofing/authentication, tampering/integrity, repudiation/accounting, information disclosure/confidentiality, denial of service/availability, elevation of privileges/authorization. Example for elevation: "An attacker tampers with a JWT to change their role." (Threat Identification, table)
- Example for spoofing. "An attacker steals the authentication token of a legitimate user and uses it to impersonate the user." (Threat Identification, table)
- Example for denial of service. "An attacker locks a legitimate user out of their account by performing many failed authentication attempts." (Threat Identification, table)
- Ranking in theory is likelihood times impact, but it's hard. "However, these both can be challenging to calculate, and they ignore the work to fix a problem." (Threat Identification)
- Every threat needs a response: mitigate, eliminate, transfer, accept. "Each threat identified earlier must have a response." (Response and Mitigations)
- Mitigations must be buildable. "Mitigation strategies must be actionable not hypothetical; they must be something that can actually be built into to the system being developed." (Response and Mitigations)
- Review asks whether mitigations can be tested. "Can the agreed upon mitigations be tested?" (Review and Validation)
- STRIDE came from Microsoft. "STRIDE is a mature and popular threat modeling technique and mnemonic originally developed by Microsoft employees." (Threat Identification)
- Review questions include whether each threat has an agreed response. "For each identified threat, has a response strategy been agreed upon?" (Review and Validation)

## Visuals worth redrawing

- The STRIDE table (category, property violated, example). Redrawn as a
  table in the article.

## My notes

- Other methods named: PASTA, OCTAVE, LINDDUN (privacy), VAST.
