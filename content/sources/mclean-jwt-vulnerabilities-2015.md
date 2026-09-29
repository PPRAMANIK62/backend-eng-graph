---
id: mclean-jwt-vulnerabilities-2015
title: Critical vulnerabilities in JSON Web Token libraries
author: Tim McLean (guest post on the Auth0 blog)
url: https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/
kind: blog
primary: true
---

## Summary

The 2015 write-up by the researcher who found the two classic JWT
library bugs: accepting `alg: none` as verified, and verifying an HS256
token with the server's RSA public key as the HMAC secret. Explains how
a JWT is put together and why letting the token pick its own algorithm
is the root problem. Cited by RFC 8725 as [McLean].

## Key claims

- The finding. "I found many libraries with critical vulnerabilities allowing attackers to bypass the verification step." (intro)
- Three parts. "JWTs generally have three parts: a header, a payload, and a signature." (intro)
- The root problem: the header picks the algorithm before anything is verified. "in order to validate the token, we have to allow attackers to select which method we use to verify the signature." (Great. So, What's Wrong with That?)
- none as a valid signature. "Unfortunately, some libraries treated tokens signed with the none algorithm as a valid token with a verified signature." (Meet the "None" Algorithm)
- RSA/HMAC confusion. "If a server is expecting a token signed with RSA, but actually receives a token signed with HMAC, it will think the public key is actually an HMAC secret key." (RSA or HMAC?)
- Result. "End result? Anyone with knowledge of the public key can forge tokens that will pass verification." (RSA or HMAC?)
- Fix: the server says which algorithm it expects. "The server should already know what algorithm it uses to sign tokens, and it's not safe to allow attackers to provide this value." (Recommendations for Library Developers)
- Worked example: header {"alg":"HS256","typ":"JWT"}, payload {"loggedInAs":"admin","iat":1422779638}, key 'secretkey', giving the token ending gzSraSYS8EXBxLN_oWnFSRgCzcmJmMjLiuyu5CSpyHI. "HS256 indicates that this token is signed using HMAC-SHA256." (intro)
- The none algorithm is mandatory to implement. "Interestingly enough, it is one of only two algorithms that are mandatory to implement (the other being HS256)." (Meet the "None" Algorithm)

## Visuals worth redrawing

None.

## My notes

- The page shows a later re-publication date; the original is 2015 (the
  page's own update note is from that year).
