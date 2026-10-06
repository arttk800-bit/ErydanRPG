# Eirdan package format v1

A user/downloadable package is one ZIP file so Android Storage Access Framework needs access to only one selected document.

## Archive layout

```text
my-package.zip
├── manifest.json
└── payload.pck | payload.zip | data.json
```

`manifest.json`:

```json
{
  "format": "eirdan-package",
  "format_version": 1,
  "id": "author.package",
  "version": "1.0.0",
  "kind": "content",
  "runtime_min": "0.1.0",
  "payload": "payload.pck",
  "sha256": "<64 lowercase hex characters>"
}
```

## Install lifecycle

1. Source supplies one ZIP file.
2. Installer reads and validates `manifest.json` without activating the package.
3. Declared payload is extracted to `user://packages/staging/`.
4. Godot computes SHA-256 over the staged payload.
5. A mismatch rejects the package.
6. Verified payload is promoted under `user://packages/installed/<id>/<version>/`.
7. PackageManager persists the previous active set, then atomically replaces the active index.
8. Rollback swaps the active and previous sets.
9. Resource packs are mounted only from the active set.

Remote HTTP/GitHub hosting and Android local import are sources. They do not own validation or activation.

## Package kinds

- `content` — official/additional data and resources.
- `override` — user-editable values layered over base data.
- `development` — development-only package channel.

Package code execution policy is intentionally not finalized in v1. The first Android proof focuses on data/resources and update safety.
