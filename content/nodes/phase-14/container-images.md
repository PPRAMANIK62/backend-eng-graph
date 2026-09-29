---
id: container-images
title: Container images
depth: short
phase: 14
note: >-
  The OCI image format: layers, manifests, registries.
needs: [containers, overlayfs]
leads_to: [container-runtimes]
compare_with: [supply-chain-security]
---

# Container images

A container image is a bundle of files and settings that a runtime turns
into the root filesystem and startup command of a [[containers|container]].
Under the OCI image format it's a small set of JSON documents plus a
stack of tarballs, and every piece is named by the [[cryptographic-hashes|SHA-256 hash]] of its
bytes. That one design choice is why images are easy to cache, share
and verify, and why a tag like `latest` is less solid than it looks.

## What you get when you pull `api:1.4`

An image is four kinds of objects, each stored as a blob and pointed to
by a **descriptor**: a media type, a digest like `sha256:6c3c…`, and a
size.

- **Layers.** Each layer is a tar archive, usually gzip-compressed, of
  the files that changed at one step of the build. The base layer comes
  first; each later layer adds, changes or deletes files on top.
- **Config.** A JSON document with what the image needs at run time: the
  entrypoint and default arguments, environment variables, and the
  list of layer hashes that make up its filesystem.
  Layers carry no settings of their own.
- **Manifest.** A JSON document for one platform (say, Linux on
  amd64) that points to the config and lists the layers in order, each
  by digest.
- **Index** (optional). A list of manifests, one per platform, so the
  same name can serve an amd64 and an arm64 machine.

![An index points to two manifests, one for linux/amd64 and one for linux/arm64. The amd64 manifest points to a config blob and to three layer blobs in order, base first. Every arrow is a descriptor carrying a sha256 digest. A tag, api:1.4, points at the index.](img/container-images-manifest.svg)

*Everything is addressed by digest. The tag is just a name pointing at the top.*

Pulling from a registry follows those pointers. The client asks for
`/v2/<name>/manifests/<tag-or-digest>`, reads the digests inside, and
fetches each blob from `/v2/<name>/blobs/<digest>`, checking that what
arrives hashes to the digest it asked for. A push goes the other way:
blobs first, manifest last. The registry API grew out of Docker's
Registry HTTP API V2.

## Why content addressing matters

Because a blob's name is its hash, a few things come for free:

- **Verification.** If you know the right digest from a trusted place,
  you can fetch the bytes from anywhere and check them. On top of that,
  an image can be signed, which is part of [[supply-chain-security]].
- **De-duplication.** Two images built on the same base share those
  layer blobs. A machine that already has them doesn't download them
  again, and a registry that already has a layer skips the upload.
- **Immutability.** Change one byte of the config and its digest
  changes, so the manifest's digest changes too. A digest always means
  the same image.

A **tag** is different. It's a movable, human-readable pointer to a
manifest, and one manifest can have many tags. `api:1.4` today and
`api:1.4` next week can be different images. If you need the same bits
every time (for a deploy, or a rollback), refer to the image by digest:
`api@sha256:…`.

## Layers are changesets

A layer records differences, not a full filesystem. Unpacking means
*applying* the layers in order to an empty directory. Additions and
changes are ordinary tar entries. A deletion is a **whiteout**: an empty
file named `.wh.` plus the deleted name, for example `etc/.wh.app.conf`.
It hides that file in the layers below and is itself hidden.

This has a cost people trip over. Each build step that changes the
filesystem makes a new layer, and deleting a file in a later layer
doesn't remove it from the earlier one. It's still downloaded and
stored, just hidden. Download a big toolchain in one step and delete
it in the next, and the image still carries it. Do the download, build
and cleanup in one step, or copy only the result into a fresh final
stage.

At run time, the runtime unpacks each layer into its own directory once
and stacks them with [[overlayfs]], adding an empty writable layer per
container. Layers are applied, not just extracted, so the unpacker has
to act on each `.wh.` file (hide the name below) instead of copying it
in as an ordinary file. overlayfs marks deletions its own way, covered
in [[overlayfs]].

## Where it gets tricky

**Two different layer hashes.** The digest in the manifest is usually
over the compressed tarball. The config lists **DiffIDs**, hashes of
the uncompressed tar. Recompress the same layer and the first changes
while the second doesn't. The config also defines a **ChainID** that
names a whole stack of layers in order, since the same layer on top of
different bases gives a different filesystem.

**Docker's shadow.** OCI manifests still carry `schemaVersion: 2`, a
value kept for backward compatibility with older Docker, and registries
still answer with Docker-named headers like `Docker-Content-Digest`.

## What this means when you build

- Deploy by digest, not by tag, so what you tested is what runs.
- Build on shared base images, so machines and registries already
  have the big layers.
- Clean up in the same step that made the mess; a later delete doesn't
  shrink the image.
- For your own runtime: fetch the manifest for your platform, verify
  each blob's hash, apply the layers in order (handling `.wh.` files),
  and read the entrypoint and environment from the config.

## Further reading

- [OCI Image Format Specification](https://github.com/opencontainers/image-spec), Open Container Initiative, v1.1.1 and later. Manifests, indexes, descriptors, layers with whiteouts, and the config with DiffIDs and ChainIDs.
- [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/main/spec.md), Open Container Initiative. The registry HTTP API: pulling manifests and blobs, pushing, and what a tag is.
- [Storage drivers](https://docs.docker.com/engine/storage/drivers/), Docker docs. How build steps become layers, and why deleting in a later layer doesn't free space.
