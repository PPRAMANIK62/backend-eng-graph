---
id: password-hashing
title: Password hashing
depth: deep
phase: 15
note: >-
  Slow, salted hashes: bcrypt, scrypt, Argon2.
needs: [cryptographic-hashes]
leads_to: [mfa]
compare_with: [passkeys]
---


# Password hashing

If your service has passwords, one day its database may leak: a SQL
injection, a stolen backup. Password hashing is
how you store passwords so that the leak doesn't hand the attacker
everyone's password. The trick is a hash that's salted, so each password
has to be attacked on its own, and deliberately slow, so each guess
costs real time and memory.

## Why not just SHA-256

A [[cryptographic-hashes|cryptographic hash]] like SHA-256 is one-way:
you can't compute the password back from its hash. So why not store
`sha256(password)`?

Because the attacker doesn't need to reverse it. Cracking is guessing:

1. Pick a candidate password, like `password1!`.
2. Hash it.
3. Compare with the stolen hash. If they match, that's the password.

The candidates come from wordlists of common passwords, lists leaked
from other sites, and brute force. SHA-256 was designed to be fast, and
that's exactly the problem: with GPUs and rented servers, an offline
attacker can compute many billions of hashes a second. A password has
to be far stronger to survive that than to survive guessing through a
login form, which you can rate-limit.

Encrypting passwords is worse. Encryption is meant to be undone, so
anyone who gets the key gets every password back. You only ever need to
check a password, never read it, so hash it.

## Salt: make every password a separate job

Without a salt, two users with the same password have the same hash.
The attacker hashes each guess once and compares it to every row in
the table, and can use precomputed tables of hashes for common
passwords.

A **salt** is a random value generated per password and stored next to
the hash. The hash is computed over the password and the salt together.
Now the same password gives a different hash for every user, and the
attacker has to hash each guess separately for each user. Cracking a
million accounts costs a million times as much as cracking one, and
precomputed tables are useless.

The salt isn't secret. Its only job is to be unique. The Argon2 spec
recommends 16 bytes; NIST's floor is 32 bits. In practice your library
generates it and stores it inside the output string, so you rarely touch
it.

## Slow on purpose: the work factor

Salting stops the attacker from sharing work across users. It doesn't
make each guess expensive. That's the job of the **work factor**, a
knob that decides how much computing one hash takes.

This idea goes back to bcrypt (Provos and Mazières, 1999). Their
observation: hardware keeps getting faster, but people's passwords
don't get any longer. Unix `crypt` hashed fewer than 4 passwords a second
when it shipped in 1976; by 1999 a fast workstation did over 200,000. A
fixed-cost hash loses ground every year. So bcrypt has a cost you can
raise as hardware improves, and the cost is stored in each hash so old
and new hashes can live side by side.

For you, verifying one login at, say, a fraction of a second is fine.
For an attacker trying billions of guesses, every guess costs the same
fraction of a second. The same cost is small for you and huge for them.

![Two flows. Sign-up: a new password and a freshly generated random salt go into Argon2id with parameters m, t and p, and the output stored in the users row is one string holding the algorithm, parameters, salt and hash. Log-in: the typed password is combined with the salt and parameters read from the stored string, run through Argon2id again, and the new hash is compared with the stored one; equal means the password is correct.](img/password-hashing-store-verify.svg)

*Storing and checking a password. The algorithm, its parameters and the salt travel with the hash, so each check knows exactly how to recompute it.*

## Memory-hard: Argon2 and scrypt

A work factor that only burns CPU time has a weakness. Attackers don't
use your server's CPU; they use GPUs and custom chips that run thousands
of hashes in parallel cheaply. Even if you raise the iteration count
to keep your verify time constant, the cost of a brute-force attack
built in hardware keeps falling every year.

The answer is to make each hash need a lot of **memory**, not just
time. That's what "memory-hard" means, and it takes away much of the
advantage of cheap parallel hardware.

- **scrypt** (Colin Percival) was built for exactly this. Its
  parameters are N (the CPU and memory cost), r (block size) and p
  (parallelism).
- **Argon2** won the Password Hashing Competition in 2015. It comes in
  three variants. Argon2d's memory access depends on the password;
  it suits places where nobody can watch timing, like cryptocurrency
  mining. Argon2i's access is independent of the password, which
  resists side-channel timing attacks. **Argon2id** does Argon2i for the first half of the first
  pass and Argon2d after that, getting some of both. It's the one every
  implementation must support, and the one to use. Its parameters are m
  (memory), t (passes over the memory) and p (lanes, for parallelism).

## Which algorithm, and what settings

OWASP's current recommendations, in order:

| Algorithm | When | Minimum settings |
|---|---|---|
| Argon2id | New systems | m=19 MiB, t=2, p=1 (or equivalents like 46 MiB with t=1) |
| scrypt | No Argon2id available | N=2^17 (128 MiB), r=8, p=1 |
| bcrypt | Legacy systems | cost 10 or more, input at most 72 bytes |
| PBKDF2 | When you need FIPS-140 | 600,000 iterations of HMAC-SHA-256 |

The Argon2id alternatives OWASP lists are equally strong; they just
trade memory for passes. Go's bcrypt package uses cost 10 by default and
refuses passwords longer than 72 bytes.

These are floors. The rule is to set the cost as high as your login
servers can bear, with one hash taking under a second, then raise
it over time. Measure on your own machines; no source here gives
timings for your hardware.

## Upgrading old hashes

Because the algorithm and parameters are stored with each hash, you can
change them without a big bang:

- **On next login.** You have the plain password for a moment, so
  check it against the old hash, then rehash with the new settings and
  save. This is the standard way to raise a work factor.
- **Wrap the old hash.** For a table of unsalted MD5 hashes, compute
  `bcrypt(md5_hash)` for every row right away, so nothing weak stays on
  disk. Replace each with a direct hash of the password at that user's
  next login.
- **Expire the stragglers.** Users who never log in keep their old
  hash forever. You can delete those and make them reset their password.

## Pepper: a secret the database doesn't have

A **pepper** is a secret key shared by all passwords and stored away
from the database, ideally in a [[secrets-management|secrets vault]] or hardware security
module. The simplest form runs an [[hmac|HMAC]] with the pepper over the password
hash before storing it. If an attacker only gets the database (a SQL
injection, a backup), they can't start guessing without the pepper.

NIST's guideline says verifiers should add a keyed step like this, with
the key stored separately. OWASP is cooler on it: useful defense in
depth, adds nothing on its own, and if the pepper leaks you can't
rotate it without making every user reset their password, since you
need each password to recompute.

## Where it gets tricky

**The Argon2 numbers disagree by a factor of a hundred.** The Argon2
RFC's "uniformly safe" choices are 2 GiB of memory per hash, or 64 MiB
if memory is short. Its own example for a backend login server is
0.5 seconds on a 2 GHz CPU with 4 cores and 4 GiB. OWASP's minimum is
19 MiB. These aren't contradictions so much as different questions: the
RFC's options are about one hash on a machine that can spare the memory,
while a busy login server hashes many passwords at once and has to
multiply whatever you pick by the number of concurrent logins.

**A high cost is a denial-of-service lever.** Every login attempt now
costs you real CPU and memory. An attacker can send a flood of logins to
exhaust your servers. Pair the hash with [[rate-limiting]] on login,
which NIST requires anyway to stop online guessing.

**bcrypt stops at 72 bytes.** Most bcrypt implementations only take
72 bytes of input. Pre-hashing long passwords with SHA-256 first seems like a fix
but has traps: a raw hash can contain a zero byte, and some bcrypt code
stops reading at the first zero, and if the same inner hash of a
password leaked somewhere else, an attacker can crack that instead
("password shucking"). If you must pre-hash, OWASP's recipe is an HMAC
with a pepper, then base64, then bcrypt. Or just use Argon2id.

**Hiding the algorithm doesn't help.** It's fine for the world to know
you use Argon2id. The protection comes from the cost, not the secret.

**Standards don't agree on bcrypt's status.** OWASP now says bcrypt only
for legacy systems. NIST doesn't name algorithms; it points to its own
password-based key derivation standard, and OWASP picks PBKDF2 when you
need FIPS validation.

**Slow hashing only protects decent passwords.** A password that's
first on every wordlist falls in a few guesses however slow each guess
is. That's why NIST also asks for blocklists of common passwords, and
why [[mfa]] and [[passkeys]] exist.

## What this means when you build

- Use your language's maintained library for Argon2id (or bcrypt if
  that's all you have). Don't combine primitives yourself.
- Store the whole output string, which holds algorithm, parameters,
  salt and hash, so you can upgrade later.
- Pick the highest cost your login servers can sustain at peak, keep
  one hash under a second, and measure it.
- Rehash on login when the stored parameters are older than current
  ones.
- Rate-limit login attempts. A slow hash without a rate limit hands
  attackers a way to burn your CPU.
- If you use a pepper, keep it out of the database, in a secrets
  manager, and plan for what a leak would cost.

## Further reading

- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), OWASP. Current algorithm choices and minimum settings, salts, peppers, work factors and upgrading old hashes.
- [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106), Biryukov, Dinu, Khovratovich, Josefsson, 2021. Argon2 from its designers: the three variants, parameters, and recommended settings.
- [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), Percival and Josefsson, 2016. scrypt, and why iteration counts alone lose to custom hardware.
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), NIST, 2025. What a verifier must do: salt, cost factor, stored parameters, a separately stored key, rate limiting.
- [A Future-Adaptable Password Scheme](https://www.usenix.org/legacy/events/usenix99/provos/provos_html/node1.html), Niels Provos and David Mazières, 1999. The bcrypt paper; the introduction explains why password hashing must get slower over time.
- [golang.org/x/crypto/bcrypt](https://pkg.go.dev/golang.org/x/crypto/bcrypt), Go authors, x/crypto v0.57.0. A real API: default cost, the 72-byte limit, reading the cost back out of a hash.
