---
id: cloudflare-rfc-8446-2018
title: "A Detailed Look at RFC 8446 (a.k.a. TLS 1.3)"
author: Nick Sullivan, Cloudflare
url: https://blog.cloudflare.com/rfc-8446-aka-tls-1-3/
kind: blog
primary: true
---

## Summary

Written the day TLS 1.3 was published (2018) by an engineer at a
company that deployed it early. Explains TLS as a hybrid cryptosystem,
what was wrong with TLS 1.2 (RSA key transport, weak DH parameters,
MAC-then-encrypt, RC4, unsigned negotiation), what TLS 1.3 removed, how
the handshake dropped from two round trips to one, 0-RTT and replay, and
why middleboxes forced TLS 1.3 to look like TLS 1.2 on the wire.

## Key claims

- SSL started at Netscape in the mid-1990s. "It has its roots in a protocol called Secure Sockets Layer (SSL) developed in the mid-nineties at Netscape." (intro)
- TLS 1.3 was the first big redesign. "It is the first major overhaul of the protocol, bringing significant security and performance improvements." (intro)
- RSA key exchange is hard to implement safely (Bleichenbacher). "It's also notoriously difficult to do correctly." (Security)
- MAC-then-encrypt with CBC led to padding oracle attacks. "You can blame this choice for BEAST, as well as a slew of padding oracle vulnerabilities such as Lucky 13 and Lucky Microseconds." (Security)
- SSL came from Netscape; the IETF renamed it TLS. "By the end of the 1990s, Netscape handed SSL over to the IETF, who renamed it TLS" (intro)
- RFC numbers of each version. "TLS 1.0 was RFC 2246, TLS 1.1 was RFC 4346, and TLS 1.2 was RFC 5246." (intro)
- The TLS 1.2 handshake takes two extra round trips. "The handshake requires two additional round-trips between the browser and the server before encrypted data can be sent (or one when resuming a previous connection)." (intro)
- Symmetric uses one key, public-key crypto two different keys. "it uses both symmetric key cryptography (encryption and decryption keys are the same) and public key cryptography (encryption and decryption keys are different)." (Security)
- The server proves it holds the private key with a signature (in DH mode). "In Diffie-Hellman mode, the server proves ownership of the private key using a digital signature." (Security)
- Hybrid schemes are used in SSH, IPsec, Signal, WireGuard. "Hybrid schemes are the predominant form of encryption used on the Internet and are used in SSH, IPsec, Signal, WireGuard and other protocols." (Security)
- Ephemeral means a new key pair per exchange. "This key exchange is called \"ephemeral\" if the client and server both choose a new key pair for every exchange" (Security)
- TLS is a hybrid: public-key crypto sets up a shared secret, symmetric crypto encrypts the data. "In hybrid cryptosystems, public key cryptography is used to establish a shared secret between both parties, and the shared secret is used to create symmetric keys that can be used to encrypt the data exchanged." (Security)
- Public-key operations are much slower than symmetric ones. "As a general rule, public key crypto is slow and expensive (microseconds to milliseconds per operation) and symmetric key crypto is fast and cheap (nanoseconds per operation)." (Security)
- TLS 1.3 set out to remove dangerous parts of older versions. "One of the design goals of TLS 1.3 was to correct previous mistakes by removing potentially dangerous design elements." (Security)
- RSA key exchange: the client encrypts a secret to the server's public key. "In TLS's RSA key exchange, the shared secret is decided by the client, who then encrypts it to the server's public key (extracted from the certificate) and sends it to the server." (Security)
- Diffie-Hellman: each side combines its private key with the other's public share and gets the same value. "When each party receives the public key share of the other, they combine it with their own private key and end up with the same value" (Security)
- RSA key exchange isn't forward secret: a later key theft decrypts recorded traffic. "if someone records the encrypted conversation and then gets ahold of the RSA private key of the server, they can decrypt the conversation." (Security)
- TLS 1.3 removed RSA key exchange; ephemeral DH is the only one left. "RSA encryption was removed from TLS 1.3, leaving ephemeral Diffie-Hellman as the only key exchange mechanism." (Security)
- TLS 1.3 limits DH parameters to known-safe ones. "TLS 1.3 takes the opinionated route, restricting the Diffie-Hellman parameters to ones that are known to be secure." (Security)
- You need both encryption and integrity. "In any secure communication scheme, you need both encryption (to keep things private) and integrity (to make sure people don't modify, add, or delete pieces of the conversation)." (Security)
- Stream ciphers XOR a key stream with the message. "Examples of pure stream ciphers are RC4 and ChaCha20." (Security)
- A MAC is like a checksum with a key. "this is done using something called a message-authentication code (MAC), which is like a fancy checksum with a key." (Security)
- TLS picked MAC-then-encrypt, which was the wrong order. "In TLS, they chose the latter, MAC-then-Encrypt, which turned out to be the wrong choice." (Security)
- RC4 was found to have biases in 2013. "In 2013, it was found to have measurable biases that could be leveraged to allow attackers to decrypt messages." (Security)
- TLS 1.3 only allows AEAD. "The only type of symmetric crypto allowed in TLS 1.3 is a new construction called AEAD (authenticated encryption with additional data), which combines encryption and integrity into one seamless operation." (Security)
- The server signs the whole handshake in TLS 1.3, which stops downgrade attacks. "In TLS 1.3, this type of downgrade attack is impossible because the server now signs the entire handshake, including the cipher negotiation." (Security)
- Downgrade attacks force the weakest shared cipher. "These attacks are called downgrade attacks, and they allow attackers to force two participants to use the weakest cipher supported by both parties" (Security)
- The likely key exchange groups are X25519 or P-256. "the parameters supported by the server are likely easy to guess (ECDHE with X25519 or P-256)." (Performance)
- The server authenticates with a certificate that holds its public key. "In every connection, the server authenticates itself to the client using a digital certificate, which has a public key." (Security)
- The client sends key shares in its first message, guessing the group. "the client can simply choose to send DH key shares in the first message instead of waiting until the server has confirmed which key shares it is willing to support." (Performance)
- A wrong key share guess (HelloRetryRequest) should be uncommon because the list of groups is short. "Because the list has been trimmed down so much, this is not expected to be a common occurrence." (Performance)
- Mobile latency can be high enough to notice. "it can make a big difference on mobile networks where latency can be as high as 200ms" (Performance)
- 0-RTT data can be replayed. "If an attacker captures a 0-RTT packet that was sent to server, they can replay it and there's a chance that the server will accept it as valid." (Resumption and 0-RTT)
- Only safe requests should go in 0-RTT. "As a client, you can try to protect against this by only putting \"safe\" requests into the 0-RTT data." (Resumption and 0-RTT)
- Middleboxes broke on small wire changes, so TLS 1.3 looks like TLS 1.2 resumption. "To accommodate these changes, TLS 1.3 was modified to look a lot like TLS 1.2 session resumption (at least on the wire)." (Backwards compatibility)

## Visuals worth redrawing

- TLS 1.2 vs TLS 1.3 handshake timelines (2 round trips vs 1).

## My notes

- Refers to RFC 8446; the spec is now RFC 9846 (2026), same protocol.
