---
id: bornholt-shardstore-2021
title: Using Lightweight Formal Methods to Validate a Key-Value Storage Node in Amazon S3
author: James Bornholt, Rajeev Joshi, Vytautas Astrauskas, Brendan Cully, Bernhard Kragl, Seth Markle, Kyle Sauri, Drew Schleit, Grant Slatton, Serdar Tasiran, Jacob Van Geffen, Andrew Warfield
url: https://www.amazon.science/publications/using-lightweight-formal-methods-to-validate-a-key-value-storage-node-in-amazon-s3
kind: paper
primary: true
---

## Summary

SOSP 2021 paper from the team that built ShardStore, the storage node
behind Amazon S3. Each component gets an executable reference model (the
model for the LSM-tree index is a hash map), and property-based tests run
random sequences of operations against both model and implementation,
comparing after every step. Crashes, IO failures and flushes are just
more operations in the sequence. Covers coverage, biasing, minimization
and determinism. Read from the PDF linked on that page.

## Key claims

- Reference models are small: about 1% of the code, and the LSM tree's model is a hash map. "The reference models developed for ShardStore are small executable specifications (1% of the implementation code) that emphasize simplicity; for example, the reference model for a logstructured merge tree [41] implementation is a hash map." (§1) (pdftotext joins "log-structured" across a line break.)
- These checks stopped 16 issues before production. "These checks have prevented 16 issues from reaching production, including subtle crash-consistency and concurrency issues that evaded traditional testing methods" (§1)
- A model has the same interface with a simpler implementation. "an executable specification in Rust that provides the same interface as the component but using a simpler implementation." (§3.2)
- Strict equality works on the happy path but not for failures; they left IO errors and resource exhaustion out of the models. "This is true on the happy path, but we found it very difficult to enforce strict equality for failures." (§3.2)
- The model is written in the implementation's language so engineers keep it current, and doubles as a mock in unit tests. "we make them easier for engineers to keep up to date." (§3.2)
- Property-based testing as fuzzing with properties and structured inputs. "Property-based testing can be thought of as an extension of fuzzing with userprovided correctness properties and structured inputs" (§4.1) (pdftotext joins "user-provided".)
- The loop: apply each operation to both, compare outputs, check invariants. "For each operation in the sequence, the test case applies the operation to both reference model and implementation, compares the output of each for equivalence, and then checks invariants that relate the two systems." (§4.1)
- Background operations (reclaim, reboot) are in the alphabet as no-ops in the model, to check they don't corrupt anything. "These background operations are no-ops in the reference model" (§4.1)
- An in-memory disk keeps tests deterministic and fast. "the implementation under test uses an in-memory user-space disk, but all components above the disk layer use their actual implementation code." (§4.1)
- Scale: tens of millions of sequences before every deployment. "we routinely run tens of millions of random test sequences before every ShardStore deployment" (§4.2)
- Random keys rarely collide, so Gets are biased toward keys already Put. "which would rarely coincide, and so would almost never test the successful Get path." (§4.2)
- Biasing toward production distributions didn't help. "we experimented with replicating production object size and Get/Put ratio distributions with no effect." (§4.2)
- Coverage metrics show blind spots as the code grows. (§4.2)
- Minimization: a failing sequence of 61 operations (9 crashes, 14 writes, 226 KiB) shrank to 6 operations (1 crash, 2 writes, 2 B). "the final automatically minimized sequence had 6 operations, including 1 crash and 2 writes totalling 2 B of data." (§4.3)
- Non-determinism breaks minimization; Rust's default HashMap iteration order is randomized. "Nondeterminism interferes with minimization because the reduction process stops as soon as a test execution does not fail." (§4.3)
- Injected IO failures are operations too, with a relaxed check: a failed Get may return nothing but never wrong data. (§4.4)
- Crashes are operations: a DirtyReboot in the alphabet, and data acknowledged as persistent must be readable after it. "We augment the operation alphabet to include a DirtyReboot(RebootType) operation." (§5)
- Persistence property. "persistence: if a dependency says an operation has persisted before a crash, it should be readable after a crash" (§5)
- Block-level enumeration of crash states found no extra bugs and was much slower. "However, this exhaustive approach has not found additional bugs and is dramatically slower to test, so we do not use it by default." (§5)
- Per-component flush operations are mixed into crash tests, so a crash can leave a component partly flushed. "the operation alphabet for the crash-consistency tests includes flush operations for each component that can be interleaved with other operations." (§5)

## Visuals worth redrawing

- Figure 3: the property-based test harness for the index, an operation
  enum and a loop that applies each operation to model and
  implementation and compares.

## My notes

- They don't check concurrent crashing executions; the paper says they
  found no effective automated approach.
