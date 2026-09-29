---
id: ct-how-ct-works
title: How CT works
author: Certificate Transparency project (Google)
url: https://certificate.transparency.dev/howctworks/
kind: docs
primary: true
---

## Summary

The Certificate Transparency project's own explanation of CT, step by
step: CAs log precertificates to public append-only logs, get signed
certificate timestamps (SCTs) back and embed them in the certificate;
browsers require SCTs; monitors watch the logs for certificates nobody
asked for. Also a short description of the Web PKI (roots,
intermediates, chain verification).

## Key claims

- Logs are append-only ledgers anyone can query. "Certificate logs are append-only ledgers of certificates." (ecosystem)
- Domain owners can subscribe to a monitor to hear about new certificates for their names. "If you subscribe to a CT monitor for your domain, you get updates when precertificates and certificates for those domains are included in any of the logs checked by that monitor." (ecosystem)
- A precertificate carries a poison extension so it can't be used. "It also has a poison extension so that user agents won't accept it." (step 2)
- An SCT is the log's promise to add the certificate within the maximum merge delay. "This is a promise to add the certificate to the log within a time period called the Maximum Merge Delay (MMD)." (step 3)
- Logs use Merkle trees. "They use a special cryptographic mechanism, a Merkle tree, to allow public audits." (step 4)
- The MMD is usually 24 hours. "The MMD is usually 24 hours" (step 5)
- CAs put SCTs in the certificate as an X.509 extension. "CAs attach SCTs to a certificate using an X.509v3 extension." (step 5)
- Chrome and Safari require at least two SCTs. "Both Safari and Chrome user agents require at least 2 SCTs, depending on certificate lifetimes." (step 7)
- Monitors watch for suspicious certificates, including ones with CA powers. "They can watch for certificates that have unusual extensions or permissions, such as certificates that have CA capabilities." (step 8)
- The most important keys are kept in vault-like facilities. "keeping the most important private keys in vault-like facilities to protect them from physical and logical security threats." (Web PKI)
- Logs can only grow. "Append-only. Certificates can only be added to a log, not deleted, modified, or retroactively inserted." (step 4)
- Root keys are kept offline and used to create intermediates, which issue server certificates. "These root certificates and their private keys are used to create intermediate CA certificates" (Web PKI)
- The server sends its certificate and its issuers as a chain, and the browser checks each signature back to a root. "The user agent does this by verifying each certificate signature, ensuring the each certificate in the chain was ultimately issued by a certificate authority that the browser trusts." (Web PKI)
- Monitors are how a domain owner learns a certificate was issued without their say. "Monitors work with website operators to help them understand if an unauthorized certificate has been issued for a domain." (step 8)

## Visuals worth redrawing

- The CT flow: CA, log, SCT, certificate, browser, monitor.

## My notes

- CT doesn't stop a CA from misissuing; it makes misissuance visible
  (RFC 9162 says so directly; not cited).
