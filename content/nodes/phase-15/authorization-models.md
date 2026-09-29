---
id: authorization-models
title: Authorization models
depth: deep
phase: 15
note: >-
  RBAC, ABAC and relationship-based access: who can do what, and how to
  express it.
needs: []
leads_to: [zanzibar, multi-tenancy, bola]
compare_with: []
---


# Authorization models

Once you know who a request is from, you still have to decide whether
they're allowed to do what they asked. An authorization model is how
you write that rule down: as a list on each object, as roles, as a
policy over attributes, or as relationships between users and things.
The model you pick decides which rules are easy to express, which are
painful, and where the bugs will hide.

## One question, four ways to store the answer

Take one request: Bob wants to approve invoice 42. Authentication
already told you it's Bob, from his [[sessions|session]] or token.
Authorization answers a different question: may Bob approve this
invoice? Being logged in doesn't mean he can do everything the system
can do.

Every model answers that same question. What changes is the data you
keep and the rule you evaluate.

![Three columns. RBAC: user bob is assigned the role accountant, which carries the permissions invoice:read and invoice:approve. ABAC: subject attributes (department finance), object attributes (invoice 42, department finance) and environment (time 09:30) all feed a policy rule, which returns allow or deny. ReBAC: bob is a member of team finance, team finance is a viewer of folder q3, and invoice 42's parent is folder q3; a path from bob to the invoice means allow.](img/authorization-models-three-models.svg)

*The same question under three models. RBAC looks up a role, ABAC evaluates a rule over attributes, ReBAC looks for a path through relationships.*

## Access control lists: a list on every object

The oldest answer is a list attached to the invoice: Bob may read and
approve, Carol may read. To check, you look Bob up in the invoice's
list. This is identity-based access control.

Each object needs its own list, and someone has to decide who goes on
it before any request arrives. The list doesn't change when Bob's job
does. Unless someone goes back and removes him, he keeps access he no
longer needs, and over time people pile up permissions.

## RBAC: permissions belong to roles

Role-based access control, written up at NIST in 1992, puts a layer in
the middle. Permissions attach to a role, like "accountant" or
"teller". People are made members of roles. Bob can approve invoice 42
because he's an accountant and accountants can approve invoices.

The win is administration. The set of things an accountant does
changes slowly. What changes is people: someone joins, moves team or
leaves, and you add or remove a role membership instead of touching
thousands of object lists. Roles can contain other roles, so a
"senior accountant" gets everything an accountant has, plus more.

Two classic rules come with it:

- **Least privilege.** Give each person the smallest set of rights
  their job needs.
- **Separation of duty.** No one person should be able to both start
  and approve a payment. A static version forbids anyone holding both
  roles. A more flexible dynamic version lets one person hold both, but
  not approve a payment they started. That version needs the user's ID
  as well as their role, so roles alone can't express it.

That last point is where RBAC starts to strain. "Accountants can
approve invoices" is a rule about a type of object. Most rules an app
really needs are about one object: may Bob approve *this* invoice, from *his*
region, that *he* didn't create? A pure role answers yes for every
invoice. To get closer you invent narrower roles, "accountant, EMEA,
not own invoices", and soon you have piles of roles with one or two
members each. This is called role explosion. Code fills up with checks like
`hasAnyRole("SUPERUSER", "ADMIN", "ACCT_MANAGER")`, and one wrong or
missing name gives too much or too little access.

## ABAC: a policy over attributes

Attribute-based access control drops the idea that you decide in
advance. At request time, a policy looks at attributes of three
things:

- **The subject:** Bob's department, clearance, whether he finished
  compliance training.
- **The object:** the invoice's department, amount, owner.
- **The environment:** time of day, location, current threat level.

The policy is a boolean rule over them, for example: allow approve if
the subject's department equals the invoice's department, the amount
is under the subject's limit, and it's within working hours. ACLs and
RBAC turn out to be special cases: an ACL is a policy on the "identity"
attribute, RBAC a policy on the "role" attribute.

The standard vocabulary splits the job in two. A policy decision point
(PDP) evaluates the rule and returns allow or deny. A policy
enforcement point (PEP), your API handler or [[api-gateway|gateway]], asks the PDP and
enforces the answer.

ABAC's cost is trust. With an ACL, the owner who added Bob is the
whole chain of trust. With ABAC, the decision is only as good as every
attribute feeding it, so you now depend on whoever sets Bob's
department, whoever tags the invoice, and whoever writes the policy.

## ReBAC: access follows relationships

Relationship-based access control asks whether there's a chain of
relationships from the user to the object. Bob is a member of the
finance team. The finance team can view folder Q3. Invoice 42 sits in
folder Q3. So Bob can view invoice 42.

This fits products where users share things with each other: documents
in folders, repos in organizations, posts visible to friends. Each
relationship is one small fact you store. The rules that turn facts
into permissions ("editors are also viewers", "viewers of a folder can
view what's inside") live in a schema. [[zanzibar|Zanzibar]], Google's
permission system, is the best-known design of this kind, and
OpenFGA's API follows its data model closely.

Roles fit inside ReBAC as relationships. "Bob is an admin of org
Acme" is a relationship to an org, and Zanzibar's paper notes that
several of its client teams built RBAC on top of it. Attributes can be
attached too: OpenFGA lets a relationship carry a condition written in
Google's Common Expression Language, and the relationship only counts
when the condition is true.

## Where it gets tricky

**The models overlap more than the names suggest.** ACLs and RBAC are
narrow forms of ABAC. RBAC runs fine on a ReBAC system. ReBAC systems
now accept attribute conditions. In practice you pick a main shape and
borrow from the others.

**The advice disagrees.** OWASP's cheat sheet says to prefer ABAC and
ReBAC over RBAC for application code, because roles can't express
per-object rules. NIST's ABAC guide, written by some of the people who
defined RBAC, is more careful: ABAC needs far more trust relationships
to work, and depends on whoever issues the attributes. Both are right
about different costs.

**Sharing is discretionary access.** The 1992 RBAC paper defined RBAC
partly by what it forbids: users can't pass their permissions on to
others. That fits a bank. It doesn't fit a document editor, where
"share with Carol" is the main feature. A product built on sharing
needs a model where granting access is an ordinary write by a user,
and in ReBAC it's one new relationship.

**The model doesn't save you from a missing check.** The most common
authorization bug isn't a bad model. It's an endpoint that never asks,
so changing an ID in the URL shows someone else's data. That's
[[bola]]. The rules that matter more than the model: deny by default,
check on every request on the server, and remember that access to one
invoice doesn't mean access to all invoices.

**Tenants change the picture.** When many customers share one system,
"accountant" means nothing without "accountant at which company".
RBAC handles that badly, and [[multi-tenancy]] has its own set of
problems.

## What this means when you build

- Start by writing the questions your app asks: "can user X do action
  Y on object Z?". If Z matters (it almost always does), plain roles
  won't be enough.
- Keep the decision in one place, called from every handler, and have
  it deny when unsure.
- Use roles for coarse, org-wide powers (billing admin), and
  relationships for per-object access (this document, this project).
- Log denied checks and every change to roles or relationships, as
  part of your [[audit-logging|audit log]].
- Test authorization like any other logic: for each role or
  relationship, assert what's allowed and what isn't.

## Further reading

- [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), OWASP Cheat Sheet Series. Practical rules (deny by default, check every request) and the case for ABAC and ReBAC over RBAC.
- [NIST SP 800-162: Guide to Attribute Based Access Control](https://nvlpubs.nist.gov/nistpubs/specialpublications/NIST.SP.800-162.pdf), Hu, Ferraiolo, Kuhn and others, NIST, 2014 (updated 2019). ACLs, RBAC and ABAC side by side, PDP and PEP, role explosion, and what ABAC costs in trust.
- [Role-Based Access Controls](https://csrc.nist.gov/files/pubs/conference/1992/10/13/rolebased-access-controls/final/docs/ferraiolo-kuhn-92.pdf), David Ferraiolo and Richard Kuhn, NIST, 1992. The paper that defined RBAC: roles as sets of transactions, role hierarchies, least privilege, separation of duty.
- [Zanzibar: Google's Consistent, Global Authorization System](https://www.usenix.org/system/files/atc19-pang.pdf), Ruoming Pang and others, USENIX ATC, 2019. Relationship-based access at Google's scale, and how RBAC fits on top.
- [Concepts](https://openfga.dev/docs/concepts), OpenFGA documentation. A short, concrete tour of a ReBAC model: types, relations, tuples, and conditions for attributes.
