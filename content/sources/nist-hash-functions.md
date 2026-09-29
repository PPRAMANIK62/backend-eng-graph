---
id: nist-hash-functions
title: Hash Functions (NIST Computer Security Resource Center)
author: NIST
url: https://csrc.nist.gov/projects/hash-functions
kind: docs
primary: true
---

## Summary

NIST's project page for approved hash functions: what a hash function
is, the SHA-2 and SHA-3 families and the standards that define them
(FIPS 180-4, FIPS 202), the status of SHA-1, the three security
properties a hash must have, and a table of security strengths.

## Key claims

- A hash maps a message of any length to a fixed-length digest. "A hash algorithm is used to map a message of arbitrary length to a fixed-length message digest." (intro)
- Approved hashes are in FIPS 180-4 and FIPS 202. "are specified in two Federal Information Processing Standards: FIPS 180-4, Secure Hash Standard and FIPS 202, SHA-3 Standard" (intro)
- The SHA-2 family. "SHA-2 family of hash algorithms: SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, and SHA-512/256." (Approved Algorithms)
- SHA-1 was deprecated in 2011 and disallowed for signatures after 2013. "NIST deprecated the use of SHA-1 in 2011 and disallowed its use for digital signatures at the end of 2013" (Approved Algorithms)
- SHA-3 is an alternative to SHA-2, not a replacement. "Currently only the four fixed-length SHA-3 algorithms are approved hash algorithms, providing alternatives to the SHA-2 family of hash functions." (Approved Algorithms)
- SHA-3 is built on Keccak, a different design. "FIPS 202 specifies the new SHA-3 family of permutation-based functions based on KECCAK" (Approved Algorithms)
- Collision resistance. "Collision resistance: It is computationally infeasible to find two different inputs to the hash function that have the same hash value." (Security Strengths)
- Preimage resistance. "Preimage resistance: Given a randomly chosen hash value, it is computationally infeasible to find an input message that hashes to this hash value." (Security Strengths)
- Second preimage resistance. "Second preimage resistance: It is computationally infeasible to find a second input that has the same hash value as any other specified input." (Security Strengths)
- Security strength table: SHA-1 collision resistance under 80 bits, SHA-256 128 bits for collisions and 256 bits for preimages. (Security Strengths, table)

## Visuals worth redrawing

- The security strength table (collision vs preimage strength per hash).

## My notes

- Collision strength is half the output size for a good hash (SHA-256:
  256-bit output, 128-bit collision strength), which is the birthday
  bound. The page shows the numbers but doesn't name the reason.
