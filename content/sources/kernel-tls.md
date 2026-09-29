---
id: kernel-tls
title: Kernel TLS (Linux kernel documentation)
author: Linux kernel developers
url: https://docs.kernel.org/networking/tls.html
kind: docs
primary: true
---

## Summary

The Linux kernel docs for kernel TLS (kTLS). A TLS library does the
handshake in user space and hands the keys to the kernel with a
socket option; after that the kernel encrypts what's sent on the
socket, including data sent with sendfile.

## Key claims

- After TLS_TX is set, everything sent on the socket is encrypted by the kernel. "After setting the TLS_TX socket option all application data sent over this socket is encrypted using TLS and the parameters provided in the socket option." (Sending TLS application data)
- sendfile works over kTLS. "The sendfile system call will send the file’s data over TLS records of maximum length (2^14)." (Sending TLS application data)
- With NIC offload, TLS_TX_ZEROCOPY_RO lets sendfile skip even the in-kernel copy. "Allow sendfile() data to be transmitted directly to the NIC without making an in-kernel copy. This allows true zero-copy behavior when device offload is enabled." (TLS_TX_ZEROCOPY_RO)
- The data must not change until sent, or retransmissions look tampered. "Modifying the data may result in different versions of the data being used for the original TCP transmission and TCP retransmissions." (TLS_TX_ZEROCOPY_RO)

- Only symmetric encryption is in the kernel; the handshake finishes first, then the data path moves to the kernel. "Currently only the symmetric encryption is handled in the kernel." / "After the TLS handshake is complete, we have all the parameters required to move the data-path to the kernel." (Creating a TLS connection)

## Visuals worth redrawing

None.

## My notes

- Implies that without offload, kTLS still copies once inside the
  kernel (to encrypt). The page says "without making an in-kernel
  copy" only for the offload case.
