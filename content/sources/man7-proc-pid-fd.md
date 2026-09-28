---
id: man7-proc-pid-fd
title: proc_pid_fd(5) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man5/proc_pid_fd.5.html
kind: docs
primary: true
---

## Summary

Describes `/proc/<pid>/fd/`, the directory where Linux shows every file a
process has open, one entry per file descriptor. A direct way to look at a
process's open files from outside. Linux man-pages 6.19.

## Key claims

- `/proc/<pid>/fd/` has one entry per open file, named by the descriptor number. "This is a subdirectory containing one entry for each file which the process has open, named by its file descriptor, and which is a symbolic link to the actual file." (DESCRIPTION)
- 0, 1 and 2 are standard input, output and error. "Thus, 0 is standard input, 1 standard output, 2 standard error, and so on." (DESCRIPTION)
- Pipes and sockets show up as a type plus an inode number. "For example, socket:[2248868] will be a socket and its inode is 2248868." (DESCRIPTION)

## Visuals worth redrawing

None.

## My notes

- Companion page proc_pid(5), also opened, says there is one
  numbered directory under /proc for each running process, named by its
  PID. Not cited separately.
