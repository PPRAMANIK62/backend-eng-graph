---
id: docker-storage-drivers
title: Storage drivers
author: Docker documentation
url: https://docs.docker.com/engine/storage/drivers/
kind: docs
primary: true
---

## Summary

Docker's explanation of images as stacks of layers and a container as
one thin writable layer on top, with copy-on-write between them. Shows
how a Dockerfile's instructions become layers and why deleting a file in
a later layer doesn't shrink the image.

## Key claims

- Each filesystem-changing instruction makes a layer. "Commands that modify the filesystem create a new layer." (Images and layers)
- A layer is a set of differences; deleting in a later layer doesn't free space. "Each layer is only a set of differences from the layer before it." (Images and layers)
- The container is a thin writable layer on top. "When you create a new container, you add a new writable layer on top of the underlying layers." (Images and layers)
- The writable layer goes away with the container. "When the container is deleted, the writable layer is also deleted. The underlying image remains unchanged." (Container and layers)
- Many containers share one image. "multiple containers can share access to the same underlying image and yet have their own data state." (Container and layers)
- Shared layers aren't pulled twice. "Docker already has all the layers from the first image, so it doesn't need to pull them again." (The copy-on-write (CoW) strategy)
- Docker Engine 29.0 uses the containerd image store by default for fresh installs. "Docker Engine 29.0 and later uses the containerd image store by default for fresh installations, which uses snapshotters instead of classic storage drivers." (note at top)
- Removed files still count toward image size, and multi-stage builds are the suggested fix. "the $HOME/.cache directory is removed, but will still be available in the previous layer and add up to the image's total size. Refer to the Best practices for writing Dockerfiles and use multi-stage builds sections to learn how to optimize your Dockerfiles for efficient images." (Images and layers)

## Visuals worth redrawing

Several containers, each with its own thin writable layer, over one
shared image.

## My notes

- Pairs with docker-overlayfs-driver for the overlay specifics.
