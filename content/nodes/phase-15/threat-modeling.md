---
id: threat-modeling
title: Threat modeling
depth: deep
phase: 15
note: >-
  Listing what can go wrong before building: assets, attackers, trust
  boundaries.
needs: []
leads_to: [owasp-api-top-10, supply-chain-security]
compare_with: []
---


# Threat modeling

Threat modeling means drawing the system you're building, then asking,
place by place, how someone could break it, and deciding what to do
about each answer. It's how you find design flaws while they're a few
lines on a whiteboard, before they become code in production. You don't
need to be a security expert to do it. You need a picture of your system
and the habit of asking "what can go wrong?".

## Four questions

Most ways of doing it come down to four questions, known as Adam
Shostack's four-question framework:

1. **What are we working on?**
2. **What can go wrong?**
3. **What are we going to do about it?**
4. **Did we do a good enough job?**

Asking just these, informally, is already much better than nothing.
Everything else (diagrams, mnemonics, tools, named methods like PASTA or
LINDDUN) is a way of answering one of them more thoroughly. There's no
single standard process, and the people who wrote the Threat Modeling
Manifesto say so on purpose: pick techniques that fit how your team
already works.

Take a concrete example and walk through all four.

## What are we working on: draw the data flows

Say you're building a small notes app. A browser talks to an API
server. The API stores notes and users in Postgres. When a user pastes a
link into a note, a background worker fetches that URL to build a
preview card.

The usual picture is a **data flow diagram**. It has only a few kinds of
thing in it:

- **External entities**: people or systems you don't control (the
  browser, the websites the worker fetches).
- **Processes**: your code (the API, the worker).
- **Data stores**: where data rests (Postgres, a queue).
- **Data flows**: arrows for data moving between them.
- **Trust boundaries**: lines where data passes from something you
  trust less to something you trust more, or the other way. The
  internet-facing side of the API is one. The worker's outgoing calls
  cross another.

Then mark the **assets**: the things whose loss would hurt. A useful
test is whether losing or corrupting it would cost money, reputation, or
land you in a legal dispute. Here that's users' notes, their password
hashes and session tokens, and the internal network the worker sits in.

![A data flow diagram of a notes app. A dashed trust boundary separates the internet (browser, external websites) from our system (API server, job queue, preview worker, and Postgres holding users, password hashes and notes). Arrows: browser to API (requests), API to Postgres (SQL), API to job queue (preview job), queue to worker, and worker out to websites (fetch URL) across the boundary. Threat notes, each tagged with a STRIDE letter: S stolen session cookie, I another user's note ID, E role claim not checked, T SQL injection from a note, D login flood, and I URL to internal address next to the worker's fetch.](img/threat-modeling-dfd.svg)

*A data flow diagram for a small notes app, with a trust boundary and a threat noted on each flow. The notes app is our own example.*

The diagram isn't the threat model. It's a shared picture so the
team can point at the same arrow and ask about it. The least trusted
part is whatever faces the outside: anything that arrives across the
internet boundary could have been written by an attacker.

## What can go wrong: walk each arrow with STRIDE

Now take one data flow at a time and ask what could go wrong on it.
Attackers use the same flows your users do, just in ways you didn't
expect. To keep the brainstorm from wandering, many teams use
**STRIDE**, a mnemonic that came out of Microsoft. Each letter is a kind of threat,
and each one breaks a property you want:

| Threat | Breaks | On the notes app |
|---|---|---|
| **S**poofing | Authentication | Someone steals a user's session token and acts as them. |
| **T**ampering | Integrity | Input from the note form ends up changing SQL. |
| **R**epudiation | Non-repudiation | A user deletes shared notes and there's no record of who did it. |
| **I**nformation disclosure | Confidentiality | User A reads user B's note by changing the ID in the URL. |
| **D**enial of service | Availability | A flood of login attempts eats the CPU, or locks real users out. |
| **E**levation of privilege | Authorization | A user tampers with a token to make themselves admin. |

Run through the letters for each arrow. Browser to API: spoofing
(stolen [[sessions|session]] cookie), information disclosure (the
[[bola]] case: another user's note by guessing an ID), elevation (a
[[jwt|token]] whose role claim isn't checked). API to Postgres:
tampering through [[sql-injection]]. Worker to the web: the URL comes
from a user, so they can point it at an internal address and read the
response, which is [[ssrf]]. The login endpoint: denial of service, and
guessing passwords, which is why you need [[rate-limiting]] and slow
[[password-hashing]].

Write each threat down specifically, one per sticky note: "SQL
injection from the note form", not "injection". A vague threat can't be
fixed or tested.

STRIDE isn't the only prompt. Kill chains (deliver an exploit, exploit,
persist, command and control, act) are another common way to answer
"what can go wrong", and checklists of known risks like the
[[owasp-api-top-10]] help you not forget the classics. For third-party
code you pull in, the same questions lead to
[[supply-chain-security]].

## What are we going to do about it

Every threat gets a response. There are four:

- **Mitigate**: make it harder. For the worker, only fetch
  destinations on an allowlist.
- **Eliminate**: remove the feature that creates it. Maybe link previews
  aren't worth an SSRF risk at all.
- **Transfer**: make it someone else's job, for example the
  customer's, through a setting they control.
- **Accept**: decide it's not worth fixing now, and say so out loud.

A mitigation has to be something you can build, not a hope: "validate
the note ID belongs to the caller on every request", not "be careful
with IDs". Written that way it turns into a requirement, a ticket, and a
test.

Ranking comes before fixing. In theory you rank by likelihood times
impact. In practice both are hard to estimate, and they leave out how
much work the fix is, so teams often rank roughly and fix cheap,
high-impact things first.

## Did we do a good enough job

Check the work:

- Does the diagram still match what was built?
- Does every threat have an agreed response?
- Can each mitigation be tested, and is there a test? An
  [[audit-logging|audit log]] for the repudiation threat is only a
  mitigation if something checks that deletes are recorded.

Then keep it alive. A threat model is not a document you file once. The
system changes, so the model changes with it.

## Little and often

It's tempting to book a full-day workshop and model the whole system.
That tends to overwhelm people and not stick. What works better is
small and regular: a 15 to 30 minute session on the feature you're
building right now, with whoever is building it, a product owner who
knows what matters to the business, and a security person if one is
around (but don't wait for them). Look at the new data flows, ask
"what can go wrong?", write the stickies, turn the good ones into
tickets.

## Where it gets tricky

**No one agrees on the method, and that's fine.** STRIDE, PASTA,
OCTAVE, LINDDUN (for privacy), VAST, kill chains. Each has
people who swear by it. They're all ways of answering the same four
questions.

**Even STRIDE's letters vary.** Microsoft and OWASP call the E
"elevation of privilege"; Shostack's own guide calls it "expansion of
authority". The words
matter less than walking every flow with every prompt.

**Threat modeling is not risk management.** Threat modeling finds the
ways things can break. Weighing likelihood and impact and deciding the
trade-offs is risk management, a separate job often done by risk staff
or lawyers. The four responses look like risk responses, but you can
pick them quickly, by agreement in the room.

**The picture becomes the goal.** Teams can spend the session perfecting
the diagram. Several rough views often show more than one perfect one.

**Too much focus on one thing.** Obsessing over one kind of attacker or
asset hides the rest. Parts of a system depend on each other, so keep
the whole picture in view.

**The hero.** It isn't a special talent one person has. Everyone on
the team can do it, and fresh eyes often spot risks an expert misses.

**Ranking is guesswork.** Likelihood and impact are hard to put numbers
on, and a precise-looking score can hide how rough the inputs are.

## What this means when you build

- Before building a feature, draw its data flows and trust boundaries,
  and mark the assets.
- Walk each flow with STRIDE. Write specific threats.
- Give every threat a response. Turn mitigations into tickets and
  tests.
- Pay most attention to anything that crosses a boundary: user input,
  URLs you fetch, tokens you accept, data you send out.
- Keep sessions short and frequent, tied to the work in progress, and
  update the model when the design changes.

## Further reading

- [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/), Braiterman, Shostack, Marcil, Wuyts and others. The four questions, and the values, patterns and anti-patterns in a page.
- [Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html), OWASP. The four steps, DFDs with trust boundaries, STRIDE with examples, and the four responses.
- [The Ultimate Beginner's Guide to Threat Modeling](https://shostack.org/resources/threat-modeling), Shostack + Associates. The four-question framework from its author, and how threat modeling differs from risk management.
- [Microsoft Threat Modeling Tool threats](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats), Microsoft. STRIDE's six categories as defined by the company that made them.
- [Threat Modeling Guide for Software Teams](https://martinfowler.com/articles/agile-threat-modelling.html), Gayathri Mohan and Jim Gumbley, 2025. Starting from data flows, STRIDE as prompts, and short team sessions with a worked example.
