import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "skill_inventory.py"
SPEC = importlib.util.spec_from_file_location("skill_inventory", SCRIPT_PATH)
skill_inventory = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(skill_inventory)


def write_skill(directory: Path, frontmatter: str, body: str = "# Test\n") -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "SKILL.md"
    path.write_text(f"---\n{frontmatter}\n---\n\n{body}", encoding="utf-8")
    return path


def tree_digest(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        digest.update(str(path.relative_to(root)).encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


class SkillInventoryTests(unittest.TestCase):
    def test_parses_plain_and_folded_descriptions(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_skill(
                root / "plain",
                "name: plain-skill\ndescription: Use when plain work is needed.",
            )
            write_skill(
                root / "folded",
                "name: folded-skill\ndescription: >\n  Use when a description spans\n  more than one line.",
            )

            result = skill_inventory.scan_roots([root])
            by_name = {item["name"]: item for item in result["skills"]}

            self.assertEqual(
                by_name["plain-skill"]["description"],
                "Use when plain work is needed.",
            )
            self.assertEqual(
                by_name["folded-skill"]["description"],
                "Use when a description spans more than one line.",
            )
            self.assertEqual(result["summary"]["skills_found"], 2)

    def test_keeps_invalid_skill_with_metadata_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bad = root / "bad" / "SKILL.md"
            bad.parent.mkdir()
            bad.write_text("# Missing frontmatter\n", encoding="utf-8")

            result = skill_inventory.scan_roots([root])
            item = result["skills"][0]

            self.assertIsNone(item["name"])
            self.assertTrue(
                any("frontmatter" in error.lower() for error in item["metadata_errors"])
            )

    def test_reports_duplicate_names_and_duplicate_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = write_skill(
                root / "first",
                "name: repeated\ndescription: Use when the first case applies.",
            )
            write_skill(
                root / "second",
                "name: repeated\ndescription: Use when the second case applies.",
                body="# Different\n",
            )
            copy_path = root / "copy" / "SKILL.md"
            copy_path.parent.mkdir()
            copy_path.write_bytes(first.read_bytes())

            result = skill_inventory.scan_roots([root])

            self.assertEqual(result["duplicate_names"][0]["name"], "repeated")
            self.assertEqual(len(result["duplicate_names"][0]["paths"]), 3)
            self.assertEqual(len(result["duplicate_content"]), 1)
            self.assertEqual(len(result["duplicate_content"][0]["paths"]), 2)

    def test_records_external_symlink_without_traversing_it(self):
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
            root = Path(tmp)
            external = Path(outside) / "external-skill"
            write_skill(
                external,
                "name: external\ndescription: Use when external work applies.",
            )
            link = root / "linked-skill"
            try:
                link.symlink_to(external, target_is_directory=True)
            except OSError as exc:
                self.skipTest(f"symlinks unavailable: {exc}")

            result = skill_inventory.scan_roots([root])
            item = result["skills"][0]

            self.assertTrue(item["is_symlink"])
            self.assertEqual(item["symlink_target"], str(external.resolve()))
            self.assertIsNone(item["content_hash"])
            self.assertTrue(
                any("not traversed" in error.lower() for error in item["metadata_errors"])
            )
            self.assertFalse(any(str(external) in path for path in result["roots"]))

    def test_reports_missing_and_unreadable_roots(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            missing = base / "missing"
            result = skill_inventory.scan_roots([missing])
            self.assertTrue(any("does not exist" in item["error"] for item in result["scan_errors"]))

            if os.name == "nt":
                return
            locked = base / "locked"
            locked.mkdir()
            original_mode = locked.stat().st_mode
            locked.chmod(0)
            try:
                if os.access(locked, os.R_OK):
                    return
                locked_result = skill_inventory.scan_roots([locked])
                self.assertTrue(
                    any("permission" in item["error"].lower() for item in locked_result["scan_errors"])
                )
            finally:
                locked.chmod(original_mode)

    def test_scan_is_read_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_skill(
                root / "stable",
                "name: stable\ndescription: Use when stability matters.",
            )
            before = tree_digest(root)
            skill_inventory.scan_roots([root])
            after = tree_digest(root)
            self.assertEqual(before, after)

    def test_cli_emits_valid_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_skill(
                root / "cli",
                "name: cli-skill\ndescription: Use when testing the CLI.",
            )
            completed = subprocess.run(
                [sys.executable, str(SCRIPT_PATH), str(root)],
                check=True,
                capture_output=True,
                text=True,
            )
            payload = json.loads(completed.stdout)
            self.assertEqual(payload["summary"]["skills_found"], 1)


if __name__ == "__main__":
    unittest.main()
