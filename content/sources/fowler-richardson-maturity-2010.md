---
id: fowler-richardson-maturity-2010
title: Richardson Maturity Model
author: Martin Fowler
url: https://martinfowler.com/articles/richardsonMaturityModel.html
kind: blog
primary: false
---

## Summary

Fowler's 2010 walk through Leonard Richardson's model of steps toward
REST, using a doctor's-appointment example: level 0 tunnels RPC through
one endpoint, level 1 adds resources, level 2 uses HTTP methods and
status codes properly, level 3 adds hypermedia links.

## Key claims

- Level 0 uses HTTP as a tunnel for remote procedure calls. "Essentially what you are doing here is using HTTP as a tunneling mechanism for your own remote interaction mechanism, usually based on Remote Procedure Invocation." (Level 0)
- At level 0 even an error comes back as 200 with the failure in the body. (Level 0, example "HTTP/1.1 200 OK" with appointmentRequestFailure)
- Level 1 talks to individual resources instead of one endpoint. "So now rather than making all our requests to a singular service endpoint, we now start talking to individual resources." (Level 1)
- Level 2 uses the methods as HTTP defines them. "Level 2 moves away from this, using the HTTP verbs as closely as possible to how they are used in HTTP itself." (Level 2)
- GET being safe is what lets caches work. "An important consequence of this is that it allows any participant in the routing of requests to use caching" (Level 2)
- POST/PUT is not the same as create/update. "some people incorrectly make a correspondence between POST/PUT and create/update." (Level 2)
- Level 2 answers a successful booking with 201 and a Location, and a clash with 409 Conflict. "In this case a 409 seems a good choice to indicate that someone else has already updated the resource in an incompatible way." (Level 2)
- The Web itself rarely uses PUT or DELETE. "But the world-wide web doesn't use PUT or DELETE much in practice." (Level 2)
- What the Web really proves: the safe/unsafe split and status codes. "The key elements that are supported by the existence of the web are the strong separation between safe (eg GET) and non-safe operations, together with using status codes to help communicate the kinds of errors you run into." (Level 2)
- Level 3 links tell the client what it can do next. "The point of hypermedia controls is that they tell us what we can do next, and the URI of the resource we need to manipulate to do it." (Level 3)
- Links let the server change its URIs without breaking clients. "One obvious benefit of hypermedia controls is that it allows the server to change its URI scheme without breaking clients." (Level 3)
- No standard for representing hypermedia controls. "There's no absolute standard as to how to represent hypermedia controls." (Level 3)
- The levels aren't levels of REST; Fielding requires level 3. "Roy Fielding has made it clear that level 3 RMM is a pre-condition of REST." (The Meaning of the Levels)
- Level 0 messages can be any format, not just XML. "I'm using XML here for the example, but the content can actually be anything: JSON, YAML, key-value pairs, or any custom format." (Level 0)
- Links let the server advertise new features. "it allows the server team to advertise new capabilities by putting new links in the responses." (Level 3)
- At level 3 the booked appointment carries links to cancel it and to add tests. "<link rel = \"/linkrels/appointment/addTest\"" (Level 3, example response)
- Example requests used in the figure: level 0 posts to `/appointmentService`, level 1 to `/doctors/mjones` and `/slots/1234`, level 2 reads open slots with "GET /doctors/mjones/slots?date=20100104&status=open", level 3 links use the relation `/linkrels/slot/book`. (Levels 0 to 3, examples)

## Visuals worth redrawing

- Figure 1 "Steps toward REST": the three levels stacked. Redrawn in
  the rest article.

## My notes

- Secondary: Fowler explains Richardson's model; Richardson's own QCon
  talk wasn't opened.
