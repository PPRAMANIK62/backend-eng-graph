---
id: evanjones-checksums
title: More Than You Wanted to Know About Checksums
author: Evan Jones
url: https://www.evanjones.ca/crc32c.html
kind: blog
primary: false
---

## Summary

A short survey of checksum choices, from the weak Internet checksum to
cryptographic hashes, arguing that CRC32C is the right default once CPUs
compute it in hardware. Written in 2010, so the CPU-support remarks are
dated.

## Key claims

- What a checksum is. "A checksum is a function that computes an integer value from a string of bytes that is used to detect errors." (opening)
- Recommends CRC32C. "new applications should use the CRC32C algorithm, as it is very robust and supported in hardware in newer Intel CPUs." (opening)
- Cryptographic hashes are the strongest but costly, so they fit only where the cost is acceptable. "They are computationally expensive" (paragraph 2)
- The Internet checksum (IPv4, TCP, UDP headers) is 16 bits, fast and weak. "very fast but also very weak, leading to undetected errors" (paragraph 3)
- (added in review) Cryptographic hashes are 16 bytes or more. "typically quite large (16 bytes or more)" (paragraph 2)
- (added in review) Fletcher is a bit stronger and slower than Adler-32. "Fletcher's checksum is slightly stronger, while being slightly slower to compute." (paragraph 3)
- (added in review) CRCs are well studied. "They have been well studied by mathematicians and can be easily implemented in hardware." (paragraph 4)
- Adler-32 is 32 bits, stronger, but weak on short messages. "it is particularly weak for very short messages" (paragraph 3)
- CRCs are a middle ground and easy to build into hardware; CRC32C is in Intel's SSE4.2. "This particular CRC is now implemented in hardware in Intel CPUs as part of the SSE4.2 extensions." (paragraph 4)
- With the instruction, CRC32C costs less than Adler-32. "computing this relatively strong checksum is even cheaper than computing Adler-32 checksums." (paragraph 4)
- In 2010 some CPUs lacked the instruction, so a software fallback was needed. "currently AMD, Via, and Intel Atom CPUs do not support this instruction." (paragraph 4)
- Best software algorithm is slicing-by-8 with an 8 kB table. (Software Implementation)
- A cited paper found Adler-32 < Fletcher < CRC in error detection. (References, "The Effectiveness of Checksums for Embedded Control Networks")

## Visuals worth redrawing

- A strength-vs-cost line from Internet checksum to Adler-32, Fletcher, CRC, cryptographic hash (our own drawing from the article's ordering).

## My notes

- The "AMD lacks it" line is from 2010; don't repeat it as current.
