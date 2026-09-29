---
id: model-based-testing
title: Model-based testing
depth: short
phase: 7
note: >-
  Run random operations against the real thing and a simple model of it,
  and compare after every step. The phase 7 harness.
needs: [fuzzing]
leads_to: []
compare_with: [race-detector, deterministic-simulation-testing, crash-testing]
---

# Model-based testing

Model-based testing checks a complicated program against a simple one.
You write a model that does the same job in the dumbest way possible,
generate long random sequences of operations, apply each operation to
both, and compare the answers after every step. For a storage engine the
model is usually just a map in memory. It's the harness for the phase 7
engine.

## A map is the specification

Say your engine has `Put`, `Get`, `Delete` and `Scan`, with a log, a
memtable, sorted files and [[compaction]] underneath. None of that
changes what `Get("k")` should return: the last value put for `k`,
unless it was deleted since. A plain map gets that right, so the map
becomes the definition of correct.

A test run looks like this:

1. Generate a random operation: `Put("k3", "v9")`, say.
2. Apply it to the engine and to the model.
3. Compare the results. Same value, same error, same list of keys.
4. Check invariants that relate the two, such as "a full scan of the
   engine returns exactly the model's contents".
5. Repeat, then start over with a new random sequence.

Add `Flush`, `Compact` and `Reopen` to the operations too. They're
no-ops in the model, since they shouldn't change what the database
holds, and that's what the test checks.

![A loop. A generator produces a random operation. The operation goes to the engine under test and to a model that is a plain map. Their results are compared, and invariants are checked. If they match, the loop generates the next operation. If they differ, the failing sequence is shrunk to the smallest one that still fails and saved as a regression test.](img/model-based-testing-loop.svg)

*The model-based testing loop. Adapted from Bornholt et al., "Using Lightweight Formal Methods to Validate a Key-Value Storage Node in Amazon S3" (SOSP 2021), figure 3.*

Amazon checks ShardStore, the storage node under S3, this way. The
model for its [[lsm-tree|LSM tree]] index is a hash map, and all the
models together are about 1% of the size of the code. The team runs
tens of millions of random sequences before every deployment, and these
checks stopped 16 issues from reaching production.

In Go, the rapid library (v1.3.0 when this was written) supports this
directly. A sketch:

```go
func TestEngineMatchesMap(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        db := openTestEngine(t)
        model := map[string]string{}
        key := rapid.SampledFrom([]string{"a", "b", "c", "d"})
        t.Repeat(map[string]func(*rapid.T){
            "put": func(t *rapid.T) {
                k, v := key.Draw(t, "k"), rapid.String().Draw(t, "v")
                db.Put(k, v)
                model[k] = v
            },
            "get": func(t *rapid.T) {
                k := key.Draw(t, "k")
                got, ok := db.Get(k)
                if want, wantOK := model[k]; ok != wantOK || got != want {
                    t.Fatalf("Get(%q) = %q, want %q", k, got, want)
                }
            },
            "flush": func(t *rapid.T) { db.Flush() }, // no-op in the model
            "": func(t *rapid.T) { checkScanMatches(t, db, model) }, // runs around every action
        })
    })
}
```

## Fuzzing with a right answer

This is close to [[fuzzing]]: both throw generated input at code. A
model-based test adds two things a plain fuzzer lacks: structured
sequences of operations as input, and a model that gives the right
answer at every step. It's a kind of property-based testing, also
called stateful testing.

The tools split the same way. Go's built-in fuzzer is guided by code
coverage but is weaker at structured input. rapid generates whole sequences of
operations but has no coverage feedback, though it can hand a test to
the built-in fuzzer.

## Small failures

A random failure is usually long and noisy, so the tool shrinks it,
removing operations and making values smaller while the test still
fails. In ShardStore, one failing sequence started as 61 operations,
including 9 crashes and 14 writes totalling 226 KiB. After shrinking
it was 6 operations: 1 crash and 2 writes of 2 bytes in total. That's a
bug you can read.

Shrinking needs a deterministic test. If the same sequence sometimes
passes, the shrinker stops early. ShardStore hit this through Rust's
default hash map, whose iteration order changes between runs. Seed
anything random inside the engine, and use a fake disk in memory, which
also makes runs fast.

## Crashes are operations too

A storage engine also has to survive being killed. So add a crash to
the list of operations: stop without a clean shutdown, then reopen. The
model has to say what's allowed afterwards. Anything the engine
reported as durable must still be there. Anything it hadn't confirmed
may be lost.

ShardStore does this with a "dirty reboot" operation, mixed with
explicit flushes so a crash can leave some parts flushed and others not.
Crashing at the level of individual disk blocks, as in
[[crash-testing]], found no extra bugs for that team and was much
slower. That's their result, not a rule, so the phase 7 harness keeps
the phase 1 crash tests too.

## Where it gets tricky

**Random keys rarely meet.** Pick keys from a huge space and a `Get`
almost never finds a key you `Put`, so the success path goes untested.
Draw from a small set, as the sketch does, or bias toward keys already
used. Don't go further than that: ShardStore's team tried copying
production's object sizes and read/write ratios and saw no effect.

**Errors are hard to model.** After an injected disk error the engine
may have done part of an operation. ShardStore relaxes the check then:
a `Get` may fail, but must never return wrong data.

**It only checks what it reaches.** Measure code coverage, and add
operations when the engine grows.

**One thread at a time.** Concurrent operations need a different
check, [[linearizability-checking]].

## What this means when you build

- Keep the model dumb. The simpler it is, the less likely it shares the
  engine's bugs.
- Put background work (flush, compaction, reopen) and crashes in the
  operation list.
- Plant a bug, like skipping a key during compaction, and make sure the
  test catches it before you trust a passing run.
- Commit every shrunk failure as a regression test.

## Further reading

- [Using Lightweight Formal Methods to Validate a Key-Value Storage Node in Amazon S3](https://www.amazon.science/publications/using-lightweight-formal-methods-to-validate-a-key-value-storage-node-in-amazon-s3), James Bornholt and others, SOSP 2021. Reference models, property-based conformance tests, biasing, shrinking and crash operations, as used on a production storage engine.
- [rapid](https://pkg.go.dev/pgregory.net/rapid), Gregory Petrosyan and contributors, v1.3.0. A Go property-based testing library with state machine tests and automatic shrinking.
