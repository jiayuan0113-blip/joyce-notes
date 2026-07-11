from pathlib import Path
import re
import unittest


SKILL_DIR = Path(__file__).resolve().parents[1]
SKILL_PATH = SKILL_DIR / "SKILL.md"
OPENAI_YAML = SKILL_DIR / "agents" / "openai.yaml"
SINGLE_FILE = SKILL_DIR.parent / "skill-curator.skill.md"


def frontmatter_value(text: str, key: str) -> str:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+)$", text)
    if not match:
        raise AssertionError(f"missing frontmatter key: {key}")
    return match.group(1).strip().strip('"').strip("'")


class SkillContractTests(unittest.TestCase):
    def test_trigger_description_is_specific_and_trigger_only(self):
        text = SKILL_PATH.read_text(encoding="utf-8")
        description = frontmatter_value(text, "description")

        self.assertTrue(description.startswith("Use when"))
        self.assertLess(len(description), 500)
        for phrase in (
            "cleanup",
            "trigger descriptions",
            "duplicated",
            "rarely used",
            "fail to trigger",
            "trigger incorrectly",
        ):
            self.assertIn(phrase, description)
        for workflow_shortcut in ("first scan", "then classify", "finally delete"):
            self.assertNotIn(workflow_shortcut, description.lower())

    def test_skill_contains_safety_contract_and_reference_links(self):
        text = SKILL_PATH.read_text(encoding="utf-8")

        for required in (
            "read-only",
            "mtime is not usage evidence",
            "second explicit confirmation",
            "references/description-guide.md",
            "references/safety-policy.md",
        ):
            self.assertIn(required, text)

    def test_skill_has_no_scaffold_placeholders(self):
        text = SKILL_PATH.read_text(encoding="utf-8")
        self.assertNotRegex(text, r"TODO|\[TODO|Structuring This Skill")

    def test_openai_metadata_invokes_the_skill(self):
        text = OPENAI_YAML.read_text(encoding="utf-8")
        self.assertIn('display_name: "Skill Curator"', text)
        self.assertIn("$skill-curator", text)

    def test_single_file_version_preserves_safety_boundaries(self):
        text = SINGLE_FILE.read_text(encoding="utf-8")
        for required in (
            "read-only",
            "mtime is not usage evidence",
            "second explicit confirmation",
            "paste the directory listing",
            "Fact",
            "Heuristic",
            "Unknown",
        ):
            self.assertIn(required, text)


if __name__ == "__main__":
    unittest.main()
