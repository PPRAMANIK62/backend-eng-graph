---
id: google-aip-136
title: "AIP-136: Custom methods"
author: Google API Improvement Proposals (AIP) authors
url: https://google.aip.dev/136
kind: docs
primary: true
---

## Summary

When and how Google APIs add a method that isn't Get, List, Create,
Update or Delete: a verb-noun name, GET or POST, and the verb after a
colon in the URL (`:archive`).

## Key claims

- Custom methods are for actions the standard methods can't express. "Custom methods should only be used for functionality that can not be easily expressed via standard methods; prefer standard methods if possible, due to their consistent semantics." (Guidance)
- Don't bend the standard methods to fit. "it is not a good idea to contort things to endeavor to make the standard methods \"sort of work\"." (Guidance)
- Example: archiving a book. "post: \"/v1/{name=publishers/*/books/*}:archive\"" (Guidance, example)
- Names are a verb then a noun, with no prepositions. "The name must not contain prepositions (\"for\", \"with\", etc.)." (Guidance)
- GET for reads, POST for anything with side effects. "POST must be used if the method has side effects or mutates resources or data." (Guidance)
- The URL uses a colon then the custom verb. "The HTTP URI must use a : character followed by the custom verb (:archive in the above example)" (Guidance)
- Custom methods can act on a collection too. "post: \"/v1/{parent=publishers/*}/books:sort\"" (Collection-based custom methods)
- A preposition usually means a field belongs on an existing method. "if there is desire for a property-specific look-up method, instead of GetBookByAuthor consider a SearchBooks with an author field as a search dimension." (Rationale, Disallowing prepositions)
- Why: avoid an explosion of narrow methods. "This helps prevent an explosion of hyper-focused methods that bloat API and client surfaces" (Rationale, Disallowing prepositions)
- Separating GET and POST tells callers which methods are safe to call. "clearly indicate to a user which methods can be called without risk of runtime impact." (Rationale, HTTP methods)
- Stateless custom methods exist too, e.g. translating text. "rpc TranslateText(TranslateTextRequest) returns (TranslateTextResponse)" (Stateless methods)
- The HTTP mapping comes from gRPC transcoding annotations. "See HTTP and gRPC Transcoding for more information." (Guidance)
- A preposition can also mean the method needs its own verb: CreateBookFromDictation should be TranscribeBook. "if a CreateBook message already exists and you are considering adding CreateBookFromDictation, consider a TranscribeBook method instead." (Rationale, Disallowing prepositions)

## Visuals worth redrawing

None.

## My notes

- Microsoft's Azure guidelines use the same colon convention
  (`users/Bob:grant`).
