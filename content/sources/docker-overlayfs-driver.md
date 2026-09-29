---
id: docker-overlayfs-driver
title: OverlayFS storage driver
author: Docker documentation
url: https://docs.docker.com/engine/storage/drivers/overlayfs-driver/
kind: docs
primary: true
---

## Summary

How Docker's overlay2 storage driver lays an image and a container out
with overlayfs: image layers as lowerdirs, the container's writable layer
as upperdir, and the `merged` directory as the container's root. Also the
performance side: whole-file copy-up, shared page cache, and where it
breaks POSIX.

## Key claims

- The layers and names. "OverlayFS refers to the lower directory as lowerdir and the upper directory as upperdir. The unified view is exposed through its own directory called merged." (How the overlay2 driver works)
- overlay2 supports up to 128 lower layers. "The overlay2 driver natively supports up to 128 lower OverlayFS layers." (How the overlay2 driver works)
- Image layers are read-only lowerdirs, the container gets a new writable upperdir. "The image's layers are the lowerdirs in the overlay and are read-only. The new directory for the container is the upperdir and is writable." (Image and container layers on-disk)
- Copy-up copies the whole file, even for a small change. "This means that all OverlayFS copy_up operations copy the entire file, even if the file is large and only a small part of it's being modified." (Modifying files or directories)
- Copy-up happens once per file. "The copy_up operation only occurs the first time a given file is written to." (Modifying files or directories)
- Many layers can slow lookups. "This means that performance can be impacted when searching for files in images with many layers." (Modifying files or directories)
- Renaming a directory that isn't only in the top layer fails with EXDEV. "Otherwise, it returns EXDEV error ("cross-device link not permitted")." (Modifying files or directories)
- Containers reading the same file share page cache. "Multiple containers accessing the same file share a single page cache entry for that file." (Page caching)
- Use volumes for write-heavy data. "Volumes provide the best and most predictable performance for write-heavy workloads." (Use volumes for write-heavy workloads)
- Two opens of the same file can end up on different files after copy-up. "The fd1 continues to reference the file in the image (lowerdir) and the fd2 references the file in the container (upperdir)." (Limitations on OverlayFS compatibility)

## Visuals worth redrawing

The image-layers-under-container-layer diagram.

## My notes

- Docker Engine 29 moved new installs to the containerd image store
  (snapshotters); the overlay mechanics are the same.
