---
id: python-threading
title: threading, Thread-based parallelism (Python documentation)
author: Python Software Foundation
url: https://docs.python.org/3/library/threading.html
kind: docs
primary: true
---

## Summary

The Python standard library docs for `threading`, read at Python 3.14.7.
The top of the page states plainly that in CPython threads help with
I/O-bound work but not CPU-bound work, because of the global
interpreter lock, and that free-threaded builds since 3.13 can drop it.

## Key claims

- In CPython only one thread runs Python code at once. "In CPython, due to the Global Interpreter Lock, only one thread can execute Python code at once (even though certain performance-oriented libraries might overcome this limitation)." (CPython implementation detail)
- For multi-core use, processes. "you are advised to use multiprocessing or concurrent.futures.ProcessPoolExecutor." (CPython implementation detail)
- Threads still fit I/O-bound work. "However, threading is still an appropriate model if you want to run multiple I/O-bound tasks simultaneously." (CPython implementation detail)
- The GIL limits threads for CPU-bound tasks. "the GIL limits the performance gains of threading when it comes to CPU-bound tasks, as only one thread can execute Python bytecode at a time." (GIL and performance considerations)
- Python 3.13 free-threaded builds can turn the GIL off, not by default. "As of Python 3.13, free-threaded builds can disable the GIL, enabling true parallel execution of threads, but this feature is not available by default (see PEP 703)." (GIL and performance considerations)

## Visuals worth redrawing

None.

## My notes

- The CPU vs I/O distinction written into a language's own docs: the
  right tool (threads or processes) depends on it.
