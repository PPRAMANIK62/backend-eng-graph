---
id: owasp-authorization
title: "Authorization Cheat Sheet (OWASP Cheat Sheet Series)"
author: OWASP Cheat Sheet Series contributors
url: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's practical guide to authorization in web apps: least privilege,
deny by default, check on every request, why ABAC and ReBAC usually
beat plain RBAC for applications, IDOR, and testing. Secondary (a
community guide, not the builders of a system), but widely used.

## Key claims

- Authorization is distinct from authentication. "Authorization is distinct from authentication which is the process of verifying an entity's identity." (Introduction)
- Broken access control topped the OWASP Top 10 in 2021. "Broken Access Control was ranked as the most concerning web security vulnerability in OWASP's 2021 Top 10" (Introduction)
- Horizontal privilege elevation is common. "Horizontal privilege elevation (i.e. being able to access another user's resources) is an especially common weakness that an authenticated user may be able to take advantage of." (Introduction)
- Deny by default. "For security purposes an application should be configured to deny access by default." (Deny by Default)
- Check on every request; one missed check is enough. "Even if just a single access control check is "missed", the confidentiality and/or integrity of a resource can be jeopardized." (Validate the Permissions on Every Request)
- RBAC definition. "Permissions are not directly assigned to an entity; rather, permissions are associated with a role and the entity inherits the permissions of any roles assigned to it." (Prefer Attribute and Relationship Based Access Control over RBAC)
- ReBAC definition. "ReBAC is an access control model that grants access based on the relationships between resources." (same section)
- The cheat sheet's advice: prefer ABAC and ReBAC for application development. "Although RBAC has a long history and remains popular among software developers today, ABAC and ReBAC should typically be preferred for application development." (same section)
- RBAC is poor at object-level (horizontal) decisions. "Such simplistic logic does a poor job of supporting object-level or horizontal access control decisions and those that require multiple factors." (same section)
- Chained role checks are easy to get wrong, e.g. `if(user.hasAnyRole("SUPERUSER", "ADMIN", "ACCT_MANAGER"))`. (same section, Robustness)
- Role explosion can overflow headers if roles travel with the request. "If users send their credential and roles through means like HTTP headers, which have size limits, there may not be enough space to include all of the user's roles." (same section, Speed)
- RBAC is poorly suited to multi-tenant and cross-organization access. "RBAC is poorly suited for use cases where distinct organizations or customers will need access to the same set of protected resources." (same section)
- Having access to one object of a type doesn't mean access to all of them. "Just because a user has access to an object of a particular type does not mean they should have access to every object of that particular type." (Ensure Lookup IDs are Not Accessible...)
- Never rely on client-side checks. "Developers must never rely on client-side access control checks." (Verify that Authorization Checks are Performed in the Right Location)
- Test authorization logic in unit and integration tests. (Create Unit and Integration Test Cases for Authorization Logic)

## Visuals worth redrawing

None.

## My notes

- The "prefer ABAC/ReBAC" line is an opinion; NIST SP 800-162 is more
  cautious about ABAC's cost (many more trust relationships).
