---
id: passkeys
title: Passkeys
depth: deep
phase: 15
note: >-
  WebAuthn: logging in with a key pair bound to the site, so there's
  nothing to phish. Registration, sign-in and synced passkeys.
needs: [public-key-crypto, sessions]
leads_to: [account-recovery]
compare_with: [password-hashing, mfa]
---

# Passkeys

A passkey replaces a password with a key pair made for one site. The
private key stays with the user's device or passkey manager; your
server keeps only the public key. To sign in, the device signs a fresh
challenge from your server, and the browser makes sure that only
happens on your real domain. So there's no shared secret to steal from
your database, and nothing a fake login page can collect and replay.

## What changes on the server

With passwords, your server holds something close to the secret: a
[[password-hashing|slow, salted hash]] of it. Leak the table and
attackers start guessing. Users also type the password into whatever
page asks for it, and reuse it on other sites.

With a passkey, the server stores a **public key** plus some
bookkeeping: the credential ID, the user it belongs to, and a few
flags. A public key is meant to be public (see
[[public-key-crypto]]): anyone can use it to check a signature, nobody
can use it to make one. A leaked passkey table lets no one log in.
Each passkey is also unique to one site, so there's nothing to reuse.

A passkey is the everyday name for a WebAuthn **discoverable
credential**: one where the device stores the private key, the
credential ID and the user handle together, so the user can sign in
without typing a username first. The standard behind it is WebAuthn,
the browser API (Level 3 is a W3C Recommendation), plus FIDO's CTAP,
which browsers and authenticators use to talk to each other.
Three parties take part:

- **The relying party**: your site and its server.
- **The browser** (or the OS, for native apps).
- **The authenticator**: whatever holds the private key. A phone or
  laptop with a built-in **platform authenticator**, a **passkey
  provider** such as a password manager, or a **security key** plugged
  in over USB or tapped over NFC.

## Registering a passkey

Registration runs once per device or provider:

1. Your server makes a random **challenge** and sends it with its
   **RP ID** (usually your domain, like `example.com`), a stable user
   ID with no personal data in it, a display name, the signature
   algorithms it accepts, and the IDs of passkeys the user already has
   so the same device isn't registered twice.
2. The frontend calls `navigator.credentials.create()`.
3. The authenticator verifies the user (fingerprint, face, PIN or
   device password), generates a new key pair for this RP ID, and
   returns the public key and a credential ID.
4. Your server checks the response (the challenge, the origin, the RP
   ID hash, the flags) and stores the credential ID and public key
   against the account.

Google's guide recommends accepting algorithm `-7` (ECDSA with P-256)
and `-257` (RSA), which covers the authenticators in use.

## Signing in

![Sequence diagram with three lanes: the server (relying party) at example.com, the browser on https://example.com, and the authenticator. The server sends a random challenge and the rpId. The browser checks the rpId fits its own domain and builds clientData with the type, the challenge and the origin https://example.com, then passes the rpId and the SHA-256 of clientData to the authenticator. The authenticator finds the passkey for this rpId only, checks a fingerprint or PIN, and signs the authenticator data plus the hash with the private key. It returns authData, the signature and the credential ID; the browser adds clientData and the user handle and sends them to the server. The server checks the challenge, the origin, that rpIdHash is the SHA-256 of its RP ID, the UP flag (and UV if needed), and the signature with the public key stored at registration. authData holds the rpIdHash, the flags UP, UV, BE and BS, and a signature counter. The private key is never sent to the server or the browser.](img/passkeys-sign-in.svg)

*A passkey sign-in. Adapted from the W3C "Web Authentication, Level 3" specification, sections 1.3 and 7.2.*

1. Your server sends a new random challenge. It has to be
   unguessable; the spec says at least 16 bytes.
2. The frontend calls `navigator.credentials.get()`. The browser checks
   that the RP ID is its own domain or a parent of it. It then writes
   down what's going on in **client data**: the operation type, the
   challenge, and the **origin** the page is really on, like
   `https://example.com`.
3. The authenticator looks for a passkey registered to that RP ID,
   asks the user to confirm with a fingerprint or PIN, and signs two
   things together: its **authenticator data** (a SHA-256 hash of the
   RP ID, some flags, and a signature counter) and a hash of the client
   data.
4. Your server checks, in order: the type, that the challenge is the
   one it just issued, that the origin is one of its own, that the RP
   ID hash matches its RP ID, that the **user present** (UP) flag is
   set, and **user verified** (UV) too if it asked for it. Then it
   verifies the signature with the stored public key.

If all of that passes, the user is in, and you start a normal
[[sessions|session]].

## Why there's nothing to phish

Picture a phishing page at `examp1e.com` that looks exactly like
yours. With a password, the user types it in and the attacker replays
it to your site. With a one-time code, same thing, just faster.
Anything the user types can be relayed.

A passkey sign-in has nothing to type, and two checks the user can't
get wrong:

- **The browser won't use your passkey there.** The passkey is scoped
  to the RP ID `example.com`. The browser on `examp1e.com` can only ask
  for passkeys scoped to `examp1e.com` or a parent domain, and the user
  has none.
- **A relayed signature fails anyway.** Suppose the attacker gets a
  signature somehow. The client data inside it names the origin the
  browser was really on, `https://examp1e.com`, and the RP ID hash
  names the RP ID it was made for. Your server rejects both.

The trust sits in the browser and the OS, not in the user noticing a
wrong letter in the URL. NIST's authentication guideline calls this
**verifier name binding**: the output is cryptographically tied to the
name of the site it's for. It's one of the two properties NIST accepts
as phishing-resistant, and anything typed by hand (OTP codes, SMS
codes, recovery codes) doesn't count.

## Synced and device-bound passkeys

There are two kinds:

- **Synced passkeys.** The passkey provider copies the private key,
  encrypted, to the user's other devices, or restores it from a backup
  on a new phone. Lose the phone, keep the passkey. Google Password
  Manager and iCloud Keychain work this way.
- **Device-bound passkeys.** The key can't leave the device. Hardware
  security keys usually work like this. Lose the key, lose the passkey.

Your server can tell which kind it got from two flags in the
authenticator data. **Backup eligible** (BE) is set at creation and
never changes: this passkey is allowed to sync. **Backup state** (BS)
says whether it's backed up right now. The spec calls the syncable kind
multi-device credentials.

A passkey on a phone can also sign the user in on a laptop, with
cross-device authentication: the laptop shows a QR code, the phone
scans it, and the phone does the signing over FIDO's "hybrid"
transport. Devices can stay linked so the QR code is only needed once.

Syncing makes passkeys practical for normal people, and changes the
threat model. The key now lives in the provider's cloud as well, so the
security of every synced passkey rests on the user's account with that
provider. NIST requires synced keys to be stored encrypted, requires
access to them to be protected by multi-factor authentication, and
says synced passkeys can't be used at its highest assurance level,
AAL3, because the private key is exportable. For AAL3, use device-bound
keys.

## Where it gets tricky

**[[account-recovery|Account recovery]] is the new weak point.** If an attacker can add
their own passkey to an account, they're in for good, and a password
reset won't remove it. Google's guide warns against letting a password
alone unlock passkey creation, since a leaked password would then give
the attacker a permanent passkey. Notify the user every time a passkey
is added; NIST requires a notice whenever an authenticator is bound.
And whatever recovery path you offer (email, recovery codes) is now
the easiest way in.

**"Preferred" user verification can be skipped.** If you ask for user
verification as "preferred", the authenticator may skip it, for
example on a device with no fingerprint enrolled. Check the UV flag
instead of assuming. Without UV, the passkey only proved that someone
held the device.

**Is it one factor or two?** With UV, one gesture proves two things:
the user has the device, and knows its PIN or matches its biometric.
That's why a passkey can replace both a password and a second factor
(see [[mfa]]). Without UV it's one factor.

**The signature counter proves little now.** It was meant to spot a
cloned authenticator: the counter should only go up. Authenticators
that don't keep a counter send zero every time, and syncing a key is,
by design, a kind of cloning. If you see the counter go backwards,
it may be a clone, a broken authenticator, or two sign-ins processed
out of order; the spec says the mismatch alone can't tell you which.

**Scoping cuts both ways.** A passkey registered with RP ID
`login.example.com` won't work on `shop.example.com`. Pick the RP ID
up front: using the parent `example.com` makes the passkey usable on
all its subdomains. Changing it later means users register again.

**Moving between providers.** Transferring passkeys from one
provider to another is what FIDO's Credential Exchange specifications
standardize, so a user's passkeys aren't tied to the first provider
they used.

## What this means when you build

- Use a maintained server-side WebAuthn library; don't parse the
  responses and check signatures yourself.
- Generate a fresh random challenge of at least 16 bytes per ceremony,
  and accept it once.
- Choose your RP ID carefully, and check origin, RP ID hash, UP, UV and
  the signature on every sign-in.
- Store the credential ID, public key, user ID, BE flag and the
  provider's AAGUID so users can see and manage their passkeys.
- Let users register more than one passkey, and treat recovery and
  "add a passkey" as the most sensitive actions in the account.
- Send a notification whenever a passkey is added.

## Further reading

- [Web Authentication, Level 3](https://www.w3.org/TR/webauthn-3/), Tim Cappalli, Akshay Kumar, Emil Lundberg, Matthew Miller, Pascoe, Nina Satragno (editors), W3C. The spec: RP IDs, the two ceremonies, flags, and the server's verification steps.
- [Terms](https://passkeys.dev/docs/reference/terms/), passkeys.dev (W3C WebAuthn Adoption Community Group and FIDO Alliance). Clear definitions of synced and device-bound passkeys, authenticators, and cross-device sign-in.
- [What are passkeys?](https://passkeys.dev/docs/intro/what-are-passkeys/), passkeys.dev. The short case for why passkeys resist breaches and phishing.
- [Create a passkey for passwordless logins](https://web.dev/articles/passkey-registration), Eiji Kitamura, Google. Registration from the implementer's side: options, what to store, notifications.
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), David Temoshok et al., NIST, 2025. What counts as phishing-resistant, and the rules for syncable authenticators.
