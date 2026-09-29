---
id: aws-imdsv2-defense-in-depth-2019
title: "Add defense in depth against open firewalls, reverse proxies, and SSRF vulnerabilities with enhancements to the EC2 Instance Metadata Service"
author: Colm MacCárthaigh (AWS Security Blog)
url: https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/
kind: blog
primary: true
---

## Summary

AWS's announcement of IMDSv2 (2019), written by an AWS engineer. What
the instance metadata service is, and the four layers v2 adds: a PUT to
start a session, a secret token on every request, refusing requests
with X-Forwarded-For, and an IP TTL of 1 on the token response.

## Key claims

- IMDS lives at a link-local address reachable only from the instance, and hands out the instance role's credentials. "the IMDS runs on a special “link local” IP address of 169.254.169.254 that means only software running on the instance can access it." (intro)
- IMDS hands out temporary, rotated credentials. "The IMDS solved a big security headache for cloud users by providing access to temporary, frequently rotated credentials" (intro)
- Existing mitigations include restricting IAM roles and local firewall rules. "working seamlessly with existing mitigations such as restricting IAM roles and using local firewall rules to restrict access to the IMDS." (intro)
- It serves IAM role credentials. "The IMDS also makes the AWS credentials available for any IAM role that is attached to the instance." (intro)
- v2 sessions start with a PUT that returns a secret token. "The software starts a session with a simple HTTP PUT request to IMDSv2." (What's new in IMDSv2)
- The PUT requirement stops most open WAFs, which rarely pass PUT. "we’ve architected the IMDSv2 service to require a PUT request at the beginning of a session, which will prevent open WAFs from being abused to access the IMDS in the vast majority of cases." (Protecting against open Website Application Firewalls)
- Requests with X-Forwarded-For get no token, which stops open reverse proxies. "IMDSv2 will also not issue session tokens to any caller with an X-Forwarded-For header" (Protecting against open reverse proxies)
- A static header requirement fails when the SSRF lets attackers set headers. "AWS analysis found many SSRF vulnerabilities that allow attackers to set arbitrary headers because the SSRF vulnerability impacts the application’s own header processing." (Protecting against SSRF vulnerabilities)
- PUT plus a secret token beats a static header. "IMDSv2’s combination of beginning a session with a PUT request, and then requiring the secret session token in other requests, is always strictly more effective than requiring only a static header." (Protecting against SSRF vulnerabilities)
- AWS claims it covers most real SSRF bugs. "AWS analysis of real-world vulnerabilities found that this combination protects against the vast majority of SSRF vulnerabilities." (Protecting against SSRF vulnerabilities)
- The token response has IP TTL 1, so it dies if the instance forwards it. "This is accomplished by having the default Time To Live (TTL) on the low-level IP packets containing the secret token set to “1,” much lower than a typical value, such as “64.”" (Protecting against open layer 3 firewalls and NATs)
- At launch, v1 and v2 were both on by default; AWS recommends v2 only. "AWS recommends adopting v2 and restricting access to v2 only for added security." (Making the transition)
- A static header only helps when the bug lets the attacker control just the URL. "blocking SSRFs through static headers in instance metadata requests is effective only when the vulnerability merely allows the attacker to control the URL that is being requested" (Protecting against SSRF vulnerabilities)

## Visuals worth redrawing

None.

## My notes

- "Vast majority" is AWS's own analysis with no numbers published in the
  post. The article repeats it as AWS's claim, not as a measurement.
- Current defaults are in the EC2 user guide (aws-ec2-imds).
