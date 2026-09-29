---
id: fielding-hypertext-driven-2008
title: REST APIs must be hypertext-driven
author: Roy T. Fielding
url: https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven
kind: blog
primary: true
---

## Summary

A 2008 post in which the author of REST says that most "REST APIs" are
RPC, and lists the hypertext rules they break: fixed URL layouts,
typed resources, and clients that need out-of-band knowledge instead of
following links from a single entry URI.

## Key claims

- Many HTTP interfaces called REST are RPC. "I am getting frustrated by the number of people calling any HTTP-based interface a REST API." (intro)
- Without hypertext driving state, it isn't REST. "if the engine of application state (and hence the API) is not being driven by hypertext, then it cannot be RESTful and cannot be a REST API. Period." (intro)
- A REST API shouldn't depend on one protocol. "A REST API should not be dependent on any single communication protocol" (rule 1)
- The descriptive effort goes into media types, not into lists of URIs and methods. "A REST API should spend almost all of its descriptive effort in defining the media type(s) used for representing resources and driving application state" (rule 3)
- No fixed resource names or hierarchies; the server controls its namespace. "A REST API must not define fixed resource names or hierarchies (an obvious coupling of client and server). Servers must have the freedom to control their own namespace." (rule 4)
- Resource types shouldn't matter to the client. "A REST API should never have “typed” resources that are significant to the client." (rule 5)
- Enter with only a bookmark and standard media types; every transition comes from choices the server gave. "A REST API should be entered with no prior knowledge beyond the initial URI (bookmark) and set of standardized media types that are appropriate for the intended audience" (rule 6)
- If it doesn't follow these, call it something else. "Please try to adhere to them or choose some other buzzword for your API." (closing)
- Hypertext means information and controls presented together; machines can follow links too. "Hypertext does not need to be HTML on a browser. Machines can follow links when they understand the data format and relationship types." (comment 3, by Fielding)
- Browsers limiting themselves to HTML's methods are a workaround, not the protocol. "Workarounds for broken implementations (such as those browsers stupid enough to believe that HTML defines HTTP’s method set) should be defined separately" (rule 2)
- A REST API looks like hypertext: query results are lists of links, not arrays of objects. "Query results are represented by a list of links with summary information, not by arrays of object representations" (comment 5, by Fielding)

## Visuals worth redrawing

None.

## My notes

- The comments (51 of them) push back; only Fielding's own comments are
  used here.
