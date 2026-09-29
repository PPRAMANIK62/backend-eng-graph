---
id: owasp-idor-cheat-sheet
title: Insecure Direct Object Reference Prevention Cheat Sheet
author: OWASP Cheat Sheet Series
url: https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's cheat sheet for IDOR, the older name for what the API Top 10
calls BOLA. The three ingredients, examples in URLs, form fields and
file names, how to test with two users, and the fix: scope every lookup
to what the current user may see.

## Key claims

- Three ingredients: an object, a reference to it, and a missing check. "A missing object-level authorization check that allows a user to access or manipulate an object they should not be able to access." (Introduction)
- Classic example: change 123 to 124 in /users/123. "If an attacker changes this number to 124 and gains access to another user's information, the application is vulnerable to Insecure Direct Object Reference." (Examples)
- The ID can hide in a POST body, such as a hidden form field. "In some cases, the identifier may not be in the URL, but rather in the POST body" (Examples)
- References aren't only numbers. "Object references are not limited to numeric identifiers and may include filenames, account numbers, tokens, or other values." (Examples)
- Complex IDs help, but the check is still needed. "However, even with complex identifiers, access control checks are essential." (Identifier complexity)
- Test with two users, each trying the other's objects. "Authenticate as User A and attempt to access User B's objects by modifying object references in requests." (Verifying access controls)
- Test every kind of operation. "This verification should be performed for all operations involving object references, including read, create, update, delete, export, and administrative actions." (Verifying access controls)
- Look up objects inside the set the user can access (Rails example `@current_user.projects.find(params[:id])` instead of `Project.find(params[:id])`). "When looking up objects based on primary keys, use datasets that users have access to." (Mitigation)
- Random IDs are defense in depth only. "Additionally, use complex identifiers as a defense-in-depth measure, but remember that access control is crucial even with these identifiers." (Mitigation)
- Take the user from the session, not from a parameter. "Instead, determine the currently authenticated user from session information." (Mitigation)
- Don't encrypt IDs. "Avoid encrypting identifiers as it can be challenging to do so securely." (Mitigation)

## Visuals worth redrawing

None.

## My notes

- Secondary in the sense that OWASP doesn't build the apps, but it's the
  reference the API Top 10 links to.
