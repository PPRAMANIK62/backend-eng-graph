---
id: webdev-passkey-registration
title: Create a passkey for passwordless logins
author: Eiji Kitamura, Google (web.dev)
url: https://web.dev/articles/passkey-registration
kind: docs
primary: true
---

## Summary

Google's guide to the registration side of passkeys: the four parts
(backend, frontend, browser, passkey provider), the creation options
the server sends, what to store, and the checks around it.

## Key claims

- The flow: the backend sends user info, a challenge and existing credential IDs; the frontend calls create(); the provider verifies the user and makes the key pair; the backend stores the public key. "The frontend requests necessary credential data from the backend, including user information, a challenge, and credential IDs to prevent duplicates." (How creating a passkey works)
- Don't let a password alone gate passkey creation. "If the password is leaked, attackers could create a passkey and compromise the account." (How creating a passkey works, warning)
- RP ID can be the domain or a registrable suffix. "if an RP's origin is https://login.example.com:1337 , the RP ID can be either login.example.com or example.com ." (Fetch information from the backend)
- user.id should be permanent and free of personal data. "The user ID identifies an account, but should not contain any personally identifiable information (PII) ." (Fetch information from the backend)
- Recommended algorithms -7 and -257, ECDSA P-256 and RSA. "This specifies support for ECDSA with P-256 and RSA PKCS#1 and supporting these gives complete coverage." (Fetch information from the backend)
- excludeCredentials stops registering the same device twice. "Prevents registering the same device twice by providing a list of already registered credential IDs ." (Fetch information from the backend)
- "preferred" user verification can be skipped; check the UV bit. "The UV bit in the authenticator data of the response indicates whether user verification was performed." (Fetch information from the backend)
- Use a server library. "we recommend using a server-side library or a solution instead of writing your own code to process a public-key credential." (Save the credential)
- What to store: credential ID, user ID, public key, AAGUID, backup eligibility, dates. "Backup Eligibility flag : true if the device is eligible for passkey synchronization." (Save the credential)
- Notify the user of a new passkey, because it survives a password change. "If an attacker creates a passkey without the user's knowledge, the passkey remains available for future abuse, even after the password is changed." (Send a notification to the user)
- Passkeys sync through providers like Google Password Manager and iCloud Keychain. "Passkeys sync across devices using passkey providers like Google Password Manager and iCloud Keychain." (intro)
- "preferred" UV may be skipped, for example with no biometrics set up. "Caution: When userVerification is set to \"preferred\" , authenticators may skip the user verification check. This can happen if the device lacks biometric sensors, the user hasn't set it up" (Fetch information from the backend)
- Save the AAGUID to name the passkey for the user. "Save the AAGUID to identify the passkey provider and to name the credential for the user." (Checklist)

## Visuals worth redrawing

- "The process of creating and registering a passkey" diagram.

## My notes

- Signal API (signalUnknownCredential) for keeping provider and server
  in step; not used.
