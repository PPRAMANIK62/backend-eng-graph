---
id: overlayfs
title: OverlayFS
depth: short
phase: 14
note: >-
  Stacking read-only layers under one writable layer.
needs: [filesystem]
leads_to: [containers, container-images]
compare_with: []
---

# OverlayFS

OverlayFS is a Linux [[filesystem]] that stacks directory trees on top of
each other and shows them as one. The lower layers are read-only, a
single upper layer takes every write, and the merged view looks like an
ordinary directory. It's how a hundred [[containers]] can start from the
same image without copying it a hundred times, and it explains some odd
behaviour you'll see when a container writes to files it didn't create.

## Layers, merged

Take an image with two layers: a base with `/bin`, `/etc/os-release` and
`/etc/app.conf`, and a second layer that adds `/app/server`. A container
needs to see both as one root filesystem, and it needs somewhere to
write. The mount looks like this:

```
mount -t overlay overlay \
  -o lowerdir=/layers/app:/layers/base,upperdir=/c1/upper,workdir=/c1/work \
  /c1/merged
```

- **`lowerdir`** is a colon-separated list of read-only layers. The
  leftmost is on top.
- **`upperdir`** is the writable layer. It starts empty.
- **`workdir`** is scratch space overlayfs needs, on the same filesystem
  as `upperdir`.
- **`/c1/merged`** is the combined view, which becomes the container's `/`.

When you look up a name in the merged view, overlayfs checks the layers
from the top down. A file in a higher layer hides the same name below
it. Directories are the exception: if both layers have `/etc`, you see
one `/etc` with the names from both. The "layers" don't have to be
separate filesystems; they're just directory trees, and they can all sit
on one disk. The lower layers never need to be writable, and without an
`upperdir` the whole overlay is read-only.

![Three stacked layers and the merged view on top. Base layer: /bin, /etc/os-release, /etc/app.conf. App layer: /app/server. Upper layer, empty at the start: after the container edits /etc/app.conf it holds a full copy of that file, and after it deletes /etc/os-release it holds a whiteout with that name. The merged view shows /bin and /app/server from the lower layers, /etc/app.conf from the upper layer, and no /etc/os-release.](img/overlayfs-layers.svg)

*Reads fall through to the first layer that has the name; writes land in the upper layer.*

## Writing: copy-up

Now the container edits `/etc/app.conf`, which lives in the read-only
base layer. overlayfs can't change the base, so before the write goes
through it **copies the whole file up** into the upper layer, along with
any parent directories that aren't there yet, and then applies the
write to the copy. From then on the upper copy hides the original, and
further writes go straight to it. overlayfs is barely involved any more.

Copy-up happens the first time a file is opened for writing or has its
metadata changed, and it copies the entire file. A one-byte change to a
multi-gigabyte file in an image layer means copying all of it first. That's the reason
databases and other write-heavy data belong on a volume, which bypasses
the overlay entirely.

## Deleting: whiteouts

Deleting `/etc/os-release` can't remove it from the base layer either.
Instead overlayfs creates a **whiteout** in the upper layer: a special
file (a character device with device number 0/0) with the same name. A
whiteout in the upper layer hides the name below it, and the whiteout
itself doesn't show up in the merged view. To hide a whole directory,
overlayfs marks the upper directory as **opaque** with an extended
attribute, and nothing below it shows through.

So deleting a file in a container never frees space in the image; the
original is still there in its layer, just hidden. Image builds work the
same way (see [[container-images]]).

## Why containers use it

Lower layers can be shared by any number of overlay mounts at once. Ten
containers from one image mount the same lower directories and each gets
its own small upper directory. Starting a container means creating an
empty directory, not copying a filesystem. They also share memory: when
several containers read the same file from a shared layer, it's one
entry in the [[page-cache]], not ten. Docker's overlay2 driver supports up
to 128 lower layers.

The upper filesystem needs extended attributes and a few other
features, so NFS can't be the upper layer. overlayfs was merged in Linux
3.18; its most common use back then was live CDs, a read-only
system image with a RAM-backed upper layer.

## Where it gets tricky

**Not quite POSIX.** Open a lower-layer file read-only, then open it
again for writing: the second open triggers copy-up, and the two file
descriptors now point at different files. A lower file mapped with
[[mmap]] `MAP_SHARED` doesn't see later changes. A file's inode and
device numbers can change over its life. Renaming a directory that
isn't entirely in the upper layer fails with `EXDEV`, and programs have
to fall back to copy and delete.

**Don't touch the layers underneath.** Changing a lower or upper
directory while the overlay is mounted gives undefined results. It won't
crash the kernel, but files may look wrong.

**Durability.** overlayfs makes copy-up itself safe, with an
[[fsync]] on the new copy before an [[atomic-rename]] puts it in place,
so a crash never leaves a half-copied file. It doesn't make your own
writes durable; you still need fsync for that. The `volatile` mount
option skips every sync to the upper layer. That's fine for throwaway
container state and wrong for anything you need after a crash.

## What this means when you build

- Put databases, logs you keep and anything write-heavy on a volume or
  bind mount, not in the container's writable layer.
- Expect the first write to a big file from the image to be slow.
- For your own runtime: unpack each image layer into its own directory
  once, then give every container an overlay with those as `lowerdir`
  and fresh `upperdir` and `workdir` directories.

## Further reading

- [Overlay Filesystem](https://docs.kernel.org/filesystems/overlayfs.html), Linux kernel docs. The reference: merging, whiteouts, copy-up, multiple lower layers, non-POSIX behaviour and durability.
- [OverlayFS storage driver](https://docs.docker.com/engine/storage/drivers/overlayfs-driver/), Docker docs. How Docker maps image and container layers onto overlayfs, and the performance costs in practice.
- [Linux 3.18](https://kernelnewbies.org/Linux_3.18), KernelNewbies. The release that merged overlayfs, and what it was first used for.
