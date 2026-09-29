---
id: slsa-threats-overview
title: Supply chain threats (SLSA v1.2)
author: SLSA project (OpenSSF)
url: https://slsa.dev/spec/v1.2/threats-overview
kind: spec
primary: true
---

## Summary

SLSA's introduction to supply chain attacks, from the v1.2
specification: the chain from producer to user, split into source,
build and distribution, with a lettered attack at each link (A to I),
a real incident for each, and whether SLSA helps.

## Key claims

- SLSA is about integrity first, availability second. "SLSA’s primary focus is supply chain integrity, with a secondary focus on availability." (Summary)
- Build integrity defined. "Build integrity: Ensure that the package is built from the correct, unmodified sources and dependencies according to the build recipe defined by the software producer, and that artifacts are not modified as they pass between development stages." (Summary)
- The attack points, with examples: producer (SpySheriff), authoring and review (SushiSwap malicious commit), source code management (PHP git server), external build parameters (The Great Suspender), build process (SolarWinds), artifact publication (CodeCov), distribution channel (package mirrors), package selection (Browserify typosquatting), usage (default credentials). (Real-world examples table)
- SolarWinds: the build platform itself was compromised. "SolarWinds: Attacker compromised the build platform and installed an implant that injected malicious behavior during each build." (row E)
- CodeCov: leaked credentials used to upload a malicious artifact. "CodeCov: Attacker used leaked credentials to upload a malicious artifact to a GCS bucket, from which users download directly." (row F)
- Dependency threats are all of the above, recursively (event-stream: a malicious binary published without a matching source change). "Applying SLSA recursively to all dependencies would prevent this particular vector" (dependency row)
- Typosquatting isn't directly addressed. "SLSA does not directly address this threat, but provenance linking back to source control can enable and enhance other solutions." (row H)
- A malicious producer isn't solved for closed source. "For closed source software SLSA does not provide any solutions for malicious producers." (row A)
- Tracing software back to its source is rare today. "A SLSA level helps give consumers confidence that software has not been tampered with and can be securely traced back to source—something that is difficult, if not impossible, to do with most software today." (closing paragraph)
- A dependency disappearing (Mimemagic) is an availability threat SLSA doesn't address. (Availability table)
- PHP's git server. "Attacker compromised PHP's self-hosted git server and injected two malicious commits." (row C)
- Two-person review for authoring. "Two-person review could have caught the unauthorized change." (row B)
- event-stream. "Attacker controls an innocuous dependency and publishes a malicious binary version without a corresponding update to the source code." (Dependency threats row)
- Mimemagic. "Producer intentionally removes package or version of package from repository with no warning." (Availability table)

## Visuals worth redrawing

- The "Supply Chain Threats" diagram (Summary): source, build,
  package, with lettered attack points. Redrawn as
  supply-chain-security-threats.svg.

## My notes

- The v1.0 page with the same name is marked Retired; v1.2 is the
  approved version and reorders the letters.
