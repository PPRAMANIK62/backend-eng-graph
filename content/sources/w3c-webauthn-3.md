---
id: w3c-webauthn-3
title: "Web Authentication: An API for accessing Public Key Credentials, Level 3"
author: Tim Cappalli, Akshay Kumar, Emil Lundberg, Matthew Miller, Pascoe, Nina Satragno (editors), W3C
url: https://www.w3.org/TR/webauthn-3/
kind: spec
primary: true
---

## Summary

The WebAuthn spec, Level 3 (a W3C Recommendation when this was read;
Level 2 was 2021, Level 1 2019). Browsers and authenticators create a
key pair per site, keep the private key, and hand the site the public
key. To sign in, the authenticator signs the site's challenge together
with data the browser adds, including the origin. Defines RP IDs,
the two ceremonies, authenticator data and its flags, backup
eligibility and state (synced passkeys), and the server's step by step
verification.

## Key claims

- Credentials are scoped to a relying party and created on authenticators. "one or more public key credentials , each scoped to a given WebAuthn Relying Party , are created by and bound to authenticators as requested by the web application." (Abstract)
- The scoping is enforced by browsers and authenticators together. "This scoping is enforced jointly by conforming User Agents and authenticators ." (1)
- Sites can't see credentials of other sites. "Relying Parties are not able to detect any properties, or even the existence, of credentials scoped to other Relying Parties ." (1)
- Two ceremonies, registration and authentication, via create() and get(). "The former is used during Registration , and the latter during Authentication ." (1)
- RP ID defaults to the origin's domain and can only be widened to a registrable suffix. "This default MAY be overridden by the caller, as long as the caller-specified RP ID value is a registrable domain suffix of or is equal to the caller’s origin ’s effective domain ." (4, RP ID)
- The RP ID sets where a credential can be used. "The RP ID of a public key credential determines its scope ." (4, RP ID)
- Challenges must be unguessable, at least 16 bytes. "Challenges SHOULD therefore be at least 16 bytes long." (13.4.3)
- Server checks the challenge in client data. "Verify that the value of C . challenge equals the base64url encoding of pkOptions . challenge ." (7.2)
- Server checks the origin in client data. "Verify that the value of C . origin is an origin expected by the Relying Party ." (7.2)
- Server checks the RP ID hash in authenticator data. "Verify that the rpIdHash in authData is the SHA-256 hash of the RP ID expected by the Relying Party ." (7.2)
- Server checks user presence. "Verify that the UP bit of the flags in authData is set." (7.2)
- The signature covers authenticator data plus a hash of client data. "Using credentialRecord . publicKey , verify that sig is a valid signature over the binary concatenation of authData and hash ." (7.2)
- Flag bits: UP, UV, BE, BS. "Bit 3: Backup Eligibility ( BE )." (6.1)
- A backup-eligible credential is a multi-device credential. "A backup eligible public key credential source is referred to as a multi-device credential whereas one that is not backup eligible is referred to as a single-device credential ." (4, Backup Eligibility)
- Backup eligibility is fixed at creation; backup state can change. "Backup eligibility is a credential property and is permanent for a given public key credential source ." (4)
- Synced passkeys give phishing-resistant sign-in. "provide phishing-resistant sign in using multi-device credentials (commonly referred to as synced passkeys )." (1.2.1)
- The signature counter is for spotting cloned authenticators; authenticators without one send zero. "The signature counter ’s purpose is to aid Relying Parties in detecting cloned authenticators." and "Authenticators that do not implement a signature counter leave the signCount in the authenticator data constant at zero." (6.1.1)
- A counter mismatch doesn't say which copy is the clone. "Detecting a signature counter mismatch does not indicate whether the current operation was performed by a cloned authenticator or the original authenticator." (6.1.1)
- The server checks the operation type first. "Verify that the value of C . type is the string webauthn.get ." (7.2); registration runs the same checks with webauthn.create (7.1).
- Client data (type, challenge, origin) binds the RP and the client. "The client data represents the contextual bindings of both the WebAuthn Relying Party and the client ." (5.8.1)
- Backup state says whether the key is backed up now. "Bit 4: Backup State ( BS ). 1 means the public key credential source is currently backed up ." (6.1)
- A counter that goes backwards has several possible causes. "a cloned authenticator may exist, or the authenticator may be malfunctioning, or a race condition might exist where the relying party is receiving and processing assertions in an order other than the order they were generated at the authenticator." (6.1.1)

## Visuals worth redrawing

- Figure 1 (registration flow) and figure 2 (authentication flow) in
  section 1.3 and the authenticator data layout in 6.1.

## My notes

- Spaces around punctuation in the quotes come from the HTML's
  linked terms; the words are as on the page.
