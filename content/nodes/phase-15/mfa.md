---
id: mfa
title: Multi-factor authentication
depth: short
phase: 15
note: >-
  A second factor, and which kinds resist phishing.
needs: [password-hashing]
leads_to: [account-recovery]
compare_with: [passkeys]
---


# Multi-factor authentication

Multi-factor authentication (MFA) asks for two or more different kinds
of proof at login, so a stolen password alone doesn't get anyone in. But the second
factors in common use differ a lot in what they stop, and most of them
don't stop the attack that matters most: phishing.

## Factors, and why "different kinds" matters

The kinds of factor are:

- **Something you know**: a password or PIN.
- **Something you have**: a phone with an authenticator app, a security
  key, a device holding a private key.
- **Something you are**: a fingerprint.

The point is that the factors fail in different ways. A password
leaks in a breach or gets guessed, even when it's stored with
[[password-hashing|a proper password hash]]; a device gets lost or
stolen. An attacker who gets one usually doesn't have the other.

NIST's authentication guideline (SP 800-63B, revision 4) requires two
distinct factors at its middle assurance level, AAL2, and requires any
service at that level to offer at least one phishing-resistant option.

## The common second factors

- **One-time codes from an app (OTP).** The app and your server share
  a secret key. Each side computes a short code from that key and the
  current time, and your server checks they match. The server has to
  keep the key itself, not a hash of it, so those keys need guarding
  like any other secret.
- **Push approval.** The server sends a prompt to the user's phone and
  they tap "approve". With **number matching**, the login page shows a
  number and the user has to type it into the app, which proves
  they're looking at the login they're approving.
- **SMS or voice codes.** The server sends a code to the user's phone
  number.
- **Recovery codes.** A list of single-use codes saved at enrolment,
  for when the other factor is lost.
- **Security keys and passkeys.** A private key on a device signs a
  challenge from the site. See [[passkeys]].

## Which ones resist phishing

![Four MFA forms from stronger to weaker. Phishing-resistant FIDO/WebAuthn (passkeys, security keys) and PKI certificates resist all the listed attacks, because the output is bound to the site or the connection. Authenticator app codes and push with number matching fall to phishing, where a fake page asks for the code and relays it at once. Push without number matching falls to push bombing and user error. SMS or voice codes fall to phishing, SIM swap and SS7 interception, and are a last resort.](img/mfa-factor-strength.svg)

*MFA forms from strongest to weakest. Adapted from CISA, "Implementing Phishing-Resistant MFA", table 1 (2022).*

Take a site with app codes. A user
clicks a phishing link to a copy of your login page and types their username, password and the 6-digit code from their app.
The fake site passes all three to your real site straight away, while
the code is still valid. Your server sees a correct password and a
correct code. MFA did nothing.

That's the general rule: **anything the user types in can be
relayed.** Under NIST's rules, authenticators whose output is
entered by hand, which covers one-time codes and SMS codes, are not
phishing-resistant, because nothing ties the code to the session it's
typed into. Recovery codes aren't either.

The other attacks on the weaker factors:

- **Push bombing (push fatigue).** The attacker has the password and
  keeps triggering login prompts until the user taps "approve" to make
  them stop. For this reason NIST now wants a secret moved between the
  login screen and the phone, not just a tap, and says to cap how many
  pushes you send. Number
  matching stops the blind tap, but not phishing.
- **SIM swap.** The attacker talks the phone carrier into moving the
  user's number to a SIM they control, and receives the SMS codes.
- **SS7.** Weaknesses in the phone network's signalling protocol let
  attackers get the codes sent by text or voice call. NIST lists SMS and voice as its
  one "restricted" authenticator, usable only when the organization
  has assessed and accepted the risk. Treat SMS as a last resort.

What resists phishing is public-key cryptography with the proof bound
to the site. WebAuthn, the web standard used by FIDO2
authenticators, ties what the device signs to the name of the site it's talking
to, so a signature made on the fake site is useless on the real one.

## Where it gets tricky

**Some MFA is still far better than none.** Weak second factors still
stop attacks that use only stolen passwords, like password spraying.
So turn on whatever MFA you can now, and plan the move to a
phishing-resistant kind.

**Recovery undoes MFA.** If losing the second factor sends the user to
an email link or a support call that resets everything, the account is
only as strong as that path. See [[account-recovery]].

**A passkey can be two factors in one.** A passkey with user
verification proves the user has the device and knows its PIN or
matches its fingerprint, in one step. That's why passkeys can replace a
password plus a second factor instead of being added on top.

## What this means when you build

- Offer passkeys or security keys, and nudge users toward them.
- If you offer app codes, guard the shared keys like any other
  secret.
- If you use push, use number matching and limit prompts.
- Treat SMS as a fallback, not a default.
- Protect recovery at least as well as login, and notify users when a
  factor is added.

## Further reading

- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), David Temoshok et al., NIST, 2025. Factor types, assurance levels, what counts as phishing-resistant, and the rules for OTP, push and SMS.
- [Implementing Phishing-Resistant MFA](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf), CISA, 2022. The attacks on MFA and a ranking of MFA forms.
