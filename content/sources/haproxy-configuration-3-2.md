---
id: haproxy-configuration-3-2
title: HAProxy Configuration Manual, version 3.2
author: HAProxy Technologies and contributors
url: https://docs.haproxy.org/3.2/configuration.html
kind: docs
primary: true
---

## Summary

The HAProxy 3.2 configuration reference (page showed 3.2.25). Used for
the `balance` algorithms and the server health check settings.

## Key claims

- `roundrobin`: servers in turn by weight; dynamic weights; limited to 4095 active servers per backend. "Each server is used in turns, according to their weights." (balance, roundrobin)
- Round robin is fairest when processing time is even. "This is the smoothest and fairest algorithm when the server's processing time remains equally distributed." (balance, roundrobin)
- Round robin is the default. "The load balancing algorithm of a backend is set to roundrobin when no other algorithm, mode nor option have been set." (balance)
- `leastconn`: fewest connections wins, round robin among ties; for long sessions, not short HTTP ones. "Use of this algorithm is recommended where very long sessions are expected, such as LDAP, SQL, TSE, etc... but is not very well suited for protocols using short sessions such as HTTP." (balance, leastconn)
- It counts queued connections too. "It will also consider the number of queued connections in addition to the established ones in order to minimize queuing." (balance, leastconn)
- `source`: hash of the client IP; when the number of servers changes, many clients move. "If the hash result changes due to the number of running servers changing, many clients will be directed to a different server." (balance, source)
- `random(<draws>)`: pick the least loaded of N random draws; default 2; named after the power of two choices. "The default value is 2, which generally shows very good distribution and performance." (balance, random)
- Random avoids hammering new servers. "Random load balancing can be useful with large farms or when servers are frequently added or removed as it may avoid the hammering effect that could result from roundrobin or leastconn in this situation." (balance, random)
- More draws converge on leastconn, slower. "With very high values, the algorithm will converge towards the leastconn's result but much slower." (balance, random)
- Health check interval defaults to 2000 ms. "If left unspecified, the delay defaults to 2000 ms." (inter)
- A server is up after `rise` consecutive successes (default 2). "This value defaults to 2 if unspecified." (rise)
- A server is down after `fall` consecutive failures (default 3). "This value defaults to 3 if unspecified." (fall)
- Checks are spread in time to avoid resonance. "In order to reduce "resonance" effects when multiple servers are hosted on the same hardware, the agent and health checks of all servers are started with a small time offset between them." (inter)
- `observe layer4|layer7` adjusts health from real traffic: connection success at layer 4, HTTP responses at layer 7. "In layer4 mode, only successful/unsuccessful tcp connections are significant." (observe)
- `slowstart`: a server coming back up ramps from 0 to 100% over the given time. "The speed grows linearly from 0 to 100% during this time." (slowstart)

## Visuals worth redrawing

None.

## My notes

- The random algorithm's text links Mitzenmacher's handbook chapter,
  not the 2001 paper.
