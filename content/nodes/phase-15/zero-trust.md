---
id: zero-trust
title: Zero trust
depth: short
phase: 15
note: >-
  No trusted network: every call proves who it's from.
needs: [mtls]
leads_to: [service-mesh]
compare_with: [dns-rebinding]
---

# Zero trust

Zero trust means no request is trusted because of where it comes from.
Being on the office network or inside the production network proves
nothing. Every call has to show who sent it, a user, a service or a
device, and is checked against a policy for the one thing it's trying
to reach. It matters because in a network where "inside" means
"trusted", one compromised machine can reach everything.

## The castle and the moat

The older model is perimeter security. A firewall guards the edge;
anything outside is dangerous, anything inside is trusted. It works as
long as the edge holds. Once an attacker gets one machine inside,
through a phished laptop or a vulnerable server, the internal network
gives them easy access to everything else, and the firewall does
little against attacks that start inside.

The perimeter also got hard to draw. People work from home and from
cafés, on their own devices, and services run in clouds the company
doesn't own. Google drew the conclusion in its BeyondCorp paper
(2014): assume your internal network is as dangerous as the public
internet, and build your applications for that.

![Two panels. Left, a trusted network: a dashed firewall boundary around payments, orders and a users database; a compromised host inside it has arrows to all three. Right, zero trust: each service has a check in front of it; the compromised host, holding the identity "reports", is refused at payments and orders and reaches only the users database, which that identity is allowed to read.](img/zero-trust-perimeter-vs-per-request.svg)

*Trust from location versus trust from identity, checked per request.*

## Every call proves who it's from

Take two services: `orders` calls `payments` to charge a card. In the
perimeter model, `payments` accepts any connection from an internal
address range. Under zero trust, three things change.

**The caller proves its identity.** The connection uses
[[mtls|mutual TLS]], and `orders` presents a certificate naming it as a
service. The identity belongs to the service, not to a host name or an
IP address, so it still works when the service moves between machines.
Google's internal version of this (ALTS) binds identities to services
in exactly this way.

**Each request is authorized.** `payments` checks a policy: may
`orders` call this endpoint? Access is as narrow as the job needs, and
being allowed to call one service gives no access to another. Where
the decision is made is called the policy decision point; where it's
enforced, the policy enforcement point. The aim is to put enforcement
as close to the resource as possible, so the zone of implicit trust
behind it is as small as possible, ideally one service. Writing those
policies is its own topic, [[authorization-models]].

**The user travels with the request.** When `orders` acts for a
customer, knowing that `orders` is calling isn't enough to decide
whether that customer's data may be read. Google's services pass an
integrity-protected end-user ticket along the whole call chain. Every service on the
path checks the caller's identity, checks the ticket, and checks that
the user may see the data; if any check fails, the request is denied.

The same idea works for people. In BeyondCorp, every internal app sits
behind an access proxy on the internet. For every request, the proxy
checks the user (single sign-on with a [[mfa|second factor]]) and the device (a
certificate tied to an inventory record), and there's no VPN at all.

## Where it gets tricky

**Zero trust doesn't mean no firewall.** Google still keeps a
protected edge in front of its production services, mainly against
denial-of-service attacks. What goes away is trust based on the
network, not the network defences themselves.

**Stolen credentials still work.** An attacker with a valid identity
can reach whatever that identity is allowed to reach. Zero trust stops
them moving sideways to everything else, which is why least privilege
per identity matters so much. The figure's compromised host still reads
the users database.

**The policy system becomes the crown jewel.** If an attacker, or a bad
config change, alters the policy engine's rules, access opens up
everywhere at once. And if the policy engine or the enforcement points
can't be reached, nothing can talk to anything. They need the
availability of your most critical service, and every change to them
logged and audited.

**It's a direction, not a product.** The term covers an evolving set
of ideas, not one thing you install. Nobody switches over in one
step: NIST expects most organizations to run a mix of perimeter and
zero trust for a long time, moving one business process at a time.

## What this means when you build

- Give every service its own identity and authenticate every
  connection with mTLS.
- Authorize every request on that identity, per endpoint, and deny by
  default. An internal IP address is not a credential.
- When a service acts for a user, forward the user's identity in a
  signed token and check it at every hop, not just at the edge.
- A [[service-mesh]] can move this plumbing (connections between
  services, policies, monitoring) out of each app into shared
  infrastructure. You still have to write the policies.
- Run the identity and policy systems as critical infrastructure:
  replicated, monitored, and with every change audited.

## Further reading

- [SP 800-207: Zero Trust Architecture](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf), Scott Rose, Oliver Borchert, Stu Mitchell, Sean Connelly, NIST, 2020. The standard definition: tenets, decision and enforcement points, the threats to a zero trust design, and migration.
- [BeyondProd](https://cloud.google.com/docs/security/beyondprod), Google Cloud, 2024 version. Zero trust between production services: service identities, end-user tickets passed along call chains, and checks at every hop.
- [BeyondCorp: A New Approach to Enterprise Security](https://research.google/pubs/beyondcorp-a-new-approach-to-enterprise-security/), Rory Ward and Betsy Beyer, ;login:, 2014. Where the idea became practice: Google moving its internal apps off the trusted network and behind an access proxy.
