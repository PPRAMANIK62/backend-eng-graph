---
id: google-first-sha1-collision-2017
title: Announcing the first SHA1 collision
author: Marc Stevens, Elie Bursztein, Pierre Karpman, Ange Albertini, Yarik Markov, Alex Petit Bianco, Clement Baisse (CWI Amsterdam and Google)
url: https://security.googleblog.com/2017/02/announcing-first-sha1-collision.html
kind: blog
primary: true
---

## Summary

The 2017 announcement of SHAttered, the first practical SHA-1 collision:
two different PDFs with the same SHA-1 digest. Explains what a
collision is, why it matters for signatures and certificates, and how
much computation it took.

## Key claims

- Hashes are used for browser security, code repositories and dedup. "You'll find that hashes play a role in browser security, managing code repositories, or even just detecting duplicate files in storage." (intro)
- Finding two inputs with the same digest must be infeasible, and that can fail over time. "Over time however, this requirement can fail due to attacks on the mathematical underpinnings of hash functions or to increases in computational power." (intro)
- They released two PDFs with the same SHA-1 hash. "As a proof of the attack, we are releasing two PDFs that have identical SHA-1 hashes but different content." (intro)
- A collision lets an attacker swap a malicious file for a benign one. "The attacker could then use this collision to deceive systems that rely on hashes into accepting a malicious file in place of its benign counterpart." (What is a hash collision)
- The size of the computation. "Nine quintillion (9,223,372,036,854,775,808) SHA1 computations in total" and "6,500 years of CPU computation to complete the attack first phase" (Finding the SHA-1 collision)
- Still far faster than brute force. "the SHA-1 shattered attack is still more than 100,000 times faster than a brute force attack which remains impractical." (Finding the SHA-1 collision)
- Move to SHA-256 or SHA-3. "it's more urgent than ever for security practitioners to migrate to safer cryptographic hashes such as SHA-256 and SHA-3." (Finding the SHA-1 collision)
- The example of what a collision enables is two contracts. "For example, two insurance contracts with drastically different terms." (What is a hash collision)
- SHA-1's use in signing TLS certificates is the main worry. "Google has advocated the deprecation of SHA-1 for many years, particularly when it comes to signing TLS certificates." (intro)
- Chrome started phasing out SHA-1 certificates in 2014. "As early as 2014, the Chrome team announced that they would gradually phase out using SHA-1." (intro)

## Visuals worth redrawing

- Two different documents going into SHA-1 and coming out with the same
  digest.

## My notes

- shattered.io, the project's own site, now serves unrelated content
  under the old name. Don't cite it.
