---
id: owasp-api1-bola-2023
title: "API1:2023 Broken Object Level Authorization"
author: OWASP API Security Project
url: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
kind: docs
primary: true
---

## Summary

The first entry of the OWASP API Security Top 10 (2023). What BOLA is,
why APIs are prone to it, three example attacks (shop revenue data, a
car's VIN, a GraphQL delete), and how to prevent it.

## Key claims

- The attack is changing the object ID sent in the request. "Attackers can exploit API endpoints that are vulnerable to broken object-level authorization by manipulating the ID of an object that is sent within the request." (Threat agents/Attack vectors)
- The ID can be anything and sit anywhere in the request. "Object IDs can be anything from sequential integers, UUIDs, or generic strings." (Threat agents/Attack vectors)
- It's common because the server relies on IDs the client sends. "the server component usually does not fully track the client’s state, and instead, relies more on parameters like object IDs, that are sent from the client to decide which objects to access." (Security Weakness)
- Rated easy to exploit, widespread, easy to detect. "Exploitability Easy" / "Prevalence Widespread : Detectability Easy" (risk table)
- Every endpoint that takes an object ID and acts on it needs the check. "Every API endpoint that receives an ID of an object, and performs any action on the object, should implement object-level authorization checks." (Is the API Vulnerable?)
- Comparing the session's user ID with an ID parameter isn't enough. "Comparing the user ID of the current session (e.g. by extracting it from the JWT token) with the vulnerable ID parameter isn't a sufficient solution to solve Broken Object Level Authorization (BOLA)." (Is the API Vulnerable?)
- BOLA vs BFLA: in BOLA the user may call the endpoint; the object is the problem. "In the case of BOLA, it's by design that the user will have access to the vulnerable API endpoint/function." (Is the API Vulnerable?)
- If the user shouldn't reach the endpoint at all, that's BFLA. "this is a case of Broken Function Level Authorization (BFLA) rather than BOLA." (Is the API Vulnerable?)
- Example: a car API took a VIN and didn't check it belonged to the user. "The API fails to validate that the VIN represents a vehicle that belongs to the logged in user, which leads to a BOLA vulnerability." (Scenario #2)
- Prevention: check the action on the record in every function that uses client input to find it. "Use the authorization mechanism to check if the logged-in user has access to perform the requested action on the record in every function that uses an input from the client to access a record in the database." (How To Prevent)
- Prefer random, unpredictable IDs. "Prefer the use of random and unpredictable values as GUIDs for records' IDs." (How To Prevent)
- Test it, and block deploys that fail. "Write tests to evaluate the vulnerability of the authorization mechanism. Do not deploy changes that make the tests fail." (How To Prevent)
- The ID can be in the path, query string, headers or payload. "they are easy to identify in the request target (path or query string parameters), request headers, or even as part of the request payload." (Threat agents/Attack vectors)
- Scenario #1: shop names from one endpoint, revenue from another. "Using another API endpoint, the attacker can get the list of all hosted shop names." (Scenario #1)
- Scenario #3: a GraphQL delete mutation with no permission check. "Since the document with the given ID is deleted without any further permission checks, a user may be able to delete another user's document." (Scenario #3)

## Visuals worth redrawing

None.

## My notes

- "Prefer random GUIDs" sits next to RFC 9562's "UUIDs MUST NOT be used
  as security capabilities" and the IDOR cheat sheet's "defense in
  depth" framing. Random IDs slow down guessing; they don't replace the
  check.
