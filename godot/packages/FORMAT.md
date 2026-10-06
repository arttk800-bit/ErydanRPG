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
  "priority": 0,
  "dependencies": [],
  "conflicts": [],
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
9. Before activation, the candidate active set is resolved deterministically: dependencies first, then priority, then package ID.
10. Missing dependencies, dependency cycles and active conflicts reject activation without replacing the working active set.
11. Resource packs are mounted only from the resolved active set.

Remote HTTP/GitHub hosting and Android local import are sources. They do not own validation or activation.

## Package kinds

- `content` — official/additional data and resources.
- `override` — user-editable values layered over base data.
- `development` — development-only package channel.

Package code execution is intentionally disabled in v1. The Android runtime accepts validated data/resources; new executable behavior remains a signed APK update.

JSON `content` payloads may contain complete regions/assets and packageable definition domains:

```json
{
  "definitions": {
    "travel_events": {
      "event-id": {
        "title": "Event title",
        "text": "Event description",
        "weight": 1,
        "min_distance_km": 5,
        "choices": [
          {"id": "continue", "label": "Continue", "result": "Result text", "time_seconds": 0}
        ]
      }
    }
  }
}
```

Definitions are schema-validated before activation and then resolved by `DataRegistry`. Invalid packages never replace the active set.


## Activation order

Optional manifest fields:
- `dependencies` — package IDs that must be active and ordered before this package.
- `conflicts` — package IDs that cannot be active together with this package.
- `priority` — integer ordering hint; lower values load earlier and higher values override later.

Dependencies are hard constraints and take precedence over priority. Among packages whose dependency constraints are already satisfied, ordering is deterministic by `priority` and then lexicographic package `id`. Array position in `active.json` is persisted output, not user-authored priority.
