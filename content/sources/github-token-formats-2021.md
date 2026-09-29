---
id: github-token-formats-2021
title: Behind GitHub's new authentication token formats
author: Indigo K, GitHub
url: https://github.blog/engineering/platform-security/behind-githubs-new-authentication-token-formats/
kind: blog
primary: true
---

## Summary

GitHub's post (2021) on redesigning its tokens so leaked ones can be
found: a readable prefix per token type, an underscore separator, a
CRC32 checksum in the last six characters, and more entropy in the same
length.

## Key claims

- Old tokens were 40 hex characters that looked like SHA hashes. "Many of our old authentication token formats are hex-encoded 40 character strings that are indistinguishable from other encoded data like SHA hashes." (intro)
- Prefixes per token type. "We are including specific 3 letter prefixes to represent each token, starting with a company signifier, gh , and the first letter of the token type." (Identifiable prefixes)
- ghr_ is a refresh token. "ghr for refresh tokens" (Identifiable prefixes)
- The 178 bits come from 30 characters of an alphanumeric (Base62) alphabet, worked out on the page. "(0..9).to_a).length)/Math.log(2) * 30 = 178" (Token entropy)
- Old tokens made secret scanning hard. "inefficient or even inaccurate detection of compromised tokens for our secret scanning feature" (intro)
- ghp_ for personal access tokens, gho_ for OAuth tokens, ghr_ for refresh tokens. "ghp for GitHub personal access tokens gho for OAuth access tokens" (Identifiable prefixes)
- The underscore isn't a Base64 character, so random strings don't match. "An underscore is not a Base64 character which helps ensure that our tokens cannot be accidentally duplicated by randomly generated strings like SHAs." (Identifiable prefixes)
- Expected false positive rate from the prefix alone. "With this prefix alone, we anticipate the false positive rate for secret scanning will be down to 0.5%." (Identifiable prefixes)
- A checksum lets scanners reject fake tokens without a database lookup. "We can check the token input matches the checksum and eliminate fake tokens without having to hit our database." (Checksum)
- 32-bit CRC32 checksum in the last six characters, Base62. "A 32 bit checksum in the last 6 digits of each token strikes the optimal balance" (Checksum)
- Entropy went from 160 to 178 bits: 30 Base62 characters. "Our implementation for OAuth access tokens are now 178" (Token entropy)
- Same length as before. "all without changing the token length." (Token entropy)
- Other issuers are encouraged to do the same and join secret scanning. "we encourage you to follow the guidelines we outline here for your own tokens and join our secret scanning program" (What does this mean for you?)

## Visuals worth redrawing

- A token split into prefix, separator, random part and checksum (drawn
  from the text, no figure in the post).

## My notes

- 4 characters of prefix (ghp_) + 30 random + 6 checksum = 40, matching
  "without changing the token length" against the old 40-character
  tokens.
