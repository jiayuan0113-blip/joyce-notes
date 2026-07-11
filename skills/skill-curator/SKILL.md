---
name: skill-curator
description: Use when installed AI skills, custom instructions, or workflow rules need auditing, cleanup, consolidation, disabling, archiving, deletion review, or clearer trigger descriptions; also when skills are duplicated, rarely used, fail to trigger, trigger incorrectly, or crowd the available skill list. Do not use for creating one new skill or cleaning general files.
---

# Skill Curator

## Core Principle

Treat cleanup as evidence-based curation, not a file-deletion shortcut. Start read-only, label uncertainty, and make every state change reversible before considering permanent deletion.

## Workflow

1. Define scope. List the exact Skill, instruction, or workflow roots the user authorized. Suggest common locations only when they exist; do not silently widen the scan.
2. Inventory folder-based Skills with `scripts/skill_inventory.py`. Resolve the script relative to this `SKILL.md` and run:

   ```bash
   python3 scripts/skill_inventory.py --pretty <authorized-root> [<authorized-root> ...]
   ```

   The script emits JSON to stdout and does not follow directory symlinks. Redirect output only to a temporary or user-approved report path.
3. Inspect custom instructions or non-folder workflows separately, only inside user-approved paths.
4. Separate conclusions into:
   - **Fact:** path, scope, metadata error, exact name match, exact content hash match.
   - **Heuristic:** overlapping jobs, vague trigger language, likely consolidation opportunity.
   - **Unknown:** actual usage, ownership, or intended boundary without reliable evidence.
5. Treat `mtime is not usage evidence`. File modification time shows a file changed, not that an agent invoked it. Search local session history only after separately explaining the privacy scope and receiving permission. Even then, label the result as observed evidence, not complete usage history.
6. Read `references/description-guide.md` before rewriting descriptions or judging trigger overlap.
7. Classify each item as `retain`, `rewrite`, `merge candidate`, `disable candidate`, `archive candidate`, or `delete candidate`.
8. Deliver the report before taking action. Every recommendation needs the exact path, evidence, confidence, expected effect, and recovery method.

## Action Gate

The first pass is diagnostic only. Before any change, show one exact action list containing paths and proposed operations, then wait for confirmation.

For any approved mutation, read `references/safety-policy.md` completely. Prefer disable, then reversible archive. Permanent deletion requires a **second explicit confirmation** naming the archived or disabled paths. Never treat approval of an audit as approval to modify files.

Do not directly mutate system, admin, plugin-cache, package-manager-owned, unresolved-symlink, or ownership-unknown Skills. Recommend the verified disable or uninstall mechanism instead.

## Report Contract

Return these sections:

1. Scope and limitations
2. Inventory summary
3. Exact duplicates and name conflicts
4. Trigger-description findings
5. Usage evidence and unknowns
6. Retain / rewrite / merge / disable / archive / delete candidates
7. Proposed actions awaiting confirmation
8. Recovery plan

Keep facts, heuristics, and user decisions visibly distinct. If evidence is weak, retain or observe; do not escalate uncertainty into deletion.

## Stop Conditions

Stop and ask before continuing when a path is outside the approved scope, ownership is unclear, a Git worktree has unrelated changes, a symlink target differs from the displayed path, a path changed after the inventory, or the requested recovery path cannot be verified.
