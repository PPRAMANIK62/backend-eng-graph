---
id: oci-image-spec
title: OCI Image Format Specification
author: Open Container Initiative
url: https://github.com/opencontainers/image-spec
kind: spec
primary: true
---

## Summary

The OCI image format (read on the main branch after v1.1.1): an image is
a manifest pointing by digest at a config JSON and an ordered list of
layer tarballs; an optional index points at one manifest per platform.
Layers are filesystem changesets, with `.wh.` whiteout files for
deletions. Everything is addressed by the hash of its bytes. Claims below
come from spec.md, manifest.md, image-index.md, descriptor.md, layer.md
and config.md in the repo.

## Key claims

- What an image is. "This specification defines an OCI Image, consisting of an [image manifest](manifest.md), an [image index](image-index.md) (optional), a set of [filesystem layers](layer.md), and a [configuration](config.md)." (spec.md)
- After building: found by name, downloaded, verified by hash, unpacked into a runtime bundle. "Once built the OCI Image can then be discovered by name, downloaded, verified by hash, trusted through a signature, and unpacked into an [OCI Runtime Bundle]" (spec.md, Overview)
- Goal: content-addressable images. "The first goal is content-addressable images, by supporting an image model where the image's configuration can be hashed to generate a unique ID for the image and its components." (manifest.md)
- A manifest is one image for one architecture and OS. "an image manifest provides a configuration and set of layers for a single container image for a specific architecture and operating system." (manifest.md)
- schemaVersion is 2 for backward compatibility with Docker. "For this version of the specification, this MUST be `2` to ensure backward compatibility with older versions of Docker." (manifest.md)
- Layers are ordered base first, and applying them to an empty directory gives the filesystem. "The final filesystem layout MUST match the result of [applying](layer.md#applying-changesets) the layers to an empty directory." (manifest.md, layers)
- Layers are usually gzip tarballs; zstd SHOULD be supported. "Entries in this field will frequently use the `+gzip` types." (manifest.md, layers)
- The index points at per-platform manifests. "The image index is a higher-level manifest which points to specific [image manifests](manifest.md), ideal for one or more platforms." (image-index.md)
- A descriptor is media type, digest and size. "A Content Descriptor includes the type of the content, a content identifier (_digest_), and the byte-size of the raw content." (descriptor.md)
- The digest lets you check content from an untrusted place. "If the _digest_ can be communicated in a secure manner, one can verify content from an insecure source by recalculating the digest independently, ensuring the content has not been modified." (descriptor.md, Digests)
- Digest format is algorithm:encoded, e.g. sha256:… "digest                ::= algorithm ":" encoded" (descriptor.md, Digests)
- A layer is a tar archive. "Layer Changesets for the [media type](media-types.md) `application/vnd.oci.image.layer.v1.tar` MUST be packaged in [tar archive][tar-archive]." (layer.md)
- Deletions are whiteout files with a `.wh.` prefix. "A whiteout filename consists of the prefix `.wh.` plus the basename of the path to be deleted." (layer.md, Whiteouts)
- Whiteouts only hide files from lower layers. "Whiteout files MUST only apply to resources in lower/parent layers." (layer.md, Whiteouts)
- Layers are applied, not just extracted. "Layer Changesets of [media type](media-types.md) `application/vnd.oci.image.layer.v1.tar` are _applied_, rather than simply extracted as tar archives." (layer.md, Applying Changesets)
- Runtime settings (entrypoint, env) live in the image config, not in layers. "Layers do not have configuration metadata such as environment variables or default arguments - these are properties of the image as a whole rather than any particular layer." (config.md)
- DiffID is the hash of the uncompressed layer, different from the manifest's (usually compressed) layer digest. "A layer DiffID is the digest over the layer's uncompressed tar archive and serialized in the descriptor digest format" (config.md, Layer DiffID)
- ChainID identifies a stack of layers in order. "While a layer's `DiffID` identifies a single changeset, the `ChainID` identifies the subsequent application of those changesets." (config.md, Layer ChainID)
- An applied whiteout is itself hidden. "Once a whiteout is applied, the whiteout itself MUST also be hidden." (layer.md, Whiteouts)
- The config lists the layer DiffIDs in order. "An array of layer content hashes (`DiffIDs`), in order from first to last." (config.md, Properties, rootfs.diff_ids)
- The config carries run-time settings like the entrypoint. "execution/runtime configuration like its entrypoint, default arguments, networking, and volumes." (config.md)

## Visuals worth redrawing

Index to manifests to config and layers, all linked by digest. The
spec's build and run diagrams (spec.md) show the lifecycle.

## My notes

- specs-go/version.go on main says 1.1.1 plus "+dev".
- The OCI whiteout format (`.wh.name`) and overlayfs's whiteout (a 0/0
  char device) are different; the unpacker converts one to the other.
