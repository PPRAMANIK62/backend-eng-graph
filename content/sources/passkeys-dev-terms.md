---
id: passkeys-dev-terms
title: Terms, passkeys.dev
author: W3C WebAuthn Adoption Community Group and FIDO Alliance contributors
url: https://passkeys.dev/docs/reference/terms/
kind: docs
primary: true
---

## Summary

Glossary from the passkey implementers' site run by the people behind
WebAuthn and FIDO. Defines passkey, synced and device-bound passkeys,
discoverable credentials, platform and roaming authenticators,
cross-device authentication, autofill UI, user presence and
verification.

## Key claims

- A passkey is a discoverable WebAuthn credential. "The high level, end-user centric term for a FIDO2/WebAuthn Discoverable Credential ." (Passkey)
- Two flavors. "From the technical side, there are two flavors of passkeys: synced and device-bound ." (Passkey)
- Device-bound passkeys can't leave the device, e.g. security keys. "FIDO2 security keys typically hold device-bound passkeys as the credential cannot leave the device." (Device-bound passkey)
- Discoverable credentials store everything on the authenticator, so no username needed first. "can be used by a user to log in to a relying party without initially providing a user ID." (Discoverable Credential)
- Synced passkeys can be available on all a user's devices. "passkey providers could sync passkeys in real-time across a user’s devices, restore passkeys from a backup whenever a user sets up a new device" (Synced passkey)
- Cross-device: a phone's passkey signs in on a laptop, over CTAP hybrid. "FIDO Cross-Device Authentication (CDA) allows a passkey from one device to be used to sign in on another device." (Cross-Device Authentication)
- User verification is biometric, PIN or device password. "User Verification (UV) requires the user to either perform a biometric gesture, enter the device PIN, or enter the device password" (User Verification)
- User presence is a touch. "UP is often satisfied by pressing a button or metallic area of a security key" (User Presence)
- Autofill UI is conditional mediation. "The technical name for this feature in the WebAuthn and Credential Management specifications is “Conditional Mediation”." (Autofill UI)
- Credential Exchange moves passkeys between providers. "A standardized process to securely transfer passkeys, passwords, and other types of information from one passkey provider to another." (Credential Exchange)
- Security keys connect over USB, NFC or Bluetooth. "Roaming authenticators attach to users’ devices in using USB, NFC, and/or Bluetooth." (Roaming authenticator)
- CTAP is between platforms and authenticators; sites don't implement it. "CTAP is implemented by authenticators and client platforms, not Relying Parties." (Cross-Device Authentication)
- Linked devices skip the QR code next time. "which enables future use without having to scan a QR code." (Persistent Linking)
- Cross-device runs over CTAP's hybrid transport. "CDA is powered by the FIDO Client-to-Authenticator Protocol (CTAP) using “hybrid” transport." (Cross-Device Authentication)
- One sign-in step can collect more than one factor. "Note that a single login challenge may collect multiple factors simultaneously." (Authentication factor)
- Passkeys are meant to stand alone. "Passkeys are designed to be used without additional login challenges." (Passkey)

## Visuals worth redrawing

None.

## My notes

- Pair with passkeys-dev-what-are-passkeys for the security claims.
