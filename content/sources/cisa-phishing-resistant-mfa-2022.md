---
id: cisa-phishing-resistant-mfa-2022
title: Implementing Phishing-Resistant MFA (fact sheet)
author: CISA (US Cybersecurity and Infrastructure Security Agency)
url: https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf
kind: docs
primary: false
---

## Summary

A two-page fact sheet (2022) listing how attackers get past MFA
(phishing, push bombing, SS7, SIM swap) and ranking MFA forms from
strongest to weakest: FIDO/WebAuthn and PKI first, then app OTP and
push with number matching, then push without number matching, then SMS
and voice.

## Key claims

- MFA means two or more different kinds of factor. "MFA is a security control that requires a user to present a combination of two or more different authenticators (something you know, something you have, or something you are)" (Overview)
- A stolen password alone isn't enough. "if one factor, such as a password, becomes compromised, unauthorized users will be unable to access the account if they cannot also provide the second factor." (Overview)
- Not all MFA is equal. "However, not all forms of MFA are equally secure." (Overview)
- Any MFA beats none; phishing-resistant is the goal. "While any form of MFA is better than no MFA and will reduce an organization’s attack surface, phishing-resistant MFA is the gold standard" (Overview)
- Phishing a code: the fake login page asks for the password and the 6-digit code. "The user submits their username, password, as well as the 6-digit code from their mobile phone’s authenticator app." (Cyber threats to MFA)
- Push bombing. "Cyber threat actors bombard a user with push notifications until they press the “Accept” button" (Cyber threats to MFA)
- SIM swap. "convince cellular carriers to transfer control of the user’s phone number to a threat actor-controlled SIM card" (Cyber threats to MFA)
- Ranking: FIDO/WebAuthn and PKI are the phishing-resistant forms. "Phishing-resistant MFA: • FIDO/ WebAuthn authentication • Public key infrastructure (PKI)-based" (Table 1)
- SMS and voice are a last resort. "This form of MFA should only be used as a last resort MFA option." (Table 1)
- Number matching makes the user type a number shown at login into the app. "the user is required to enter numbers from the identity platform into the application to approve the authentication request." (Table 1)
- MFA stops password-only attacks such as spraying. "This additional layer ultimately stops some of the common malicious cyber techniques, such as password spraying." (Overview)
- FIDO can carry a second factor inside it. "In addition to being “something that you have,” FIDO authentication can incorporate various other types of factors, such as biometrics or PIN codes." (FIDO/WebAuthn Authentication)
- PKI-based MFA is usually a smart card, like the US PIV and CAC cards. "a well-known form of PKI-based MFA is the smart cards that government agencies use to authenticate users to their computers." (PKI-based MFA)
- Push without number matching: push bombing and user error. "Vulnerable to push bombing attacks as well as user error." (Table 1)
- SS7 flaws let attackers get SMS and voice codes. "Cyber threat actors exploit SS7 protocol vulnerabilities in communications infrastructure to obtain MFA codes sent via text message (SMS) or voice to a phone." (Cyber threats to MFA)
- Number matching still falls to phishing but stops push bombing. "Vulnerable to phishing attacks. Resistant to push bombing." (Table 1, app-based OTP and push with number matching)
- Move to phishing-resistant MFA as a priority. "organizations should make migrating to it a high priority effort" (Overview)

## Visuals worth redrawing

- Table 1, MFA forms strongest to weakest, with the threats each resists.

## My notes

- Government guidance, not the builders of the protocols, so primary: no.
