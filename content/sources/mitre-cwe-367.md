---
id: mitre-cwe-367
title: "CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition"
author: MITRE, CWE project
url: https://cwe.mitre.org/data/definitions/367.html
kind: docs
primary: true
---

## Summary

The Common Weakness Enumeration entry for check-then-act races (CWE
list version 4.20). A program checks the state of a resource, then uses
it, and the state changes in between. The classic example is a setuid
program that calls access() on a file name and then fopen() on the same
name, which an attacker swaps for a symlink in between.

## Key claims

- Definition. "The product checks the state of a resource before using that resource, but the resource's state can change between the check and the use in a way that invalidates the results of the check." (Description)
- Also called TOCTTOU, "Time Of Check To Time Of Use". (Alternate Terms)
- The access()/fopen() example: both work on names, not handles, so the name can point to another file by the time of use. "because both access() and fopen() operate on filenames rather than on file handles, there is no guarantee that the file variable still refers to the same file on disk when it is passed to fopen() that it did when it was passed to access()." (Demonstrative Examples, Example 1)
- Mitigation: don't check first. "The most basic advice for TOCTOU vulnerabilities is to not perform a check before the use." (Potential Mitigations)
- Mitigation: lock before the check. "Ensure that locking occurs before the check, as opposed to afterwards, such that the resource, as checked, is the same as it is when in use." (Potential Mitigations)
- A child of CWE-362, concurrent execution using a shared resource with improper synchronization. (Relationships)
- Real CVEs include a browser sandbox that let a file be replaced after it was verified but before it ran (CVE-2015-1743). (Observed Examples)

## Visuals worth redrawing

None.

## My notes

- The same shape as check-then-act on memory, but across processes and
  the filesystem, so no in-process lock or race detector helps.
