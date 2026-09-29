---
id: kernel-overlayfs
title: Overlay Filesystem
author: Linux kernel documentation (Miklos Szeredi and overlayfs developers)
url: https://docs.kernel.org/filesystems/overlayfs.html
kind: docs
primary: true
---

## Summary

The kernel's own documentation for overlayfs: upper and lower directory
trees merged into one view, whiteouts and opaque directories for
deletions, copy-up on first write, multiple lower layers, what it does
differently from POSIX, and how durable a copy-up is.

## Key claims

- Two trees, upper wins; directories merge. "When a name exists in both filesystems, the object in the ‘upper’ filesystem is visible while the object in the ‘lower’ filesystem is either hidden or, in the case of directories, merged with the ‘upper’ object." (Upper and Lower)
- They're directory trees, not whole filesystems. "It would be more correct to refer to an upper and lower ‘directory tree’ rather than ‘filesystem’" (Upper and Lower)
- The lower layer doesn't need to be writable. "The lower filesystem does not need to be writable." (Upper and Lower)
- The upper needs xattrs and d_type, so NFS can't be upper. "must provide valid d_type in readdir responses, so NFS is not suitable." (Upper and Lower)
- The mount command with lowerdir, upperdir, workdir. "mount -t overlay overlay -olowerdir=/lower,upperdir=/upper,\ workdir=/work /merged" (Directories)
- workdir must be on the upper's filesystem. "The “workdir” needs to be a directory on the same filesystem as upperdir." (Directories)
- Deletes are recorded as whiteouts in the upper layer. "In order to support rm and rmdir without changing the lower filesystem, an overlay filesystem needs to record in the upper filesystem that files have been removed." (whiteouts and opaque directories)
- A whiteout is a 0/0 character device (or an xattr-marked empty file). "A whiteout is created as a character device with 0/0 device number or as a zero-size regular file with the xattr “trusted.overlay.whiteout”." (whiteouts and opaque directories)
- Opaque directories hide the lower directory entirely. "Where the upper filesystem contains an opaque directory, any directory in the lower filesystem with the same name is ignored." (whiteouts and opaque directories)
- Copy-up on first write access. "When a file in the lower filesystem is accessed in a way that requires write-access, such as opening for write access, changing some metadata etc., the file is first copied from the lower filesystem to the upper filesystem (copy_up)." (Non-directories)
- After copy-up, the overlay steps out of the way. "Once the copy_up is complete, the overlay filesystem simply provides direct access to the newly created file in the upper filesystem" (Non-directories)
- Several lower layers, colon separated, leftmost on top. "The specified lower directories will be stacked beginning from the rightmost one and going left." (Multiple lower layers)
- No upperdir means read-only. "As the example shows, “upperdir=” and “workdir=” may be omitted. In that case the overlay will be read-only." (Multiple lower layers)
- Lower layers are commonly shared between mounts. "Lower layers may be shared among several overlay mounts and that is indeed a very common practice." (Sharing and copying layers)
- Not fully POSIX: a lower file opened read-only and mmapped MAP_SHARED doesn't see later changes. "If a file residing on a lower layer is opened for read-only and then memory mapped with MAP_SHARED, then subsequent changes to the file are not reflected in the memory mapping." (Non-standard behavior)
- st_dev and st_ino of non-directories can change. "Similarly st_ino will only be unique when combined with st_dev, and both of these can change over the lifetime of a non-directory object." (Overlay objects)
- Changing the lower tree under a mounted overlay is undefined. "If the underlying filesystem is changed, the behavior of the overlay is undefined, though it will not result in a crash or deadlock." (Changes to underlying filesystems)
- Copy-up calls fsync on the upper file before the rename, so a crash never shows a half copy. "overlayfs calls fsync(2) on the upper file before completing data copy up with rename(2) or link(2) to make the copy up “atomic”." (Durability and copy up)
- The volatile option skips all syncs to the upper layer. "The advantage of mounting with the “volatile” option is that all forms of sync calls to the upper filesystem are omitted." (Volatile mount)
- Copy-up also creates the parent directories in the upper layer. "When an overlayfs file is modified for the first time, copy up will create a copy of the lower file and its parent directories in the upper layer." (Durability and copy up)
- The whiteout is hidden too. "When a whiteout is found in the upper level of a merged directory, any matching name in the lower level is ignored, and the whiteout itself is also hidden." (whiteouts and opaque directories)
- Opaque directories are marked with an xattr. "A directory is made opaque by setting the xattr “trusted.overlay.opaque” to “y”." (whiteouts and opaque directories)
- The upper filesystem needs extended attributes. "The upper filesystem will normally be writable and if it is it must support the creation of trusted.* and/or user.* extended attributes" (Upper and Lower)

## Visuals worth redrawing

Lower layers, upper layer and merged view stacked, with a whiteout and a
copied-up file.

## My notes

- Merged in Linux 3.18 (kernelnewbies-linux-3-18).
- Unprivileged mounts inside a user namespace since Linux 5.11
  (man7-user-namespaces).
