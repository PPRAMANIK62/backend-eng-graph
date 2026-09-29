---
id: corbet-zero-copy-networking-2017
title: Zero-copy networking
author: Jonathan Corbet, LWN.net
url: https://lwn.net/Articles/726917/
kind: blog
primary: false
---

## Summary

LWN's 2017 write-up of the MSG_ZEROCOPY patch set. Explains why
zero-copy matters, what sendfile can and can't do, how MSG_ZEROCOPY
pins the buffer and reports completion through the socket error
queue, and why the gains are smaller than people hope.

## Key claims

- Copying often caps throughput, but zero-copy gains tend to disappoint. "the number of times that data is copied puts an upper limit on how fast things can go.  As a result, zero-copy algorithms have long been of interest, even though the benefits achieved in practice tend to be disappointing." (intro)
- NICs already support scatter/gather, so the hardware side existed. "Network hardware has long since gained the ability to do scatter/gather I/O" (intro)
- sendfile only works for data that comes straight from a file. "That works well when transmitting static data that is in the page cache, but it cannot be used to transmit data that does not come directly from a file." (intro)
- MSG_ZEROCOPY: the buffer is locked and must not be touched until a notification arrives. "Transmission will almost certainly not be complete by the time that send() returns, so the process must take care to not touch the data in the buffer while the operation is in progress." (body)
- Setup cost makes it a loss for small sends. "The overhead associated with setting up a zero-copy transmission (locking pages into memory and such) is significant, so it makes little sense to do it for small transmissions" (body)
- Any transform of the data (e.g. encryption) rules out zero-copy. "Anytime that the kernel must transform the data — when IPSec is being used to encrypt the data, for example — it cannot do zero-copy transmission." (body)
- The author's numbers: 39% faster on a netperf benchmark, 5 to 8% on a production workload. "the author claims that a simple benchmark (netperf blasting out data) runs 39% faster, while a more realistic production workload sees a 5-8% improvement." (body)

- If the card can't compute checksums, the kernel passes over the data anyway. "if the network interface cannot generate checksums, the kernel will have to perform a pass over the data to do that calculation itself" (body)

## Visuals worth redrawing

None.

## My notes

- The 39% and 5-8% are the patch author's claims as reported by LWN,
  for MSG_ZEROCOPY, not for sendfile. Don't reuse them for sendfile.
- Written for the patch under review (it later merged; the kernel doc
  msg_zerocopy exists), but merge version not checked here.
