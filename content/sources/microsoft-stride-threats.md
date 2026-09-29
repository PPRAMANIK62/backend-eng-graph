---
id: microsoft-stride-threats
title: Microsoft Threat Modeling Tool threats
author: Microsoft
url: https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
kind: docs
primary: true
---

## Summary

Microsoft's page for its Threat Modeling Tool, part of the Security
Development Lifecycle. It lists the STRIDE categories, which Microsoft
created, with its own definitions.

## Key claims

- The tool is part of Microsoft's SDL and aims at early fixes. "It allows software architects to identify and mitigate potential security issues early, when they are relatively easy and cost-effective to resolve." (intro)
- The kind of question it helps ask. "How can an attacker change the authentication data?" (intro)
- STRIDE groups threats to simplify the conversation. "Microsoft uses the STRIDE model, which categorizes different types of threats and simplifies the overall security conversations." (STRIDE model)
- Tampering covers data at rest and in transit. "Examples include unauthorized changes made to persistent data, such as that held in a database, and the alteration of data as it flows between two computers over an open network, such as the Internet" (STRIDE model, Tampering)
- Repudiation is about proving who did what. "Non-Repudiation refers to the ability of a system to counter repudiation threats." (STRIDE model, Repudiation)
- Elevation of privilege at its worst. "An unprivileged user gains privileged access and thereby has sufficient access to compromise or destroy the entire system." (STRIDE model, Elevation of Privilege)

## Visuals worth redrawing

None.

## My notes

- The page doesn't say who first wrote STRIDE or when.
