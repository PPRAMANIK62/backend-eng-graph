---
id: stenberg-curl-pipelining-2019
title: curl says bye bye to pipelining
author: Daniel Stenberg
url: https://daniel.haxx.se/blog/2019/04/06/curl-says-bye-bye-to-pipelining/
kind: blog
primary: true
---

## Summary

curl's lead developer explains, in 2019, why curl removed HTTP/1.1
pipelining: fragile code, hard to debug, and almost nobody else still
supported it. HTTP/2 multiplexing replaced it.

## Key claims

- What pipelining is. "HTTP/1.1 Pipelining is the protocol feature where the client sends off a second HTTP/1.1 request already before the answer to the previous request has arrived (completely) from the server." (post body)
- Timing-sensitive and hard to debug. "pipelining is fairly tricky to debug due to the timing sensitivity" (post body)
- Big browsers never turned it on by default. "HTTP pipelining was never enabled by default by the large desktop browsers due to all the issues with it, like broken server implementations and the likes." (post body)
- Firefox and Chrome dropped it. "Both Firefox and Chrome dropped pipelining support entirely since a long time back now." (post body)
- Pipelining's failure drove HTTP/2 multiplexing. "The bad state of HTTP pipelining was a primary driving factor behind HTTP/2 and its multiplexing feature." (post body)
- Disabled since curl 7.62.0, code removed in 7.65.0. "Starting with this commit, to be shipped in release 7.65.0, curl no longer has any code that supports HTTP/1.1 pipelining." (post body)
- Pipelining was already disabled in 7.62.0. "It has been disabled in the code since 7.62.0 already" (post body)
- curl turned multiplexing on by default in 7.62.0. "(curl enables multiplexing by default since 7.62.0.)" (post body)

## Visuals worth redrawing

None.

## My notes

- Comments under the post are readers', not Stenberg's; not used.
