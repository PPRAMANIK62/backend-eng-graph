---
id: cloudflare-graceful-upgrades-go-2018
title: Graceful upgrades in Go
author: Lorenz Bauer, Cloudflare
url: https://blog.cloudflare.com/graceful-upgrades-in-go/
kind: blog
primary: true
---

## Summary

Cloudflare's tour (2018) of ways to replace a running server's code and
config without refusing a single connection: plain exec, SO_REUSEPORT,
passing sockets over a UNIX socket, and NGINX's fork-and-exec of a new
master that inherits the listeners. Ends with their Go library,
tableflip, which copies the NGINX approach.

## Key claims

- A graceful upgrade swaps code and config while running, unnoticed. "The idea behind graceful upgrades is to swap out the configuration and code of a process while it is running, without anyone noticing it." (intro)
- Two ways a client gets refused: no listening socket, or nobody calling accept. "A new client will be refused if the OS doesn’t know of a listening socket for port 80, or nothing is calling Accept() on it." (The basics)
- Plain exec can't be undone if the new config is broken. "Unfortunately this has a fatal flaw since we can’t “undo” the exec." (Just Exec())
- While the new binary starts up, the listen queue can overflow. "This means the backlog of new connections grows until some are dropped." (Just Exec())
- SO_REUSEPORT makes a separate socket, not another fd to the same one. "It creates a separate socket structure if you bind using SO_REUSEPORT, not just another file descriptor." (Listen() all the things)
- So connections waiting on the old socket get killed when it goes. "This leads to an unavoidable race condition: new-but-not-yet-accepted connections on the socket used by the old process will be orphaned and terminated by the kernel." (Listen() all the things)
- NGINX keeps listen sockets open across exec by clearing FD_CLOEXEC and passing fd numbers in an environment variable. "The primary then does the customary fork() / exec() dance to spawn the workers, passing the file descriptor numbers as an environment variable." (NGINX: share sockets via fork and exec)
- NGINX refuses a second upgrade while one is in progress. "This is very sensible, there is no good reason why there should be more than two processes at any given point in time." (NGINX: share sockets via fork and exec)
- The wishlist: no old code after a successful upgrade, a new process may crash while starting without harm, one upgrade at a time. "The new process can crash during initialisation, without bad effects" (Graceful upgrade wishlist)

## Visuals worth redrawing

- Old master and workers, new master and workers, both sharing the same
  listen sockets.

## My notes

- Also points to GitHub's post on the SO_REUSEPORT race, not opened.
