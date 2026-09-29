---
id: fuzzing
title: Fuzzing
depth: short
phase: 3
note: >-
  Feeding generated input to a parser to find crashes and disagreements.
  The phase 3 build's harness.
needs: [http-1-1, request-smuggling]
leads_to: [model-based-testing]
compare_with: [fault-injection, deterministic-simulation-testing]
---

# Fuzzing

Fuzzing is testing with inputs you didn't write. A fuzzer generates
thousands of inputs a second, feeds them to your code, and watches for
crashes, hangs and wrong answers. Parsers are a natural target: they
take bytes from strangers, and the bugs hide in inputs nobody thought
to try. Point two parsers at the same input and compare their answers,
and fuzzing also finds the disagreements behind attacks like
[[request-smuggling]].

## Random changes, kept when they reach new code

Picture a parser for [[http-1-1]] requests. A plain unit test hands it
a few requests you typed. A fuzz test starts from a few of those, the
*seed corpus*, and keeps changing them at random: a byte flipped here,
a header repeated there, say. Each new input goes to the parser.

Pure randomness mostly makes inputs the parser rejects at once. So
Go's fuzzer is *coverage-guided*: the code is instrumented to record
which branches each input reaches. An input that reaches code no
earlier input did is "interesting" and gets added to the corpus, so the
next round of changes starts from it. Over time the corpus works its
way deeper into the parser, into the chunked-body code and the odd
header cases.

Go has this built in since Go 1.18. A fuzz test for the parser looks
like this:

```go
func FuzzParseRequest(f *testing.F) {
    f.Add([]byte("GET / HTTP/1.1\r\nHost: a\r\n\r\n"))
    f.Fuzz(func(t *testing.T, data []byte) {
        req, err := Parse(data)
        if err != nil {
            return // rejecting bad input is fine
        }
        check(t, req) // invariants that must hold for any accepted request
    })
}
```

`go test` runs just the seeds, like a unit test. `go test
-fuzz=FuzzParseRequest` starts generating inputs and keeps going until
something fails or you stop it (`-fuzztime` sets a limit). A failure is
a panic, a call to `t.Error` or `t.Fatal`, an exit, or an input that
takes longer than a second. When one happens, Go shrinks the input to
the smallest version that still fails and saves it under
`testdata/fuzz/`. From then on it runs as part of the normal test suite,
a regression test you didn't have to write.

## Crashes are the easy part

A fuzzer finds crashes for free. The harder bugs are a parser that
doesn't crash, but gives the wrong answer. For that the fuzz target
needs a way to know the right answer.

One way is invariants: parse, serialize, parse again, and the two
results must match. Another is *differential fuzzing*: give the same
input to a second implementation and compare. If one parser says the
request ends at byte 120 and the other says byte 160, at least one of
them is wrong, and between a [[reverse-proxy]] and a backend, that
exact disagreement is how a second request gets smuggled through.

![A loop. The corpus of seeds and kept inputs feeds a mutator, which makes a new input of raw request bytes. The input goes to two parsers, yours and a reference implementation. Their answers are compared: if they agree and the input reached new code, it goes back into the corpus; if they disagree or one crashes, the input is minimized, saved and checked by hand.](img/fuzzing-differential-loop.svg)

*Differential fuzzing of a parser.*

The T-Reqs study (CCS 2021) did this at scale for HTTP. It generated
requests from a grammar of HTTP, mutated the request line, the headers
and the body, and sent each one through ten servers, proxies and [[cdn|CDNs]],
including NGINX, HAProxy, Apache, Varnish, Cloudflare and CloudFront.
Each ran as a reverse proxy in front of a server that recorded what
arrived, and the study flagged every case where two of them read a
different body length. Then it stacked the suspect pairs, proxy in
front of origin, to confirm which disagreements really let a request
be smuggled. Servers that were fine on their own turned out to be
exploitable in pairs, and every part of a request could cause a
disagreement, not only the `Content-Length` and `Transfer-Encoding`
headers.

This is the harness the phase 3 lab plans for its own HTTP/1.1 parser:
differential fuzzing against Go's `net/http` and a second reference,
seeded with known smuggling cases. It hasn't been built yet.

## Where it gets tricky

**A disagreement isn't a bug report yet.** Two parsers can differ and
both be defensible, and the reference can be the wrong one. T-Reqs
found that not every discrepancy leads to smuggling. Each one needs a
human to check the spec and decide.

**It never says "done".** A fuzzer that runs for hours and finds
nothing hasn't proved the parser correct. The count of new interesting
inputs usually rises fast and then tapers off, with bursts when a new
branch is found. How long to run is your call.

**The target has to be fast and repeatable.** Go runs many fuzz
workers in parallel and in no fixed order, so a target shouldn't keep
state between calls or depend on globals. A slow target runs fewer
inputs, and anything over a second counts as a failure.

**Your harness can add its own bugs.** If the harness parses the
traffic to see what a server did, its parser becomes one more thing
that can disagree. T-Reqs used low-level network code in its tools for
that reason.

**Coverage needs support.** Go's coverage instrumentation works on
AMD64 and ARM64. Elsewhere the fuzzer runs blind and the corpus barely
grows.

## What this means when you build

- Fuzz every parser that reads untrusted bytes, starting from real
  inputs and known nasty cases as seeds.
- Write down the invariants the target checks. "Didn't crash" is the
  weakest one.
- For a protocol parser, compare against at least one other
  implementation, and treat every disagreement as something to explain.
- Commit the failing inputs the fuzzer saves; they're your regression
  tests.
- Fuzzing complements [[crash-testing]], which feeds storage code bad
  timing instead of bad bytes.

## Further reading

- [Go Fuzzing](https://go.dev/doc/security/fuzz/), The Go Authors. How native Go fuzz tests work: coverage guidance, the corpus, failures, minimization and the settings.
- [T-Reqs: HTTP Request Smuggling with Differential Fuzzing](https://seclab.nu/static/publications/ccs2021treqs.pdf), Bahruz Jabiyev, Steven Sprecher, Kaan Onarlioglu and Engin Kirda, CCS 2021. Grammar-based differential fuzzing of ten HTTP servers and proxies, and what their disagreements led to.
