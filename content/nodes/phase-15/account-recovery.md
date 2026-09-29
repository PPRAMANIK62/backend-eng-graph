---
id: account-recovery
title: Account recovery
depth: short
phase: 15
note: >-
  Getting back into an account after losing a password, phone or
  passkey, and why it's the weakest way in.
needs: [mfa, passkeys]
leads_to: []
compare_with: []
---

# Account recovery

Account recovery is what happens when someone loses the things they log
in with: the phone with their authenticator app, the security key, the
device that held their [[passkeys|passkey]]. It has to exist, because
people lose phones. And it's a login path like any other, so an
attacker will use it if it's the weakest one. Strong [[mfa]] means
little if "I lost my phone" leads to an email link that resets
everything.

## What counts as recovery

NIST SP 800-63B-4 draws the line carefully. Recovery is regaining an
account after losing control of the authenticators needed to log in at
the required level. If a user forgot their password but can still log in
with another authenticator they have, adding a new password is just
binding a new authenticator, not recovery. Recovery is the case where
the normal way in is gone.

Because it's rare, it's allowed to be slower and less convenient than
login, even to include waiting periods. That's a feature: slowness buys
the real owner time to notice.

## The four methods

NIST recognizes four kinds of recovery:

1. **Saved recovery codes.** At enrolment the user gets a code with at
   least 64 random bits, to print or write down and keep offline. The
   service stores only a hash of it, throttles guesses, and after a
   code is used, invalidates it and issues a new one.
2. **Issued recovery codes.** The user registers recovery addresses
   (email, text, voice, even post). When needed, a fresh code of at
   least six random digits is sent there. It expires quickly on fast
   channels: 10 minutes by text or voice, 24 hours by email. Users must
   be able to set up at least two addresses, and each address is
   confirmed with a code before it counts.
3. **Recovery contacts.** Trusted people the user names receive issued
   codes on the user's behalf, with a little extra time allowed to pass
   the code along.
4. **Repeated identity proofing.** If the user proved who they were when
   the account was created, they repeat part of that process.

## How much proof to ask for

A single recovery code shouldn't hand over a well-protected account.
For an account that normally needs multi-factor login (NIST's AAL2),
recovery needs one of:

- two recovery codes obtained by different methods, say a saved code
  and an emailed one;
- one recovery code plus login with a factor the user still has;
- repeated identity proofing, if the account was proofed.

Whatever the method, the user is always notified that their account was
recovered, so a fraudulent recovery gets noticed.

## Where it gets tricky

**Recovery sets the real security level.** An account is only as strong
as its weakest way in. If a support agent can reset an account after a
convincing phone call, that's the account's real security, whatever the
login screen asks for.

**Recovery channels are rarely phishing-resistant.** Recovery codes are
look-up secrets, and those aren't phishing-resistant: a user can be
tricked into typing one into a fake page. Passkeys protect login from
phishing; a code-based recovery path doesn't share that protection.

**Adding a credential is itself sensitive.** Recovery usually ends with
binding a new authenticator. An attacker who gets through once can add
their own passkey and keep access after the user resets their password.
Notify the user every time an authenticator is added, and let them see
and remove them.

## What this means when you build

- Offer at least one recovery method that doesn't depend on the lost
  device, and encourage users to register two passkeys or factors so
  recovery is rarely needed.
- Store recovery codes hashed, make them single-use, throttle attempts,
  and replace them after use.
- For accounts with MFA, require two independent recovery proofs, not
  one email link.
- Always notify on recovery and on every new authenticator, through a
  channel the attacker is unlikely to control.
- Treat the support team's reset process as part of your
  authentication design.

## Further reading

- [NIST SP 800-63B-4: Digital Identity Guidelines, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html), NIST, 2025. The account recovery section: what counts as recovery, the four methods and their rules, and how much proof each assurance level needs.
