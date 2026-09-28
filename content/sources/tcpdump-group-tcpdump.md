---
id: tcpdump-group-tcpdump
title: tcpdump(1) man page
author: The Tcpdump Group
url: https://www.tcpdump.org/manpages/tcpdump.1.html
kind: docs
primary: true
---

## Summary

The official tcpdump manual (the page documents the
5.0.0 development version; 4.99.x is the release line). What tcpdump
does, its options for saving and reading capture files, and how to read
its output, including the traps: kernel timestamps, checksum and
segmentation offload, dropped packets.

## Key claims

- What it does. "tcpdump prints out a description of the contents of packets on a network interface that match the Boolean expression" (DESCRIPTION)
- -w saves raw packets to a file for later; -r reads a file. "Write the raw packets to file rather than parsing and printing them out." (OPTIONS, -w) Files from other tools that write pcap or pcapng also work with -r. (OPTIONS, -r)
- Capturing may need privileges; reading a file doesn't. "Reading a saved packet file doesn't require special privileges." (DESCRIPTION)
- At the end it reports packets "dropped by kernel": "dropped, due to a lack of buffer space, by the packet capture mechanism in the OS" (DESCRIPTION)
- Default snapshot length is 262144 bytes; smaller snaplen truncates packets, larger costs processing and buffering. "Snarf snaplen bytes of data from each packet rather than the default of 262144 bytes." (OPTIONS, -s)
- Hardware checksum offload makes outgoing checksums look wrong. "This is useful for interfaces that perform some or all of those checksum calculation in hardware; otherwise, all outgoing TCP checksums will be flagged as bad." (OPTIONS, -K)
- Offloaded sends show up as oversized packets with length 0 in the IP header: "[was 0, presumed TSO] is reported" (OUTPUT FORMAT, IPv4 Packets)
- Timestamps are kernel time, not wire time. "The timestamp reflects the time the kernel applied a time stamp to the packet." (OUTPUT FORMAT, Timestamps)
- The lag between the card receiving a packet and the kernel stamping it is not accounted for. "No attempt is made to account for the time lag between when the network interface finished receiving the packet from the network and when the kernel applied a time stamp to the packet" (OUTPUT FORMAT, Timestamps)
- Snapshot size trades detail for buffering; larger snapshots can cause loss. "Note that taking larger snapshots both increases the amount of time it takes to process packets and, effectively, decreases the amount of packet buffering. This may cause packets to be lost." (OPTIONS, -s)
- TCP line format: "src > dst: Flags [tcpflags], seq data-seqno, ack ackno, win window, urg urgent, options [opts], length len"; flags S (SYN), F (FIN), P (PSH), R (RST), "." (ACK). (OUTPUT FORMAT, TCP Packets)
- The first line of the rlogin example, a SYN with an MSS option. "rtsg.1023 > csam.login: Flags [S], seq 768512:768512, win 4096, opts [mss 1024]" (OUTPUT FORMAT, TCP Packets)
- Example filters: "tcpdump -n 'port 8080'", "tcpdump -n 'host 192.0.2.1'", "tcpdump -n icmp", and SYN/FIN only: "tcpdump -n 'tcp[tcpflags] & (tcp-syn|tcp-fin) != 0'" (EXAMPLES)
- -n is advised to show addresses rather than names. "it's often best to pass -n to display IP addresses rather than hostnames" (EXAMPLES)
- Filter syntax is in pcap-filter(7). (DESCRIPTION)

## Visuals worth redrawing

- The rlogin handshake example ([S], [S.], [.]) as an annotated capture.

## My notes

- The man page quotes are from the development version; the release
  version's page may differ slightly.
