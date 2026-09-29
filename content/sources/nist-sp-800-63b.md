---
id: nist-sp-800-63b
title: "NIST SP 800-63B-4: Digital Identity Guidelines, Authentication and Authenticator Management"
author: NIST
url: https://pages.nist.gov/800-63-4/sp800-63b.html
kind: spec
primary: true
---

## Summary

The US government's authentication guideline, revision 4 (2025). Read
for two parts: how verifiers must store passwords (salted, hashed with a
cost factor, optionally a keyed hash with a secret held elsewhere), and
section 5 on session management (session secrets, cookie attributes,
timeouts).

## Key claims

- Passwords must be salted and hashed. "Passwords SHALL be salted and hashed using a suitable password hashing scheme." (3.1.1.2 Password Verifiers)
- What a password hashing scheme takes and why. "Password hashing schemes take a password, a salt, and a cost factor as inputs and generate a password hash." (3.1.1.2)
- Raise the cost over time. "It SHOULD be increased over time to account for increases in computing performance." (3.1.1.2)
- Salt size. "The salt SHALL be at least 32 bits in length" (3.1.1.2)
- Store the scheme and cost with each password. "A reference to the password hashing scheme used, including the cost factor, SHOULD be stored for each password to allow migration to new algorithms and work factors." (3.1.1.2)
- A keyed hash with a secret stored apart (a pepper). "The secret key value SHALL be stored separately from the hashed passwords." (3.1.1.2)
- Verifiers must rate-limit failed attempts. "Verifiers SHALL implement a rate-limiting mechanism that effectively limits the number of failed authentication attempts that can be made on the subscriber account" (3.1.1.2)
- Offline attackers are fast. "the current ability of attackers to compute many billions of hashes per second in an offline environment that is not subject to rate limiting requires passwords to be orders of magnitude more complex than those expected to resist only online attacks." (Security, offline attacks)
- A session is bound by a secret. "A session secret SHALL be shared between the subscriber’s software and the accessed service." (Session Management, Session Bindings)
- Session secrets: from an approved RNG, at least 64 bits. "Secrets are established using input from an approved random bit generator, as described in Sec. 3.2.12, and are at least 64 bits in length." (Session Bindings)
- Not in local storage. "They SHOULD NOT be placed in insecure locations (e.g., HTML5 Local Storage) due to the potential exposure of local storage to cross-site scripting (XSS) attacks." (Session Bindings)
- Cookies aren't authenticators. "Cookies are not authenticators but are suitable as short-term secrets for the duration of a session." (Session Bindings, Browser Cookies)
- Session cookie rules: Secure; minimal hosts and paths; HttpOnly; expire near the session end but don't rely on that; `__Host-` with `Path=/`; SameSite Lax or Strict; opaque value only. "SHOULD contain only an opaque string (e.g., a session identifier) and SHALL NOT contain cleartext personal information." (Session Bindings, Browser Cookies)
- Cookie expiry isn't a timeout. "This requirement is intended to limit the accumulation of cookies but SHALL NOT be relied upon to enforce session timeouts." (Session Bindings, Browser Cookies)
- CSRF protection tied to the session. "POST/PUT content SHALL contain a session identifier that the RP SHALL verify to protect against cross-site request forgery (CSRF)." (Session Bindings)
- Two timeouts. "An overall timeout limits the duration of an authenticated session to a specific period following authentication or a previous reauthentication. An inactivity timeout terminates a session without activity from the subscriber for a specific period." (Reauthentication, Sec. 5.2)
- AAL2 limits: 24 hours overall, 1 hour inactivity. "A definite reauthentication overall timeout SHALL be established, which SHOULD be no more than 24 hours at AAL2. The inactivity timeout SHOULD be no more than 1 hour." (AAL2 reauthentication, Sec. 2.2.3)
- AAL3: 12 hours overall, 15 minutes inactivity. "At AAL3, the overall timeout for reauthentication SHALL be no more than 12 hours. The inactivity timeout SHOULD be no more than 15 minutes." (AAL3 reauthentication, Sec. 2.3.3)
- Proof-of-possession sessions (device bound session credentials) reduce theft risk. "Some technologies (e.g., the emerging device bound session credentials specification [DBSC]) mitigate the risk of theft of session secrets by using cryptographic protocols that prove the possession of a session secret rather than using them as bearer tokens." (Session Bindings)

Added for mfa, passkeys and api-keys (authenticator types, phishing
resistance, syncable authenticators):

- A password is "something you know". "A password is “something you know.”" (Passwords)
- AAL2 needs two distinct factors and must offer a phishing-resistant option. "Proof of the possession and control of two distinct authentication factors is required. Applications assessed at AAL2 must offer a phishing-resistant authentication (see Sec. 3.2.5 ) option." (Authentication Assurance Levels)
- AAL3 needs a phishing-resistant authenticator with a key that can't be exported. "AAL3 authentication requires a phishing-resistant authenticator (see Sec. 3.2.5 ) with a non-exportable authentication key" (Authentication Assurance Levels)
- Federal staff must use phishing-resistant authentication. "Federal agencies SHALL require their staff, contractors, and partners to use phishing-resistant authentication to access federal information systems." (AAL2 requirements)
- Anything you type in is not phishing-resistant, because a fake site can relay it. "Authenticators that involve the manual entry of an authenticator output (e.g., out-of-band and OTP authenticators) SHALL NOT be considered phishing-resistant because the manual entry does not bind the authenticator output to the specific session being authenticated." (Phishing Resistance)
- The relay attack. "For example, an impostor verifier could relay an authenticator output to the verifier and successfully authenticate." (Phishing Resistance)
- Two recognized ways to resist phishing. "Two methods of phishing resistance are recognized: channel binding and verifier name binding." (Phishing Resistance)
- Verifier name binding: the output is bound to the verifier's authenticated name (WebAuthn works this way through the domain). "The protocol SHALL then generate an authenticator output that is cryptographically bound to a verifier identifier that is authenticated as part of the protocol." (Verifier Name Binding)
- WebAuthn is the named example of verifier name binding. "WebAuthn [WebAuthn] , which is used by authenticators that implement the Fast Identity Online 2 (FIDO2) specifications [FIDO2] , is an example of a standard that provides phishing resistance through verifier name binding" (Verifier Name Binding)
- OTPs are computed from a shared symmetric key plus a time or counter. "The secret is computed based on a nonce that may be time-based or from a counter on the authenticator and verifier." (OTP)
- OTP is not phishing-resistant. "OTP authentication is not phishing-resistant." (OTP)
- OTP verifiers hold the same secret key the device has. "the symmetric keys used by authenticators are also present in the verifier and SHALL be strongly protected against unauthorized disclosure" (Single-Factor OTP Verifiers)
- Push approval without transferring a secret is no longer acceptable because of fatigue attacks. "This has been observed with “authentication fatigue” attacks in which an attacker generates many out-of-band authentication requests to the subscriber, who might approve one to eliminate the annoyance." (Out-of-band authenticators)
- So a secret has to be moved between the login screen and the device, not just approved. "For this reason, these guidelines require the transfer of the secret between the out-of-band device and the primary channel to increase assurance that the subject is actively participating in the session with the verifier." (Out-of-band authenticators)
- Using a restricted authenticator means accepting its risk. "The acceptance of a restricted authenticator requires the implementing organization to assess, understand, and accept the risks associated with that authenticator" (Restricted authenticators)
- Limit pushes. "Out-of-band verifiers that send a push notification to a subscriber device SHOULD implement a reasonable limit on the rate or total number of push notifications" (Out-of-band verifiers)
- SMS and voice (the phone network) are the one restricted authenticator. "there is one restricted authenticator: the use of the PSTN for out-of-band authentication" (Restricted authenticators)
- Check for SIM change and porting before trusting the phone network. "Verifiers SHOULD consider risk indicators (e.g., device swap, SIM change, number porting, other abnormal behavior) before using the PSTN" (PSTN)
- Short random secrets need a slow salted hash; the cut-off is 112 bits. "Look-up secrets that are shorter than the minimum security strength specified in the latest revision of [SP800-131A] (i.e., 112 bits as of the date of this publication) SHALL be stored in a salted and hashed form using a suitable password hashing scheme" (Look-Up Secret Verifiers)
- Recovery codes are look-up secrets and are not phishing-resistant. "Look-up secrets are not phishing-resistant." (Look-up secrets)
- Syncable authenticators copy the key to other devices. "Some cryptographic authenticators allow the subscriber to copy (i.e., clone) the authentication secret to additional devices, usually via a sync fabric." (Syncable Authenticators)
- Synced keys are stored encrypted in the sync fabric. "Authentication keys that are cloned or exported from a device to a sync fabric SHALL only be stored in an encrypted form" (Appendix B)
- Synced keys must be encrypted in the sync fabric, and access to it must be MFA-protected. "User access to authentication keys in the sync fabric SHALL be protected by AAL2-equivalent MFA" (Appendix B)
- Synced passkeys can't be used at AAL3 because the key is exportable. "Since syncable authenticators (described in Appendix B ) require the private key to be exportable, syncable authenticators SHALL NOT be used at AAL3." (AAL3)
- Adding an authenticator must trigger a notice. "When an authenticator is added, the CSP SHALL notify the subscriber via a mechanism independent of the transaction binding the new authenticator" (Binding)
- Three assurance levels (AAL1 to AAL3). "provides requirements to credential service providers (CSPs) for remote user authentication at each of three authentication assurance levels (AALs)." (Abstract)
- Four classes of recovery. "Four general classes of account recovery methods are recognized: Saved recovery codes Issued recovery codes Use of recovery contacts Repeated identity proofing" (Account Recovery Methods)
- Scheme choice points to SP 800-132. "An approved password hashing scheme published in the latest revision of [SP800-132] or updated NIST guidelines on password hashing schemes SHOULD be used." (Password Verifiers)
- Blocklists of common passwords. "If the chosen password is found on the blocklist, the CSP SHALL require the subscriber to select a different secret and SHALL provide the reason for rejection." (Password Verifiers)
- The extra keyed hash. "In addition, verifiers SHOULD perform an additional iteration of a keyed hashing or encryption operation using a secret key known only to the verifier." (Password Verifiers)
- SP 800-132 is the password-based key derivation recommendation. "[SP800-132] Turan M, Barker E, Burr W, Chen L (2010) Recommendation for Password-Based Key Derivation." (References)
- (Account recovery) Definition. "Account recovery is when a subscriber recovers from losing control of the authenticators that are needed to authenticate at a desired AAL." (Account Recovery)
- Recovery always notifies the user. "An account recovery event always causes one or more notifications to be sent to the subscriber to help detect the fraudulent use of account recovery." (Account Recovery)
- It's slower on purpose. "Since account recovery is expected to be invoked infrequently, it is generally less convenient than authentication" (Account Recovery)
- Resetting a password while another authenticator still works isn't recovery. "Replacement of a forgotten password where the subscriber can authenticate with one or more other authenticators is considered to be the binding of a new authenticator" (Account Recovery)
- Saved codes: at least 64 random bits. "The recovery code SHALL include at least 64 bits from an approved random bit generator." (Saved Recovery Codes)
- Stored hashed. "Saved recovery codes SHALL be stored in the subscriber account in hashed form using an approved one-way function" (Saved Recovery Codes)
- One use, then replaced. "Following the use of a saved recovery code, the CSP SHALL invalidate that recovery code and SHALL issue a new saved recovery code to the subscriber." (Saved Recovery Codes)
- Issued codes: at least six digits. "The issued recovery code SHALL include at least six decimal digits (or equivalent) from an approved random bit generator" (Issued Recovery Codes)
- Short validity for fast channels: 10 minutes by text or voice, 24 hours by email. "10 minutes when sent via text message or voice" (Issued Recovery Codes)
- At least two recovery addresses. "CSPs SHALL allow the subscriber to establish at least two recovery addresses." (Issued Recovery Codes)
- Recovery contacts receive codes for the user. "CSPs that support the use of recovery contacts SHALL allow the subscriber to specify one or more addresses of trusted associates to receive issued recovery codes." (Recovery Contacts)
- Repeated proofing. "CSPs SHOULD support account recovery by repeating a portion of the identity proofing process." (Repeated Identity Proofing)
- At AAL2, two codes from different methods, or one plus a remaining factor. "Two recovery codes obtained using different methods from the set (i.e., saved, issued, and recovery contacts)" (Recovery at AAL2)
- Or one code plus a single-factor authenticator. "One recovery code from the set (i.e., saved, issued, and recovery contacts) plus authentication with a single-factor authenticator that is bound to the subscriber account" (Recovery at AAL2)
- Always notify. "In all cases, account recovery SHALL cause a notification to be sent to the subscriber or their designee" (Account Recovery Notification)

## Visuals worth redrawing

None.

## My notes

- Section names are from the page; the HTML page flattens headings, so
  check numbers against the PDF before quoting a section number.
