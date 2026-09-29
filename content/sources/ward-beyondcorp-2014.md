---
id: ward-beyondcorp-2014
title: "BeyondCorp: A New Approach to Enterprise Security"
author: Rory Ward, Betsy Beyer (Google)
url: https://research.google/pubs/beyondcorp-a-new-approach-to-enterprise-security/
kind: paper
primary: true
---

## Summary

The first public BeyondCorp paper (;login: vol. 39 no. 6, 2014). Google
explains dropping the privileged corporate network: every request to an
internal app goes through an internet-facing access proxy that checks
the user (SSO) and the device (certificate, inventory, trust level) per
request. Read from the PDF linked on the page.

## Key claims

- The perimeter problem: once breached, the inside is open. "However, this security model is problematic because, when that perimeter is breached, an attacker has relatively easy access to a company’s privileged intranet." (Abstract)
- Treat the internal network like the internet. "Rather, one should assume that an internal network is as fraught with danger as the public Internet and build enterprise applications based upon this assumption." (Introduction)
- Access depends on device and user, not network. "Instead, access depends solely on device and user credentials, regardless of a user’s network location" (Introduction)
- No VPN needed. (Introduction)
- Devices are identified by a per-device certificate; the certificate alone doesn't grant access. "While the certificate uniquely identifies the device, it does not single-handedly grant access privileges." (Device Identity)
- All apps sit behind an internet-facing access proxy, with public DNS pointing to it. (Internet-Facing Access Proxy)
- The access control engine authorizes per request, using user, groups, device certificate, inventory and trust levels. (Access Control Engine; End-to-End Example)
- Migration was phased, per application and per group of users, with VPN use cut back gradually. (Migrating to BeyondCorp)
- No VPN. "all Google employees can work successfully from any network, and without the need for a traditional VPN connection into the privileged network." (Introduction; the PDF is at https://research.google.com/pubs/archive/43231.pdf, no longer linked from the page)
- SSO checks two factors. "An externalized, single sign-on (SSO) system is a centralized user authentication portal that validates primary and second-factor credentials for users requesting access to our enterprise resources." (Single Sign-On System)

## Visuals worth redrawing

- Figure 1: BeyondCorp components and access flow.

## My notes

- About users and devices reaching internal apps. The service-to-service
  side is google-beyondprod.
