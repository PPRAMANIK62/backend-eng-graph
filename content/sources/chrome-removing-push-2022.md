---
id: chrome-removing-push-2022
title: Remove HTTP/2 Server Push from Chrome
author: Barry Pollard, Chrome team
url: https://developer.chrome.com/blog/removing-push
kind: blog
primary: true
---

## Summary

The Chrome team's announcement (2022) that HTTP/2 server push would be
off by default from Chrome 106. Few sites used it, measured results
were mixed, and HTTP/3 clients and servers mostly never implemented it.
103 Early Hints and preload are the suggested replacements.

## Key claims

- Push disabled by default in Chrome 106. "support of HTTP/2 Server Push will be disabled by default in Chrome 106 and other Chromium-based browsers in their next releases." (intro)
- Few sites used it. "it was not used much with only 1.25% of HTTP/2 sites making use of this feature." (intro)
- Results were mixed, with regressions. "without a clear net performance gain and in many cases performance regressions." (intro)
- Many HTTP/3 implementations never had push. "Push was not implemented in many HTTP/3 servers and clients—even though it was included in the specification." (intro)
- Usage later fell further. "we see that 1.25% HTTP/2 support by sites dropped to 0.7%." (intro)
- 103 Early Hints leaves the browser in charge. "Rather than the server pushing resources, 103 Early Hints sends only hints to the browser of resources that it may benefit from requesting immediately." (intro)

## Visuals worth redrawing

None.

## My notes

- Push stays in RFC 9113 and RFC 9114; this is a browser decision, not a spec change.
