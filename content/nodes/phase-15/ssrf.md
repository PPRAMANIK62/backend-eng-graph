---
id: ssrf
title: Server-side request forgery
depth: deep
phase: 15
note: >-
  Tricking the server into calling internal addresses for you.
needs: [http-semantics, dns, webhooks, owasp-api-top-10]
leads_to: [egress-proxy]
compare_with: [dns-rebinding, jwt, csrf]
---

# Server-side request forgery

Server-side request forgery (SSRF) is when your server fetches a URL
that a user gave it, and the user points it somewhere only your server
can reach: an admin page on localhost, a service on the internal
network, or the cloud metadata endpoint that hands out credentials. The
features that invite it are everywhere (image-by-URL, link previews,
[[webhooks]], single sign-on callbacks), and it's number 7 on the
[[owasp-api-top-10|OWASP API Top 10]].

## A profile picture that reads your credentials

Say your API lets users set a profile picture from a URL:

```http
POST /profile/picture
Content-Type: application/json

{"url": "https://example.com/me.jpg"}
```

The server makes an [[http-semantics|HTTP]] GET to that URL, and if the
image is broken it helpfully shows the user what came back. Now an
attacker sends this instead, while your service runs on an EC2 instance:

```json
{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role"}
```

`169.254.169.254` is a link-local address that only software on the
instance can reach, and it's where AWS's instance metadata service
(IMDS) lives. With the old version of that service, a plain GET to this
path returns temporary AWS credentials for the instance's IAM role. Your
server fetches them and shows them to the attacker.

![The attacker on the internet sends one request to the public API, naming a URL. The API server, inside the network boundary, makes the request the attacker named. From there it can reach things the attacker can't: an admin page on localhost, an internal service on a private address, and the metadata service at 169.254.169.254 that returns cloud credentials. The firewall only sees traffic from inside going to inside.](img/ssrf-flow.svg)

*The attacker can't reach anything behind the boundary. Your server can, and it does what the URL says. Flow adapted from OWASP's SSRF Prevention Cheat Sheet.*

The firewall doesn't help. The request doesn't come from the internet;
it comes from your own server, which the network trusts.

## Why your server makes such a good proxy

Three kinds of targets make SSRF worse than it sounds.

**Localhost.** Some apps give more power to requests from the machine
itself: an admin interface on another port, a recovery login that skips
authentication for local users, or an access check done by a
[[reverse-proxy]] in front that a request to `127.0.0.1` never passes
through.

**Internal services.** Systems on private addresses are often protected
mostly by being unreachable, so they tend to have weaker checks of their
own, or none.

**Control planes.** Cloud providers, Kubernetes and Docker expose
management and control channels over HTTP, on well-known paths. The
metadata service above is the classic one.

It isn't limited to HTTP, either. If the fetching library understands
other schemes, `file://`, `gopher://` or `dict://` URLs can reach local
files or speak other protocols.

**Blind SSRF** is the version where the response never comes back to
the attacker. It's harder to use, but not harmless. The request still
runs, so it can hit an internal endpoint that changes something, and
response times alone reveal which internal ports are open, so the
attacker can map your network one request at a time.

URLs also hide in places you don't think of as input: an XML document
whose parser fetches external entities, or a `Referer` header that an
analytics tool later visits.

## Why checking the URL is harder than it looks

The obvious fix is to reject URLs pointing at `localhost`,
`127.0.0.1` or `169.254.169.254`. Almost every step of that check can
be sidestepped.

- **Other spellings of the same address.** `2130706433`,
  `017700000001` and `127.1` all mean 127.0.0.1 to many parsers. So can
  URL-encoded or mixed forms.
- **A name instead of a number.** The attacker registers a domain that
  resolves to `127.0.0.1` or `10.0.0.5`. Your string check sees a
  harmless name.
- **Redirects.** The URL passes the check, then answers with a redirect
  to an internal address, and your HTTP client follows it. An open
  redirect on a host you allow does the same.
- **Parsers disagree.** `https://allowed.example@evil.example/`,
  `https://evil.example#allowed.example` and
  `https://allowed.example.evil.example/` fool naive "does it contain
  or start with my host" checks. Worse, two correct-looking parsers can
  read different hosts from one string: `http://example.com\@evil.com`
  is `example.com` to a parser following the WHATWG URL Standard and
  `evil.com` to Python's `urllib.parse`. If your validator uses one
  and your HTTP client the other, the check passes and the request goes
  elsewhere.
- **The name changes between check and use.** Suppose you resolve the
  host with [[dns]], see a public address, and approve it. Then your
  HTTP client resolves the name again to connect. The attacker's DNS
  server can answer the first lookup with a public address and the
  second with an internal one. OWASP's SSRF cheat sheet lists this as the
  [[dns-rebinding|DNS pinning]] bypass.

![Timeline of one fetch. The validator looks up evil.example and gets a public address, and approves it. A moment later the HTTP client looks up evil.example again to connect, and this time gets 127.0.0.1, so it connects to localhost. The fix shown underneath: resolve once, check that address, and connect to that same address.](img/ssrf-dns-rebinding.svg)

*Check one address, connect to another. Doing the check where you dial closes the gap.*

## Defenses that hold up

How you defend depends on whether you know the destinations in advance.

**Known destinations: allow-list.** If your service only ever needs to
call a partner's API or a handful of image hosts, don't accept URLs at
all. Accept an identifier, look up the host in your own list, and build
the request yourself with a scheme, port and path you choose. Don't
carry the rest of the user's URL across.

**Any destination: block, at the moment you connect.** Webhooks and
link previews must reach arbitrary public hosts, so an allow-list is
impossible and you're left with a block-list. Make it as strong as it
can be:

- Allow only `http` and `https`, and only the ports you need.
- Resolve the name yourself and check every address it returns, both
  IPv4 (A) and IPv6 (AAAA), after parsing it into a real IP.
- Reject loopback (`127.0.0.0/8`, `::1`), `0.0.0.0/8`, the private
  ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local
  addresses including the metadata endpoints, and multicast. See
  [[ip-addressing]] for what these ranges are.
- Connect to the address you checked, so there's no second lookup to
  win. The simplest way is to do the check inside the code that opens
  the connection, not in a validator that runs earlier.
- Turn off automatic redirects, or run every hop through the same
  check.
- Don't return the raw fetched response to the user unless the
  feature needs it.

**Put it in one place: an egress proxy.** Stripe sends most of its
outbound traffic, webhooks included, through Smokescreen, a proxy that
resolves every requested name itself and allows only publicly routable
addresses. One tested implementation beats a check in every service;
see [[egress-proxy]].

**Firewall the fetcher.** Run the code that fetches user URLs where
its network can't reach internal systems at all. If the check fails,
the network still says no.

## The metadata service fights back

Because metadata credentials are the prize, AWS added IMDSv2 in 2019.
Instead of a plain GET, a caller first sends a `PUT` to
`/latest/api/token` to get a session token, then sends that token in an
`X-aws-ec2-metadata-token` header on every request. Without a valid
token, the service answers 401 once tokens are required.

That shape stops a lot of SSRF on its own. Some SSRF bugs only let the
attacker choose the URL. They can't also send a PUT, read the
token from the answer and send it back in a header. Two more layers cover other mistakes: the service
refuses a token request that carries `X-Forwarded-For`, which an open
reverse proxy would add (see [[client-ip-forwarding]]), and the
token response goes out with an IP TTL of 1, so it dies if a
misconfigured instance tries to route it onward.

AWS's own analysis of real vulnerabilities found that this combination
protects against the vast majority of SSRF bugs, though the
announcement gives no numbers. By default an instance still accepts both versions, so you have
to require v2. And keep the instance role's permissions small, because
IMDSv2 is a layer, not a cure.

## Where it gets tricky

**Some SSRF bugs let attackers set headers.** A defense that only asks
for a fixed header fails when the bug lets the attacker control headers
too. That's why IMDSv2 uses a
per-session secret obtained with a PUT, not a static header.

**Block-lists leak.** Every guide prefers allow-lists and calls
block-lists a last resort. For webhooks you have no choice, so the block
has to be enforced at connect time and cover IPv6. AWS's metadata
service, for example, also answers on the IPv6 address `fd00:ec2::254`
on Nitro instances, which a list containing only `169.254.169.254`
misses.

**A hostname deny-list isn't a destination deny-list.** Blocking a
metadata hostname does nothing if the attacker uses the IP
behind it, or another name for the same IP. Check addresses, not names.

**You can't always remove it.** A feature whose job is to fetch
arbitrary URLs will always be an SSRF risk. The aim is to make the
fetcher unable to reach anything valuable, and to keep what it can
reach from being worth much.

## What this means when you build

- List every place your system fetches a URL that came from outside:
  webhooks, previews, imports, SSO, XML parsers.
- Send those fetches through one egress path, a proxy or a shared
  client, that resolves, checks every address, and connects to the
  checked address, with redirects off.
- Prefer allow-lists. Never accept a whole URL where a host ID would do.
- On AWS, require IMDSv2 and keep instance roles small.
- Test your fetcher with the bypass list above: other IP spellings,
  names that resolve inward, redirects, `@` and `#` tricks, IPv6.

## Further reading

- [API7:2023 Server Side Request Forgery](https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/), OWASP API Security Project, 2023. What makes SSRF common and dangerous in modern APIs, with the webhook-to-metadata example.
- [Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), OWASP Cheat Sheet Series. The allow-list and block-list cases in detail, DNS pitfalls, parser disagreement and a minimum deny-list.
- [Server-side request forgery (SSRF)](https://portswigger.net/web-security/ssrf), PortSwigger Web Security Academy. The attacker's view: localhost trust, internal targets, filter bypasses and blind SSRF.
- [Add defense in depth against open firewalls, reverse proxies, and SSRF vulnerabilities with enhancements to the EC2 Instance Metadata Service](https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/), Colm MacCárthaigh, AWS, 2019. Why IMDSv2 is shaped the way it is, layer by layer.
- [Use the Instance Metadata Service to access instance metadata](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html), Amazon EC2 User Guide. How the v2 token works and the current defaults.
- [Smokescreen](https://github.com/stripe/smokescreen), Stripe. An egress proxy that resolves and checks destinations for a company's outbound traffic.
