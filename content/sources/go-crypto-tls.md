---
id: go-crypto-tls
title: "crypto/tls, Go standard library documentation"
author: The Go Authors
url: https://pkg.go.dev/crypto/tls
kind: docs
primary: true
---

## Summary

The Go package docs for crypto/tls (Go 1.27.1 when read). A concrete
view of TLS knobs in a real implementation: version limits, cipher
suites, key exchange defaults including post-quantum hybrids, client
certificate policies and session tickets.

## Key claims

- Default minimum version is TLS 1.2. "By default, TLS 1.2 is currently used as the minimum." (Config.MinVersion)
- Default maximum is TLS 1.3. "By default, the maximum version supported by this package is used, which is currently TLS 1.3." (Config.MaxVersion)
- TLS 1.3 cipher suites can't be configured. "Note that TLS 1.3 ciphersuites are not configurable." (Config.CipherSuites)
- Since Go 1.24 the default key exchange includes a hybrid post-quantum one. "From Go 1.24, the default includes the [X25519MLKEM768] hybrid post-quantum key exchange." (Config.CurvePreferences)
- Skipping verification allows machine-in-the-middle attacks. "In this mode, TLS is susceptible to machine-in-the-middle attacks unless custom verification is used." (Config.InsecureSkipVerify)
- InsecureSkipVerify accepts any certificate and any name, and is meant for tests or with your own verification. "If InsecureSkipVerify is true, crypto/tls accepts any certificate presented by the server and any host name in that certificate." and "This should be used only for testing or in combination with VerifyConnection or VerifyPeerCertificate." (Config.InsecureSkipVerify)
- ServerName is what the client checks the certificate against. "ServerName is used to verify the hostname on the returned certificates unless InsecureSkipVerify is given." (Config.ServerName)
- The server doesn't ask for client certificates by default. "The default is NoClientCert." (Config.ClientAuth)
- The strictest mode requires a valid client certificate. "RequireAndVerifyClientCert indicates that a client certificate should be requested during the handshake, and that at least one valid certificate is required to be sent by the client." (ClientAuthType)
- RequestClientCert asks but doesn't require. "RequestClientCert indicates that a client certificate should be requested during the handshake, but does not require that the client send any certificates." (ClientAuthType)
- VerifyClientCertIfGiven checks a certificate only if one is sent. "If the client does send a certificate it is required to be valid." (ClientAuthType, VerifyClientCertIfGiven)
- RequireAnyClientCert doesn't check the certificate is valid. "at least one certificate is required to be sent by the client, but that certificate is not required to be valid." (ClientAuthType, RequireAnyClientCert)
- ClientCAs is the set of roots used to verify client certificates. "ClientCAs defines the set of root certificate authorities" (Config.ClientCAs)
- VerifyPeerCertificate isn't called on resumed connections. "WARNING: Config.VerifyPeerCertificate does not get called on resumed connections" (Config.Clone)
- VerifyConnection runs on every connection, resumed or not. "This callback will run for all connections, including resumptions, regardless of InsecureSkipVerify or ClientAuth settings." (Config.VerifyConnection)
- Session ticket keys rotate daily and are dropped after seven days by default. "session ticket keys will be automatically rotated every day and dropped after seven days." (Config.SessionTicketKey)
- Servers behind one name need shared ticket keys. "For customizing the rotation schedule or synchronizing servers that are terminating connections for the same host, use SetSessionTicketKeys." (Config.SessionTicketKey)
- Resumption can be turned off. "SessionTicketsDisabled may be set to true to disable session ticket and PSK (resumption) support." (Config.SessionTicketsDisabled)

## Visuals worth redrawing

None.

## My notes

- Early data (0-RTT) settings in the docs only appear for QUIC
  connections (QUICSessionTicketOptions.EarlyData). Didn't find a
  statement about 0-RTT over TCP, so don't claim either way.
