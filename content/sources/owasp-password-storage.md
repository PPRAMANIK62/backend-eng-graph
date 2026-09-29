---
id: owasp-password-storage
title: Password Storage Cheat Sheet
author: OWASP Cheat Sheet Series contributors
url: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's guide to storing passwords: hash rather than encrypt, how
cracking works, salts, peppers, work factors and how to raise them, the
recommended algorithms (Argon2id, scrypt, bcrypt, PBKDF2) with concrete
minimum parameters, and how to migrate old hashes.

## Key claims

- Fast hashes are wrong for passwords. "Fast hashing algorithms such as SHA‑256 are not suitable for password storage because they allow attackers to perform large numbers of guesses quickly." (Introduction)
- Argon2id minimum. "Use Argon2id with a minimum configuration of 19 MiB of memory, an iteration count of 2, and 1 degree of parallelism." (Introduction)
- scrypt fallback. "If Argon2id is not available, use scrypt with a minimum CPU/memory cost parameter of (2^17), a minimum block size of 8 (1024 bytes), and a parallelization parameter of 1." (Introduction)
- bcrypt for legacy. "For legacy systems using bcrypt, use a work factor of 10 or more and with a password limit of 72 bytes." (Introduction)
- PBKDF2 for FIPS. "If FIPS-140 compliance is required, use PBKDF2 with a work factor of 600,000 or more and set with an internal hash function of HMAC-SHA-256." (Introduction)
- Hash, don't encrypt: encryption can be reversed. "Since encryption is a two-way function, attackers can retrieve the original plaintext from the encrypted data." (Hashing vs Encryption)
- Cracking is guessing: pick a candidate, hash it, compare. "Comparing the hash you calculated to the hash of the victim." (When Password Hashes Can Be Cracked)
- Candidate lists come from other breaches, brute force and wordlists. "Lists of passwords obtained from other compromised sites" (When Password Hashes Can Be Cracked)
- GPUs and rented servers make cracking cheap. "with high speed hardware (such as GPUs) and cloud services with many servers for rent, the cost to an attacker is relatively small" (When Password Hashes Can Be Cracked)
- A unique salt forces the attacker to crack hashes one at a time. "an attacker has to crack hashes one at a time using the respective salt rather than calculating a hash once and comparing it against every stored hash." (Salting)
- Salts defeat precomputed tables and hide shared passwords. "salting means that it is impossible to determine whether two users have the same password without cracking the hashes" (Salting)
- Libraries usually handle salts. "most widely used implementations and libraries automatically generate and manage salts internally" (Salting)
- A pepper protects against a database-only leak. "It prevents an attacker from being able to crack any of the hashes if they only have access to the database" (Peppering)
- A leaked pepper forces everyone to reset. "Therefore changing a pepper will require forcing all users whose passwords were protected by the previous pepper to reset their passwords." (Common requirements for peppering strategies)
- A pepper alone adds nothing. "Consider using a pepper to provide additional defense in depth (though alone, it provides no additional secure characteristics)." (Introduction)
- The work factor is stored in the hash output. "The work factor is typically stored in the hash output." (Using Work Factors)
- Too high a work factor enables DoS. "If the work factor is too high, the performance of the application may be degraded, which could be used by an attacker to carry out a denial of service attack by exhausting the server's CPU with a large number of login attempts." (Using Work Factors)
- Rule of thumb for time. "As a general rule, calculating a hash should take less than one second." (Using Work Factors)
- Upgrade on next login. "The most common approach to upgrading the work factor is to wait until the user next authenticates, then re-hash their password with the new work factor." (Upgrading the Work Factor)
- Argon2 won the Password Hashing Competition; use Argon2id. "Argon2 was the winner of the 2015 Password Hashing Competition." (Argon2id)
- Equivalent Argon2id settings trade memory for iterations: m=47104 (46 MiB) t=1, m=19456 (19 MiB) t=2, m=12288 (12 MiB) t=3, m=9216 (9 MiB) t=4, m=7168 (7 MiB) t=5, all p=1. "These configuration settings provide an equal level of defense, and the only difference is a trade off between CPU and RAM usage." (Argon2id)
- bcrypt only for legacy now. "The bcrypt password hashing function should only be used for password storage in legacy systems where Argon2 and scrypt are not available." (bcrypt)
- bcrypt's 72-byte limit. "bcrypt has a maximum length input length of 72 bytes for most implementations" (Input Limits of bcrypt)
- Pre-hashing for bcrypt is risky (null bytes, password shucking). "This can be dangerous because of null bytes in the hash output value and because of password shucking." (Pre-Hashing Passwords with bcrypt)
- It's fine to say which algorithm you use. "You do not need to hide which password hashing algorithm is used by an application." (Password Hashing Algorithms)
- Legacy hashes can be wrapped: md5 becomes bcrypt(md5). "this could be easily upgraded to bcrypt(md5($password))." (Upgrade Method Two)
- Store algorithm and parameters with the hash, e.g. PHC string format. "for example, the modular PHC string format." (Upgrading Legacy Hashes)
- Salting makes cost grow with the number of hashes. "This makes cracking large numbers of hashes significantly harder, as the time required grows in direct proportion to the number of hashes." (Salting)
- Slow, memory-hard algorithms raise the cost of brute force. "Using slow, memory‑hard algorithms makes brute‑force attacks significantly more difficult, expensive, and time‑consuming." (Introduction)
- Original bcrypt stops at a null byte. "The original bcrypt expects a null terminated password string, this means that the hash value will only be used to the first null byte in the hash value." (Pre-Hashing Passwords with bcrypt)
- Pre-hash recipe if you must. "if bcrypt has to be used and the password should to be pre-hashed you should do bcrypt(base64(hmac-sha384(data:$password, key:$pepper)), $salt, $cost) and store the pepper not in the database." (Pre-Hashing Passwords with bcrypt)
- Post-hashing pepper is an HMAC over the hash. "The resulting password hash is then hashed again using an HMAC (e.g., HMAC-SHA256, HMAC-SHA512, depending on the desired output length) before storing the resulting hash in the database." (Post-hashing peppers)
- Peppers belong in vaults or HSMs. "Peppers are secrets and should be stored in "secrets vaults" or HSMs (Hardware Security Modules)." (Common requirements for peppering strategies)
- PBKDF2 when FIPS is needed. "Since PBKDF2 is permitted by NIST SP 800-63B-4 and has FIPS-140 validated implementations, it should be the preferred algorithm when these are required." (PBKDF2)
- Salts defeat rainbow tables. "Salting also protects against an attacker's pre-computing hashes using rainbow tables or database-based lookups." (Salting)
- scrypt settings with their memory sizes. "N=2^17 (128 MiB), r=8 (1024 bytes), p=1" (scrypt)
- Wrapped legacy hashes get replaced at next login. "These hashes should be replaced with direct hashes of the users' passwords next time the user logs in." (Upgrade Method Two)
- Users who never log back in keep old hashes; expire them. "Expire and delete the password hashes of users who have been inactive for an extended period and require them to reset their passwords to login again." (Upgrade Method One)
- Password shucking. "If the inner hash function H is used with the same password somewhere else and known to an attacker cracking the password can be reduced to breaking the hash function H" (Pre-Hashing Passwords with bcrypt)

## Visuals worth redrawing

None.

## My notes

- The PBKDF2 numbers are pinned in the page to a GPU test on RTX 4000
  cards; the page doesn't give the same basis for the Argon2id numbers.
