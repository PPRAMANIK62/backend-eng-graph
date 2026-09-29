---
id: dns-rebinding
title: DNS rebinding
depth: short
phase: 15
note: >-
  A hostname that resolves to a safe address when it is checked and to a
  private one when it is used.
needs: [dns, same-origin-policy]
leads_to: []
compare_with: [ssrf, csrf, zero-trust]
---

# DNS rebinding

DNS rebinding is an attack where a hostname the attacker controls
resolves to one address when it's checked and to a different, private
one when it's used. In a browser, it lets a web page read from servers
on your internal network or on your own machine. On a server, it lets a
URL pass an [[ssrf|SSRF]] check and then connect somewhere internal.
Nothing in DNS gets hacked: the attacker just answers for their own
domain.

## The browser version, step by step

The [[same-origin-policy]] lets a script read responses only from its
own origin: the same scheme, host and port. The host part is a name,
not an address. So the policy is only as good as the answer [[dns]]
gives for that name, and the attacker owns the DNS server for their
name.

![Sequence diagram with four lanes: the attacker's DNS server, the attacker's web server, your browser, and a router admin page at 192.168.1.1. The browser and router sit inside your network, behind the firewall. The browser asks for attacker.example and gets 203.0.113.5 with a short TTL, then loads a page with a script from the attacker's server. The attacker changes the DNS record. The browser asks for attacker.example again and gets 192.168.1.1. It sends a request with Host: attacker.example to the router and gets the admin page back. Because the host name is the same, the browser treats it as the same origin, so the script may read the page, and it sends it out to the attacker's server.](img/dns-rebinding-sequence.svg)

*The name stays the same; the address behind it changes. Adapted from
Collin Jackson and others, "Protecting Browsers from DNS Rebinding
Attacks", figure 1 (2007).*

1. You visit `attacker.example`, maybe through an ad. The attacker's DNS
   server answers with their web server's address and a very short TTL.
2. The page comes with a script.
3. The attacker changes the DNS record. The name now points at
   `192.168.1.1`, your router, or `127.0.0.1`, your own machine.
4. The script sends a request to `attacker.example`. The old answer has
   expired, so the browser looks the name up again and connects to the
   internal address.
5. The host name hasn't changed, so the browser treats the response as
   same-origin and lets the script read it. The script sends it home.

The request comes from your browser, inside the firewall, so the
firewall doesn't help. No DNS server was compromised: every answer
was valid and authoritative for a domain the attacker owns. That's also
why DNSSEC doesn't help; the attacker can sign their own records.

The targets are anything protected only by being unreachable from
outside: router admin pages, intranet apps, tools on localhost.

## Why pinning didn't fix it

The classic browser defense was DNS pinning: once a name resolves, keep
using that address for a fixed time, whatever the TTL says. A 2007 study
found that the browsers of the day dropped their pins far too easily.
Internet Explorer 7 pinned for 30 minutes, but moved to another address
for the name within a second if the current one stopped answering, so
an attacker could publish two addresses and switch one off. Browser
plug-ins of that era resolved names on their own, so a pin in one place
didn't stop the other.

Pinning also breaks honest setups: a company name that's public outside
and private on the VPN looks exactly like a rebinding.

## The server-side version

The same trick works on your server. Your SSRF defense resolves a
user's URL, sees a public address and approves it. Then your HTTP client
resolves the name again to connect, and this time gets an internal one.
The fix is to check the address you actually dial: resolve once, check
that address, and connect to it. [[ssrf]] covers this with a diagram.

## What stops it now

**Browsers: Local Network Access.** Chrome 142 asks the user before a
public website may send requests to the local network or to loopback.
"Local" is decided by the address the name resolves to, such as the RFC
1918 private ranges, link-local addresses and `127.0.0.0/8`. The check
runs on the address the browser actually connects to, on every new
connection, which is what makes it hold up against rebinding. It replaces an earlier Chrome effort,
Private Network Access, which asked the device to opt in with a CORS
preflight and was put on hold.

**Servers: check the Host header.** A browser sends the name it thinks
it's talking to in `Host`. After a rebind, your internal service gets
requests with `Host: attacker.example`. Reject any request whose Host
isn't one of your own names.

**Resolvers: don't hand out private addresses for outside names.** A
resolver can refuse answers where a public name points at a private
address. That stops the firewall bypass, though not every abuse.

**Don't treat the network as a password.** Authenticate internal and
localhost services too, the idea behind [[zero-trust]].

## Where it gets tricky

**CORS isn't the defense.** A rebound request looks same-origin to the
browser, so cross-origin rules never come into it. For attacks that
only need to send a request, like changing a router setting with a
forged request ([[csrf]]), the attacker doesn't even need to read the
response, so a preflight never happens either.

**Local Network Access is a mitigation.** It isn't designed to fully
solve attacks on local web services; a router's admin page still has to
defend itself against CSRF. It's also a draft from a
community group, and Chromium so far only covers requests from public
sites to local ones, not between local addresses.

## What this means when you build

- Authenticate every internal and localhost service.
- On internal HTTP services, allow only your own names in `Host`.
- In code that fetches user-supplied URLs, check the address you
  connect to, not the one you looked up earlier.
- If you ship a device or a local app with a web UI, expect Local
  Network Access prompts, and don't treat them as your security.

## Further reading

- [Protecting Browsers from DNS Rebinding Attacks](https://crypto.stanford.edu/dns/dns-rebinding.pdf), Collin Jackson and others, Stanford, ACM CCS 2007. The attack in full, why pinning failed, and defenses at the resolver, server and browser.
- [Local Network Access](https://wicg.github.io/local-network-access/), Chris Thompson and Hubert Chao (editors), WICG draft. The permission model, and why the check must run on every connection.
- [New permission prompt for Local Network Access](https://developer.chrome.com/blog/local-network-access), Chris Thompson, Chrome, 2025. When Chrome ships it and which address ranges count as local.
- [Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), OWASP Cheat Sheet Series. The server-side version, where a name is resolved again after it was checked.
