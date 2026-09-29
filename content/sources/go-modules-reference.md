---
id: go-modules-reference
title: Go Modules Reference
author: The Go authors
url: https://go.dev/ref/mod
kind: docs
primary: true
---

## Summary

The reference for Go modules. Used here for how Go pins and checks
dependencies: minimal version selection (no lock file needed), go.sum
hashes, and the public checksum database (sum.golang.org), a
transparent log that makes every user get the same bytes for a version.

## Key claims

- Go has no lock file; MVS computes the same build list every time. "Unlike other dependency management systems, the build list is not saved in a “lock” file." (Minimal version selection)
- Why that's enough. "MVS is deterministic, and the build list doesn’t change when new versions of dependencies are released" (Minimal version selection)
- A require directive sets a minimum version; MVS picks the highest minimum required anywhere. (go.mod require; MVS)
- go.sum holds hashes of every direct and indirect dependency. "The go.sum file contains cryptographic hashes of the module’s direct and indirect dependencies." (go.sum files)
- A hash mismatch is a security error and the file isn't used. "If the hash is different from the hash in go.sum, the go command reports a security error and deletes the downloaded file without adding it into the module cache." (Authenticating modules)
- Hash format: SHA-256, named h1. "Currently, SHA-256 (h1) is the only supported hash algorithm." (go.sum files)
- A first download with no go.sum line is checked against the checksum database. (Authenticating modules)
- The checksum database lets you use an untrusted proxy and stops versions changing later. "It makes untrusted proxies possible since they can’t serve the wrong code without it going unnoticed." (Checksum database)
- Retagging is caught. "It also ensures that the bits associated with a specific version do not change from one day to the next, even if the module’s author subsequently alters the tags in their repository." (Checksum database)
- It's a Merkle tree transparent log that auditors can check. "The main advantage of a Merkle tree is that independent auditors can verify that it hasn’t been tampered with, so it is more trustworthy than a simple database." (Checksum database)
- Private modules (GOPRIVATE, GONOSUMDB) or GOSUMDB=off skip the check: the hash is accepted without verification. (Authenticating modules)

## Visuals worth redrawing

None.

## My notes

- The Go blog post announcing the mirror and checksum database (Go 1.13,
  2019) explains the trust-on-first-use problem go.sum alone has. Read
  for background, not cited.
