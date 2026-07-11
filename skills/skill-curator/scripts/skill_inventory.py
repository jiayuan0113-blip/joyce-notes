#!/usr/bin/env python3
"""Create a deterministic, read-only inventory of Agent Skill folders."""

import argparse
from collections import defaultdict
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from typing import Dict, List, Optional, Sequence, Tuple


EXCLUDED_DIRS = {".git", "node_modules", "__pycache__"}
TOP_LEVEL_KEY = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$")


def _decode_scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_frontmatter(data: bytes) -> Tuple[Optional[str], Optional[str], List[str]]:
    """Parse the name and description without requiring a YAML dependency."""
    errors: List[str] = []
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        return None, None, [f"SKILL.md is not valid UTF-8: {exc}"]

    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, None, ["Missing YAML frontmatter opening delimiter"]

    try:
        closing = next(index for index in range(1, len(lines)) if lines[index].strip() == "---")
    except StopIteration:
        return None, None, ["Missing YAML frontmatter closing delimiter"]

    header = lines[1:closing]
    values: Dict[str, str] = {}
    index = 0
    while index < len(header):
        line = header[index]
        match = TOP_LEVEL_KEY.match(line)
        if not match:
            index += 1
            continue
        key, raw_value = match.group(1), (match.group(2) or "")
        raw_value = raw_value.strip()
        if raw_value in {"", ">", "|", ">-", "|-", ">+", "|+"}:
            style = raw_value[:1] or ">"
            block: List[str] = []
            index += 1
            while index < len(header):
                candidate = header[index]
                if candidate and not candidate[0].isspace() and TOP_LEVEL_KEY.match(candidate):
                    index -= 1
                    break
                block.append(candidate.strip())
                index += 1
            if style == "|":
                values[key] = "\n".join(block).strip()
            else:
                values[key] = " ".join(part for part in block if part).strip()
        else:
            values[key] = _decode_scalar(raw_value)
        index += 1

    name = values.get("name") or None
    description = values.get("description") or None
    if not name:
        errors.append("Missing required frontmatter field: name")
    if not description:
        errors.append("Missing required frontmatter field: description")
    return name, description, errors


def _scope_for(root: Path, skill_path: Path) -> str:
    home = Path.home()
    try:
        relative = skill_path.relative_to(root)
        if relative.parts and relative.parts[0] == ".system":
            return "SYSTEM"
    except ValueError:
        pass

    if root == home / ".agents" / "skills":
        return "USER"
    if root == home / ".codex" / "skills":
        return "USER_OR_PLUGIN"
    if str(root).startswith("/etc/codex/skills"):
        return "ADMIN"
    parts = root.parts
    if ".agents" in parts and "skills" in parts:
        return "REPO"
    return "CUSTOM"


def _symlink_entry(root: Path, skill_dir: Path) -> Dict[str, object]:
    try:
        target = str(skill_dir.resolve(strict=False))
    except OSError as exc:
        target = None
        target_error = f"Could not resolve symlink target: {exc}"
    else:
        target_error = "Symlinked skill directory was recorded but not traversed"
    skill_path = skill_dir / "SKILL.md"
    return {
        "path": str(skill_path),
        "root": str(root),
        "scope": _scope_for(root, skill_path),
        "name": None,
        "description": None,
        "size_bytes": None,
        "modified_at": None,
        "is_symlink": True,
        "symlink_target": target,
        "content_hash": None,
        "metadata_errors": [target_error],
    }


def _file_entry(root: Path, skill_path: Path) -> Dict[str, object]:
    if skill_path.is_symlink():
        return _symlink_entry(root, skill_path.parent)

    errors: List[str] = []
    data: Optional[bytes]
    try:
        data = skill_path.read_bytes()
    except (OSError, PermissionError) as exc:
        data = None
        errors.append(f"Could not read SKILL.md: {exc}")

    if data is None:
        name = description = content_hash = None
    else:
        name, description, metadata_errors = parse_frontmatter(data)
        errors.extend(metadata_errors)
        content_hash = hashlib.sha256(data).hexdigest()

    try:
        stat = skill_path.stat()
        size_bytes = stat.st_size
        modified_at = datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat()
    except OSError as exc:
        size_bytes = None
        modified_at = None
        errors.append(f"Could not stat SKILL.md: {exc}")

    return {
        "path": str(skill_path),
        "root": str(root),
        "scope": _scope_for(root, skill_path),
        "name": name,
        "description": description,
        "size_bytes": size_bytes,
        "modified_at": modified_at,
        "is_symlink": False,
        "symlink_target": None,
        "content_hash": content_hash,
        "metadata_errors": errors,
    }


def _group_duplicates(skills: Sequence[Dict[str, object]], field: str, label: str) -> List[Dict[str, object]]:
    grouped: Dict[str, List[str]] = defaultdict(list)
    for item in skills:
        value = item.get(field)
        path = item.get("path")
        if isinstance(value, str) and value and isinstance(path, str):
            grouped[value].append(path)
    return [
        {label: value, "paths": sorted(paths)}
        for value, paths in sorted(grouped.items())
        if len(paths) > 1
    ]


def scan_roots(roots: Sequence[Path]) -> Dict[str, object]:
    """Scan roots without following symlinks or writing to the filesystem."""
    normalized: List[Path] = []
    seen = set()
    for raw_root in roots:
        root = Path(raw_root).expanduser().absolute()
        if str(root) not in seen:
            normalized.append(root)
            seen.add(str(root))

    skills: List[Dict[str, object]] = []
    scan_errors: List[Dict[str, str]] = []
    roots_scanned = 0

    for root in normalized:
        if not root.exists():
            scan_errors.append({"root": str(root), "error": "Root does not exist"})
            continue
        if not root.is_dir():
            scan_errors.append({"root": str(root), "error": "Root is not a directory"})
            continue
        if not os.access(str(root), os.R_OK | os.X_OK):
            scan_errors.append({"root": str(root), "error": "Permission denied reading root"})
            continue

        roots_scanned += 1

        def onerror(error: OSError) -> None:
            scan_errors.append({"root": str(root), "error": f"Permission or scan error: {error}"})

        for current, dirnames, filenames in os.walk(
            str(root), topdown=True, followlinks=False, onerror=onerror
        ):
            current_path = Path(current)
            dirnames[:] = sorted(name for name in dirnames if name not in EXCLUDED_DIRS)

            symlink_dirs = [name for name in dirnames if (current_path / name).is_symlink()]
            for name in symlink_dirs:
                skills.append(_symlink_entry(root, current_path / name))
            dirnames[:] = [name for name in dirnames if name not in symlink_dirs]

            if "SKILL.md" in filenames:
                skills.append(_file_entry(root, current_path / "SKILL.md"))

    skills.sort(key=lambda item: str(item["path"]))
    duplicate_names = _group_duplicates(skills, "name", "name")
    duplicate_content = _group_duplicates(skills, "content_hash", "content_hash")
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "roots": [str(root) for root in normalized],
        "summary": {
            "roots_requested": len(normalized),
            "roots_scanned": roots_scanned,
            "skills_found": len(skills),
            "skills_with_metadata_errors": sum(bool(item["metadata_errors"]) for item in skills),
            "symlinks_not_traversed": sum(bool(item["is_symlink"]) for item in skills),
            "duplicate_name_groups": len(duplicate_names),
            "duplicate_content_groups": len(duplicate_content),
        },
        "skills": skills,
        "duplicate_names": duplicate_names,
        "duplicate_content": duplicate_content,
        "scan_errors": scan_errors,
    }


def default_roots() -> List[Path]:
    candidates = [
        Path.home() / ".agents" / "skills",
        Path.home() / ".codex" / "skills",
        Path.cwd() / ".agents" / "skills",
    ]
    roots: List[Path] = []
    seen = set()
    for candidate in candidates:
        absolute = candidate.expanduser().absolute()
        if absolute.exists() and str(absolute) not in seen:
            roots.append(absolute)
            seen.add(str(absolute))
    return roots


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("roots", nargs="*", type=Path, help="Authorized Skill roots to scan")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    args = parser.parse_args(argv)
    roots = args.roots or default_roots()
    payload = scan_roots(roots)
    json.dump(
        payload,
        sys.stdout,
        ensure_ascii=False,
        indent=2 if args.pretty else None,
        sort_keys=True,
    )
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
