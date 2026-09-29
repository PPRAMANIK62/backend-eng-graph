---
id: go-blog-slog-2023
title: Structured Logging with slog
author: Jonathan Amsterdam (Go team)
url: https://go.dev/blog/slog
kind: blog
primary: true
---

## Summary

The Go blog post (2023) introducing `log/slog`, the structured logging
package added to the standard library in Go 1.21. It explains what
structured logs are, shows the same call printed by the text and JSON
handlers, and covers the design: a `Logger` front end over a pluggable
`Handler`, attributes added once with `With`, and a context argument so
handlers can pull out trace ids.

## Key claims

- slog arrived in Go 1.21. "The new log/slog package in Go 1.21 brings structured logging to the standard library." (intro)
- Structured logs are key-value pairs so machines can parse and filter them. "Structured logs use key-value pairs so they can be parsed, filtered, searched, and analyzed quickly and reliably." (intro)
- Logs are voluminous, so fast search and filter matter. "Logs therefore tend to be voluminous, and the ability to search and filter them quickly is essential." (intro)
- Key-value pairs go after the message. "we can easily add key-value pairs to our output by writing them after the message" (A tour of slog)
- The text handler writes key=value. "A TextHandler emits all log information in the form key=value." (A tour of slog)
- The JSON handler writes one JSON object per call. "Now our output is a sequence of JSON objects, one per logging call" (A tour of slog)
- Levels are integers. "In slog, levels are just integers, so you aren’t limited to the four named levels." (A tour of slog)
- A context argument lets a handler extract trace ids. "you can pass a context.Context to some log functions so a handler can extract context information like trace IDs." (A tour of slog)
- Logger.With adds attributes to every line from that logger. "You can call Logger.With to add attributes to a logger that will appear in all of its output" (A tour of slog)
- A LogValue method can redact sensitive data. "That can be used to log the fields of a struct as a group or redact sensitive data, among other things." (A tour of slog)
- Enabled lets a handler drop unwanted events early. "The Enabled method is called at the beginning of every log event, giving the handler a chance to drop unwanted log events quickly." (Performance)
- Most calls pass five or fewer attributes. "We found that over 95% of calls to logging methods pass five or fewer attributes." (Performance)
- The biggest speed gains came from avoiding allocation. "The greatest gains came from paying careful attention to memory allocation." (Performance)
- Alternating key-value syntax is easy to get wrong; a vet check catches common mistakes. "They found it hard to read and easy to get wrong by omitting a key or value." (The design process)
- The JSON handler example output has time, level and msg fields followed by the attributes. (A tour of slog, example output, not quoted because it contains a timestamp)
- Four named levels. "Besides Info, there are functions for three other levels—Debug, Warn, and Error" (A tour of slog)
- With-attributes are formatted once by the handler. "The WithAttrs and WithGroup methods let the handler format attributes added by Logger.With once, rather than at each logging call." (Performance)
- A vet check catches key-value mistakes. "We added a vet check to catch common mistakes, but did not change the design." (The design process)
- Typed attributes such as slog.Int and slog.String are the alternative some preferred. "They preferred explicit attributes for expressing structure:" (The design process)
- LogAttrs is the faster call for hot paths. "for frequently executed log statements it may be more efficient to use the Attr type and call the LogAttrs method." (A tour of slog)

## Visuals worth redrawing

None.

## My notes

- Example outputs on the page include timestamps; not copied here.
