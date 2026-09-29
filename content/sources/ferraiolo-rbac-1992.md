---
id: ferraiolo-rbac-1992
title: "Role-Based Access Controls"
author: David F. Ferraiolo, D. Richard Kuhn (NIST)
url: https://csrc.nist.gov/files/pubs/conference/1992/10/13/rolebased-access-controls/final/docs/ferraiolo-kuhn-92.pdf
kind: paper
primary: true
---

## Summary

The 1992 NIST paper (15th National Computer Security Conference) that
defined role-based access control as an alternative to discretionary
access control for businesses and civilian government. Roles are sets
of transactions; users are members of roles; admins manage membership,
not per-object grants. Also covers role hierarchies, least privilege
and separation of duty.

## Key claims

- RBAC bases decisions on job function. "A role based access control (RBAC) policy bases access control decisions on the functions a user is allowed to perform within an organization." (§2)
- Unlike DAC, users can't hand their permissions on. "The users cannot pass access permissions on to other users at their discretion. This is a fundamental difference between RBAC and DAC." (§2)
- A role is a set of transactions. "A role can be thought of as a set of transactions that a user or set of users can perform within the context of an organization." (§2)
- Roles name many-to-many relationships between people and rights. "As a result, RBACs provide a means of naming and describing many-to-many relationships between individuals and rights." (§2)
- Three rules: role assignment, role authorization, transaction authorization (a subject can only run a transaction authorized for its active role). (§3)
- Administration is mostly granting and revoking role membership. "The administrative task consists of granting and revoking membership to the set of specified named roles within the system." (§4)
- Roles can be composed of roles (hierarchy): a Doctor role implies Intern and Healer transactions. (§4, Figure 2)
- Least privilege. "The principle of least privilege requires that a user be given no more privilege than necessary to perform a job." (§5)
- Separation of duty: no one person runs every transaction in a sensitive set, e.g. initiating and authorizing a payment. "No single individual should be capable of executing both transactions." (§6)
- Static separation can be checked from role assignments alone; dynamic separation (you can't approve a payment you started) needs the user ID too. "for the dynamic case, the system must use both role and user ID in checking access to transactions." (§6)
- Static separation can be enforced by keeping the two roles apart. "This could be implemented by ensuring that no one who can perform the initiator role could also perform the authorizer role." (§6)

## Visuals worth redrawing

- Figure 2: users, roles (Healer, Intern, Doctor) and transactions, with role composition.

## My notes

- The later NIST RBAC standard (Sandhu, Ferraiolo, Kuhn 2000) was
  opened as a PDF but it's a scanned image with no text layer, so it
  isn't used.
