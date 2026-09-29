---
id: aws-ec2-imds
title: "Use the Instance Metadata Service to access instance metadata (Amazon EC2 User Guide)"
author: Amazon Web Services
url: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html
kind: docs
primary: true
---

## Summary

The EC2 user guide page on IMDSv1 and IMDSv2, current when opened: how
the v2 session token works, the headers, the limits, and the default
that both versions are accepted unless you require v2.

## Key claims

- Both versions work by default. "By default, you can use either IMDSv1 or IMDSv2, or both." (intro)
- You can require v2 per instance, and v1 calls then fail. "You can configure the Instance Metadata Service (IMDS) on each instance to only accept IMDSv2 calls, which will cause IMDSv1 calls to fail." (intro)
- A v2 session token lives from one second to six hours. "which can be a minimum of one second and a maximum of six hours." (How Instance Metadata Service Version 2 works)
- The token is fetched with `PUT http://169.254.169.254/latest/api/token` and sent back in the `X-aws-ec2-metadata-token` header. (Examples)
- When tokens are required, a missing or expired token gets a 401. "When token usage is set to required, requests without a valid token or with an expired token receive a 401 - Unauthorized HTTP error code." (How Instance Metadata Service Version 2 works)
- PUTs carrying X-Forwarded-For are rejected. "PUT requests are rejected if they contain an X-Forwarded-For header." (How Instance Metadata Service Version 2 works)
- The token response has an IP hop limit of 1 by default. "By default, the response to PUT requests has a response hop limit (time to live) of 1 at the IP protocol level." (How Instance Metadata Service Version 2 works)
- There's also an IPv6 address for IMDS on Nitro instances. "[fd00:ec2::254]" (How Instance Metadata Service Version 2 works, note)

## Visuals worth redrawing

None.

## My notes

- A separate page (configuring-IMDS-new-instances) describes an
  account-level default that makes new instances launch with v2
  required. Opened but not given a note; the article only says v2 can
  be required.
