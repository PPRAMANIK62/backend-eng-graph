---
id: owasp-input-validation
title: Input Validation Cheat Sheet
author: OWASP Cheat Sheet Series
url: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's practical guide to input validation in web applications: where
to do it, syntactic vs semantic checks, allowlists over denylists,
free-form Unicode text, files and email addresses. A living page with
no version.

## Key claims

- Validate as early as possible. "Input validation should happen as early as possible in the data flow, preferably as soon as the data is received from the external party." (Goals of Input Validation)
- Every untrusted source counts, including partner feeds. "including not only Internet-facing web clients but also backend feeds over extranets, from suppliers, partners, vendors or regulators" (Goals of Input Validation)
- Validation isn't the main defence against injection. "Input Validation should not be used as the primary method of preventing XSS, SQL Injection and other attacks" (Goals of Input Validation)
- Two levels. "Syntactic validation should enforce correct syntax of structured fields (e.g. SSN, date, currency symbol)." and "Semantic validation should enforce correctness of their values in the specific business context (e.g. start date is before end date, price is within expected range)." (Input Validation Strategies)
- Tools: framework validators, JSON Schema or XSD, "Type conversion (e.g. Integer.parseInt() in Java, int() in Python) with strict exception handling", min/max ranges and lengths, allowed-value lists, anchored regexes. (Implementing Input Validation)
- Denylists are easy to bypass and block real input. "Plus, such filters frequently prevent authorized input, like O'Brian, where the ' character is fully legitimate." (Allowlist vs Denylist)
- Allowlists define what's allowed. "Allowlist validation involves defining exactly what IS authorized, and by definition, everything else is not authorized." (Allowlist vs Denylist)
- Regexes can be a denial-of-service risk. "When designing regular expressions, be aware of RegEx Denial of Service (ReDoS) attacks." (Regular Expressions)
- Client-side checks don't count for security. "Input validation must be implemented on the server-side before any data is processed by an application’s functions, as any JavaScript-based input validation performed on the client-side can be circumvented" (Client-side vs Server-side Validation)
- Free-form text: normalize, then allowlist character categories. "Normalization: Ensure canonical encoding is used across all the text and no invalid characters are present." (Validating Free-form Unicode Text)
- Email: do basic checks, then let the mail server decide. "the best way to validate email addresses is to perform some basic initial validation, and then pass the address to the mail server and catch the exception if it rejects it." (Email Address Validation)
- Regexes should cover the whole input. "Regular expressions for any other structured data covering the whole input string (^...$) and not using \"any character\" wildcard" (Implementing Input Validation)
- Uploads need a maximum size. "Ensure the uploaded file is not larger than a defined maximum file size." (File Upload Validation, Upload Verification)
- The email RFC allows odd addresses that real mail servers reject. "most real world implementations (such as mail servers) use a far more restricted address format, meaning that they will reject addresses that are technically valid." (Email Address Validation, Syntactic Validation)
- The light initial check: two parts around an @, no dangerous characters, a reasonable length. "The email address does not contain dangerous characters (such as backticks, single or double quotes, or null bytes)." (Email Address Validation, Syntactic Validation)
- Semantic check: send a confirmation email with a single-use token. "Semantic validation is about determining whether the email address is correct and legitimate." (Email Address Validation, Semantic Validation)

## Visuals worth redrawing

None.

## My notes

- Complements `king-parse-dont-validate-2019`: OWASP says where and what
  to check, King says to keep the result as a type.
