---
id: king-parse-dont-validate-2019
title: Parse, don't validate
author: Alexis King
url: https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
kind: blog
primary: true
---

## Summary

A 2019 post that coined the slogan "parse, don't validate". A check
that returns nothing throws away what it learned, so the same check
gets repeated (or forgotten) deeper in the code. A parser turns
loosely typed input into a more precise type once, at the edge of the
program, and the rest of the code can rely on that type. Examples are
in Haskell, but the idea isn't Haskell-specific.

## Key claims

- The slogan. "Parse, don’t validate." (intro)
- A validator keeps nothing; a parser returns a more precise type. "validateNonEmpty always returns (), the type that contains no information, but parseNonEmpty returns NonEmpty a, a refinement of the input type that preserves the knowledge gained in the type system." (The power of parsing)
- What a parser is. "Really, a parser is just a function that consumes less-structured input and produces more-structured output." (The power of parsing)
- Parse at the boundary and never check again. "they allow discharging checks on input up-front, right on the boundary between a program and the outside world, and once those checks have been performed, they never need to be checked again!" (The power of parsing)
- Repeated checks are a bug waiting to happen: if the first check is removed, the "impossible" case in later code becomes possible. "this code is a bug waiting to happen!" (Managing expectations)
- Shotgun parsing: checks spread through processing code. "Shotgun parsing is a programming antipattern whereby parsing and input-validating code is mixed with and spread across processing code" (The danger of validation, quoting the LangSec paper)
- The risk: acting on part of the input before finding the rest invalid, then having to roll back. "a program that does not parse all of its input up front runs the risk of acting upon a valid portion of the input, discovering a different portion is invalid, and suddenly needing to roll back whatever modifications it already executed in order to maintain consistency." (The danger of validation)
- Parsing splits the program into two phases. "Parsing avoids this problem by stratifying the program into two phases—parsing and execution—where failure due to invalid input can only happen in the first phase." (The danger of validation)
- Choose types that can't hold bad states. "Use a data structure that makes illegal states unrepresentable." (Parsing, not validating, in practice)
- Push checks outward to the boundary. "Push the burden of proof upward as far as possible, but no further." (Parsing, not validating, in practice)
- Be suspicious of functions whose only job is to raise an error. "Treat functions that return m () with deep suspicion." (Parsing, not validating, in practice)
- When a type can't express a rule (an integer in a range), wrap it with a smart constructor. "use an abstract newtype with a smart constructor to “fake” a parser from a validator." (Parsing, not validating, in practice)
- Exception: authorize before parsing to avoid denial of service. "Sometimes it is necessary to perform some kind of authorization before parsing user input to avoid denial of service attacks" (footnote 3)
- Pick a structure that rules out the bad case, e.g. a Map instead of a list of pairs that might hold duplicate keys. "A better solution is to choose a data structure that disallows duplicate keys by construction, such as a Map." (Parsing, not validating, in practice)

## Visuals worth redrawing

None.

## My notes

- The post is about correctness through types, not about attacks. For
  the security angle see `owasp-input-validation`.
