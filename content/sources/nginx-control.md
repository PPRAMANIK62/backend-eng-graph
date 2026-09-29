---
id: nginx-control
title: Controlling nginx
author: nginx documentation
url: https://nginx.org/en/docs/control.html
kind: docs
primary: true
---

## Summary

How nginx's master process reacts to signals: HUP reloads the
configuration with new workers while old workers finish their clients,
and USR2 plus WINCH and QUIT upgrade the binary itself without closing
the listening sockets.

## Key claims

- HUP means reload config: start new workers, shut old ones down gracefully. "starting new worker processes with a new configuration, graceful shutdown of old worker processes" (signal table, HUP)
- The master checks the config and opens new sockets first, and rolls back if that fails. "If this fails, it rolls back changes and continues to work with old configuration." (Changing Configuration)
- Old workers stop listening but keep serving the clients they have. "Old worker processes close listen sockets and continue to service old clients." (Changing Configuration)
- USR2 starts the new executable, which starts its own workers; old and new both accept for a while. "After that all worker processes (old and new ones) continue to accept requests." (Upgrading Executable on the Fly)
- WINCH to the old master drains its workers. (Upgrading Executable on the Fly)
- The old master keeps its listen sockets, so you can roll back. "It should be noted that the old master process does not close its listen sockets, and it can be managed to start its worker processes again if needed." (Upgrading Executable on the Fly)
- If the upgrade works, QUIT the old master. "If upgrade was successful, then the QUIT signal should be sent to the old master process, and only new processes will stay" (Upgrading Executable on the Fly)

## Visuals worth redrawing

- The process tree before, during and after a USR2 upgrade.

## My notes

- The page doesn't say how long old workers may take; they exit when
  their clients are done.
