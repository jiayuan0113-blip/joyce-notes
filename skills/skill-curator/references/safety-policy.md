# Safe Change Policy

Read this file completely before modifying, disabling, moving, merging, or deleting any Skill.

## Ownership Classes

| Class | Examples | Allowed action |
|---|---|---|
| User-owned | A Skill the user created in a personal directory | Rewrite, disable, archive after confirmation |
| Repo-owned | A Skill tracked in the active project | Change only after checking Git status and showing a diff |
| System/admin | Bundled or centrally managed locations | Report only |
| Plugin/package-managed | Plugin cache, package manager, generated bundle | Use verified disable/uninstall path; do not edit cache files |
| Unknown | Unclear owner or source | Report and stop |

## Required Action Ladder

1. **Diagnose:** read-only report.
2. **Rewrite:** show an exact metadata diff; change only approved files.
3. **Disable:** prefer the platform's verified configuration mechanism.
4. **Archive:** move the approved item to a user-approved quarantine directory and write a recovery manifest.
5. **Delete:** remove only a previously disabled or archived item after a second explicit confirmation naming every path.

Never skip from diagnosis directly to permanent deletion.

## Confirmation Protocol

The first confirmation must name each proposed operation and source path. Before applying it:

- re-check that the source exists and has not changed since inventory
- show destination or configuration diff
- explain impact and recovery
- exclude unconfirmed rows

After disable or archive, verify that the original discovery location no longer exposes the Skill and that recovery is possible.

Permanent deletion requires a new message with a second explicit confirmation. A general phrase such as “clean them up” is not sufficient. Require the exact archived or disabled paths.

## Codex Disable Example

For Codex, prefer a reviewed entry in `~/.codex/config.toml` when appropriate:

```toml
[[skills.config]]
path = "/absolute/path/to/skill/SKILL.md"
enabled = false
```

Restart Codex after changing this configuration. Do not guess equivalent mechanisms for other AI tools; verify their documentation or offer archive-only handling.

## Archive and Recovery

Use a timestamped, user-approved directory such as:

```text
~/.skill-curator/archive/2026-07-11T120000/
```

Preserve each Skill directory intact. Create a manifest containing original path, archived path, timestamp, content hash, reason, and restore command. For a symlink, archive or disable the link only; never move or delete its target without separate approval.

## Git Safety

Before changing a tracked Skill:

1. Run `git status --short` in its repository.
2. Stop if unrelated user changes overlap the target file.
3. Show the proposed diff.
4. Apply only the approved patch.
5. Run the Skill validator and relevant tests.

## Forbidden Actions

- No mutation during the first audit.
- No deletion based only on age, modification time, or absence from a limited log search.
- No recursive following of symlinks during discovery.
- No editing plugin caches or system/admin Skills.
- No overwriting an existing archive destination.
- No broad wildcard deletion.
- No claiming recovery works without verifying the manifest and restore path.
