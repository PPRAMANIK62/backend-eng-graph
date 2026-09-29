---
id: oci-distribution-spec
title: OCI Distribution Specification
author: Open Container Initiative
url: https://github.com/opencontainers/distribution-spec/blob/main/spec.md
kind: spec
primary: true
---

## Summary

The HTTP API registries speak (read on main after v1.1.1). Based on
Docker Registry HTTP API V2. A pull fetches the manifest by tag or
digest, then each blob by digest; a push uploads blobs first and the
manifest last.

## Key claims

- Based on Docker's registry API. "The spec is based on the specification for the Docker Registry HTTP API V2 protocol" (Historical Context)
- A tag is a movable, human-readable name for a manifest. "**Tag**: a custom, human-readable pointer to a manifest. A manifest digest may have zero, one, or many tags referencing it." (Definitions)
- Pull = manifest plus blobs. "The process of pulling an object centers around retrieving two components: the manifest and one or more blobs." (Pull)
- Manifest URL. "`/v2/<name>/manifests/<tag-or-digest>`" (Pulling manifests)
- Blob URL is by digest. "`/v2/<name>/blobs/<digest>`" (Pulling blobs)
- Clients should check blobs against the digest. "Clients SHOULD verify that the response body matches the requested digest." (Pulling blobs)
- Blob responses carry the digest in a Docker-named header. "A successful response MUST contain the digest of the uploaded blob in the header `Docker-Content-Digest`." (Pulling blobs)
- Push is the reverse order. "Pushing an object typically works in the opposite order as a pull: the blobs making up the object are uploaded first, and the manifest last." (Push)
- A registry skips uploading a layer it already has. "When process B attempts to upload the layer, the registry indicates that its not necessary because the layer is already known." (Use Cases, Layer Upload De-duplication)
- Tags are at most 128 characters. "`<tag-or-digest>` as a tag MUST be at most 128 characters in length" (Pulling manifests)

## Visuals worth redrawing

None.

## My notes

- Layer upload de-duplication is listed as a use case: a blob already
  in the registry isn't uploaded again.
