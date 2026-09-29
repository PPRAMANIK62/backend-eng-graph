---
id: supply-chain-security
title: Supply chain security
depth: short
phase: 15
note: >-
  Dependencies you didn't write: lockfiles, SBOMs and signed builds.
needs: [threat-modeling]
leads_to: []
compare_with: [container-images]
---

# Supply chain security

Most of the code you ship, you didn't write: libraries, their
libraries, the build system that compiles it all. Supply chain security
is making sure that what runs in production is exactly what you meant
to run: the dependency versions you chose, built from source that was
reviewed, and not changed anywhere on the way. Attackers aim here
because one poisoned package reaches everyone who depends on it.

## Every link is an attack point

Follow a release from commit to production and name what could go wrong
at each step. That's [[threat-modeling]] applied to how software is
made rather than to what it does.

![The software supply chain as four boxes: source repo, build, package registry, your service. Under each, the attacks at that step: a malicious commit or a hacked source server; a build from other source or a hacked build platform; a tampered artifact uploaded or a mirror serving a bad copy; a typosquatted package name. Under those, the defences: two-person review and a protected repo; signed provenance; pinned hashes and a checksum log; an SBOM and a human checking names. A dependencies box feeds into the build, with the note that each dependency has its own chain with every attack, recursively.](img/supply-chain-security-threats.svg)

*Where supply chain attacks happen, and what answers each. The lettered attacks are adapted from SLSA, "Supply chain threats" (v1.2).*

Every one of these has happened:

- **At the source.** Attackers broke into PHP's own git server and
  added two commits.
- **In the build.** In SolarWinds, the attacker compromised the build
  platform and injected malicious code into every build.
- **Between build and user.** Codecov's attacker used leaked
  credentials to upload a modified artifact that users downloaded
  directly.
- **In what you pick.** A malicious package under a name close to a
  popular one (typosquatting).
- **In your dependencies.** In event-stream, whoever controlled a small
  dependency published a malicious version that didn't match its
  source.

Three defences together cover a lot: pinning, inventories and
provenance.

## Pin exactly what you depend on

Most package managers write the exact version of every dependency,
direct and transitive, into a lock file, so every build uses the same
versions.

Go has a twist: no lock file. Its
version selection (minimal version selection) is deterministic: the
list of versions a build uses doesn't change when new versions of a
dependency are released, so there's nothing to lock. What Go does keep
is `go.sum`, a list of SHA-256 hashes (see
[[cryptographic-hashes]]) of every module it depends on. If a
download doesn't match its hash, `go` reports a security error and
refuses to use it.

That leaves one gap: the first time you add a version, there's no hash
yet to compare with. Go closes it with a public checksum database,
`sum.golang.org`, a public log built as a Merkle tree that
independent auditors can check. Before accepting a new hash, `go` checks it against
the log. Everyone gets the same bytes for the same version. A proxy
can't serve you something different, and an author can't move a tag to
new code after the fact without being caught.

## Know what's inside: SBOMs

A software bill of materials (SBOM) is the ingredient list of a piece
of software: every component and its subcomponents, including
transitive dependencies, with versions, producers, licenses and hashes.
The two formats in wide use are SPDX and CycloneDX. Guidance from CISA
and partner agencies (2026) sets the minimum fields and replaces the
NTIA version from 2021.

The payoff comes when a new vulnerability is announced. If the vulnerable
component isn't in a complete SBOM, that product isn't affected. That
only works if the SBOM really is complete, and the guidance asks for
anything unknown to be marked as unknown, not left out.

## Prove how it was built: signed provenance

Provenance is a record of how an artifact was built: which platform
built it, with what process, from which inputs, such as the source
commit. SLSA (v1.2) grades builds by how much you can trust that
record:

- **Build L1:** provenance exists. It catches mistakes, like releasing
  from a commit that isn't in the repo, but it's trivial to forge.
- **Build L2:** a hosted build platform generates the provenance and
  signs it, and the consumer checks the signature (see
  [[public-key-crypto]]). An artifact changed after the build, like
  Codecov's, no longer matches.
- **Build L3:** the build platform is hardened. Builds can't influence
  each other, and the build steps you write can't reach the key that
  signs the provenance. Faking it now takes a real exploit of the
  platform.

At deploy time you check the provenance: this artifact was built by our
build platform, from our repository. Anything else doesn't run.

## Where it gets tricky

**Integrity isn't intent.** Hashes and signatures prove you got the
package that was published, built the way it claims. They say nothing
about whether its author meant well. A malicious maintainer publishing
through a proper build passes every check, and typosquatting isn't
stopped by provenance at all.

**Your guarantees stop where your dependencies' stop.** SLSA levels
mean most when applied recursively to every dependency, and tracing
most software back to its source is still hard or impossible today.

**Private modules skip the log.** Go doesn't check private modules
against the public checksum database, by design, so their first
download is trusted as is.

**Packages can vanish.** An author can delete a version from the
registry without warning (Mimemagic). That's an availability problem
that neither provenance nor an SBOM helps with.

## What this means when you build

- Commit your lock file (`go.sum` in Go) and make CI fail when it
  doesn't match.
- Treat a new dependency like new code: check the name and who
  maintains it.
- Generate an SBOM, in SPDX or CycloneDX, for every release, including
  transitive dependencies.
- Build releases on a hosted [[ci-cd|CI]] platform that signs
  provenance, and verify it before deploying.
- Protect the pipeline like production. It holds signing keys and
  deploy credentials; see [[secrets-management]].

## Further reading

- [Supply chain threats](https://slsa.dev/spec/v1.2/threats-overview), SLSA v1.2. The chain from producer to user, with a real attack at each step and what SLSA does and doesn't cover.
- [Build: Track Basics](https://slsa.dev/spec/v1.2/build-track-basics), SLSA v1.2. The build levels, from unsigned provenance to hardened build platforms.
- [Go Modules Reference](https://go.dev/ref/mod), the Go authors. Minimal version selection, `go.sum`, and the checksum database.
- [2026 Minimum Elements for a Software Bill of Materials (SBOM)](https://www.cisa.gov/resources-tools/resources/2026-minimum-elements-software-bill-materials-sbom), CISA, NSA, FBI and partners, 2026. What an SBOM must contain, and why completeness matters.
