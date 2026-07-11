# Skill Curator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a safe `skill-curator` package, then install the public source as Joyce's user-level Skill through one symlink.

**Architecture:** Keep the public repository as the only source of truth. A standard-library Python script performs deterministic, read-only inventory; `SKILL.md` owns evidence-based diagnosis and confirmation gates; references hold description and mutation policy details. The user-level installation points to the public directory instead of copying it.

**Tech Stack:** Python 3 standard library, `unittest`, Markdown, YAML metadata, Git, POSIX symlink.

## Global Constraints

- First scan is read-only and never changes Skill files or configuration.
- File modification time is not usage evidence.
- Prefer disable, then archive, then deletion; permanent deletion requires a second explicit confirmation.
- Never mutate system, admin, plugin-cache, or package-manager-owned Skills.
- Do not equate many Skills with slow startup; describe progressive disclosure accurately.
- Keep the public package as the only maintained source.

---

### Task 1: Read-only inventory engine

**Files:**
- Create: `skills/skill-curator/tests/test_skill_inventory.py`
- Create: `skills/skill-curator/scripts/skill_inventory.py`

**Interfaces:**
- Produces: `parse_frontmatter(data: bytes) -> tuple[str | None, str | None, list[str]]`
- Produces: `scan_roots(roots: Sequence[Path]) -> dict[str, object]`
- Produces CLI: `python3 scripts/skill_inventory.py [ROOT ...] [--pretty]`

- [ ] **Step 1: Write failing inventory tests**

Create `test_skill_inventory.py` with fixtures for a valid Skill, folded multiline description, missing metadata, duplicate name, duplicate content, an external symlink, a missing root, and tree hashes before/after a scan. Import the production module from `../scripts/skill_inventory.py`; the first run must fail because that file does not exist.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
python3 -m unittest skills/skill-curator/tests/test_skill_inventory.py -v
```

Expected: failure loading `scripts/skill_inventory.py`.

- [ ] **Step 3: Implement the minimal scanner**

Implement these data fields for every discovered `SKILL.md`:

```python
{
    "path": str,
    "root": str,
    "scope": str,
    "name": str | None,
    "description": str | None,
    "size_bytes": int | None,
    "modified_at": str | None,
    "is_symlink": bool,
    "symlink_target": str | None,
    "content_hash": str | None,
    "metadata_errors": list[str],
}
```

Return an envelope containing `generated_at`, `roots`, `summary`, `skills`, `duplicate_names`, `duplicate_content`, and `scan_errors`. Walk without following symlinks and exclude `.git`, `node_modules`, and `__pycache__`. If no roots are provided, select existing `~/.agents/skills`, `~/.codex/skills`, and `$CWD/.agents/skills` roots.

- [ ] **Step 4: Run tests and verify GREEN**

Run the same unittest command. Expected: every test passes and the tree hash is unchanged.

- [ ] **Step 5: Commit the scanner**

```bash
git add skills/skill-curator/tests/test_skill_inventory.py skills/skill-curator/scripts/skill_inventory.py
git commit -m "feat: add read-only skill inventory"
```

---

### Task 2: Skill workflow, policies, and trigger contract

**Files:**
- Create: `skills/skill-curator/tests/test_skill_contract.py`
- Create: `skills/skill-curator/SKILL.md`
- Create: `skills/skill-curator/references/description-guide.md`
- Create: `skills/skill-curator/references/safety-policy.md`
- Create: `skills/skill-curator/agents/openai.yaml`

**Interfaces:**
- Consumes: scanner JSON from Task 1.
- Produces: audit report with facts, heuristics, confidence, proposed action, confirmation list, and recovery path.
- Produces: UI invocation `$skill-curator`.

- [ ] **Step 1: Write failing contract tests**

Assert the future package has valid frontmatter; the description starts with `Use when`, contains cleanup and trigger-failure terms, excludes workflow-summary language, and stays under 500 characters. Assert `SKILL.md` contains the phrases `read-only`, `mtime is not usage evidence`, `second explicit confirmation`, and direct links to both references. Assert `openai.yaml` mentions `$skill-curator`.

- [ ] **Step 2: Run contract tests and verify RED**

```bash
python3 -m unittest skills/skill-curator/tests/test_skill_contract.py -v
```

Expected: failure because the package files do not yet exist.

- [ ] **Step 3: Write the minimal Skill and references**

Use this trigger-only frontmatter:

```yaml
---
name: skill-curator
description: Use when installed AI skills, custom instructions, or workflow rules need auditing, cleanup, consolidation, disabling, archiving, deletion review, or clearer trigger descriptions; also when skills are duplicated, rarely used, fail to trigger, trigger incorrectly, or crowd the available skill list. Do not use for creating one new skill or cleaning general files.
---
```

The body must implement: authorize roots; run the scanner; separate fact/heuristic/unknown; optionally request permission before searching session logs; classify retain/rewrite/merge/disable/archive/delete; present exact path actions; require confirmation; verify mutations; report recovery. Put description rewrite tests in `description-guide.md` and detailed mutation protections in `safety-policy.md`.

Generate `agents/openai.yaml` with:

```yaml
interface:
  display_name: "Skill Curator"
  short_description: "Audit, clarify, and safely prune AI skills"
  default_prompt: "Use $skill-curator to audit my installed skills without changing anything yet."
```

- [ ] **Step 4: Run contract and inventory tests**

Expected: all tests pass.

- [ ] **Step 5: Validate the Skill structure**

```bash
python3 /Users/a10739/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/skill-curator
```

Expected: `Skill is valid!`

- [ ] **Step 6: Commit the workflow package**

```bash
git add skills/skill-curator
git commit -m "feat: add skill curator workflow"
```

---

### Task 3: Public copy, repository indexes, and personal installation

**Files:**
- Create: `skills/skill-curator.skill.md`
- Modify: `skills/README.md`
- Modify: `README.md`
- Create symlink: `/Users/a10739/.agents/skills/skill-curator` -> `/Users/a10739/joyce-notes/skills/skill-curator`

**Interfaces:**
- Consumes: directory package from Task 2.
- Produces: standalone prompt for tools without folder Skills.
- Produces: one user-level installation backed by public source.

- [ ] **Step 1: Write standalone-version assertions**

Extend `test_skill_contract.py` to require the single file, the same read-only and confirmation boundaries, and instructions for users whose AI cannot inspect local directories.

- [ ] **Step 2: Run tests and verify RED**

Expected: failure because `skills/skill-curator.skill.md` does not exist.

- [ ] **Step 3: Write standalone copy and update indexes**

Create the standalone version with no dependency on the Python script: ask the AI to inspect accessible directories or request a pasted file list; preserve evidence levels and confirmation gates. Add `skill-curator` to `skills/README.md` and add a dated entry at the top of the root `README.md` latest-updates list.

- [ ] **Step 4: Run tests and validate both packages**

Run all unittests, `quick_validate.py`, `git diff --check`, and a real read-only scan of `/Users/a10739/.agents/skills`, `/Users/a10739/.codex/skills`, and `/Users/a10739/Desktop/life/rednote/.agents/skills`, writing output only to `/tmp/skill-curator-inventory.json`.

- [ ] **Step 5: Install the personal symlink**

If `/Users/a10739/.agents/skills/skill-curator` does not exist, create the symlink. If it exists and points elsewhere, stop rather than overwrite it. Verify with:

```bash
test "$(readlink /Users/a10739/.agents/skills/skill-curator)" = "/Users/a10739/joyce-notes/skills/skill-curator"
```

- [ ] **Step 6: Commit public integration**

```bash
git add skills/skill-curator.skill.md skills/README.md README.md skills/skill-curator/tests/test_skill_contract.py
git commit -m "docs: publish skill curator package"
```

- [ ] **Step 7: Final verification**

Run the full test, validation, diff, symlink, and real-scan checks again. Inspect the generated inventory summary and confirm the scan did not modify any source files.
