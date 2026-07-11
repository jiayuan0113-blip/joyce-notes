# Trigger Description Guide

Read this before rewriting Skill metadata or deciding that two Skills overlap.

## Purpose

A description is a trigger selector. It should help an agent answer, “Should I load this Skill now?” It is not marketing copy and should not summarize the internal workflow.

Codex initially sees a Skill's name, description, and path, then loads the full `SKILL.md` only after selection. Large Skill sets may have descriptions shortened or entries omitted, so put the strongest trigger terms first. Source: [OpenAI, Build skills](https://learn.chatgpt.com/docs/build-skills).

## Rewrite Contract

Use this form:

```text
Use when [observable user situation, task, or symptom]. Do not use for [closest confusing neighbor].
```

Require all of the following:

- Start with `Use when`.
- Name observable situations, not abstract benefits.
- Include realistic user language and important synonyms.
- Front-load the main job and trigger symptoms.
- State a negative boundary when a nearby Skill could match.
- Keep the description concise; target fewer than 500 characters.
- Keep workflow steps, output templates, and implementation details in the body.
- Avoid praise words such as “powerful,” “smart,” or “boost productivity.”

## Trigger Test Set

For every rewrite, return:

1. The proposed description.
2. Three prompts that should trigger it.
3. Two prompts that should not trigger it.
4. The closest neighboring Skill and one-sentence boundary.

Example:

```text
Description: Use when installed AI Skills need cleanup, consolidation, deletion review, or clearer trigger descriptions. Do not use for creating one new Skill from scratch.

Should trigger:
- Audit all the Skills I installed and find duplicates.
- This Skill never triggers; rewrite its description.
- Which old Skills should I disable or archive?

Should not trigger:
- Create a PDF editing Skill.
- Clean large video files from my disk.
```

## Overlap Review

Do not call two Skills duplicates from similar wording alone. Compare:

- target user request
- primary job
- input and output
- explicit exclusions
- required tools or platform

Use `exact duplicate` only for identical content hashes. Use `same-name conflict` for identical names. Use `possible overlap` for model judgment, and include confidence plus evidence.
