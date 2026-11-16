#!/usr/bin/env python3
"""Ensure portfolio color literals stay centralized in the canonical theme."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CSS_FILES = (
    "artifact.css", "case-template.css", "pbos-career-theme.css", "portfolio-reference-refresh.css",
    "portfolio-theme-v2.css", "portfolio-theme.css", "site.css",
)
CANONICAL_THEME = "portfolio-theme.css"
PALETTE = {
    "--pbos-bg": "#0A0D12", "--pbos-surface": "#0F151C",
    "--pbos-gold": "#A88F5B", "--pbos-blue": "#7FB2DC",
    "--pbos-text": "#F7F8FA", "--pbos-muted": "#AEB5BD",
    "--pbos-ink": "#14100A",
}
TRANSPARENCY = {
    "rgba(127,178,220,.06)", "rgba(127,178,220,.09)",
    "rgba(10,13,18,.88)", "rgba(10,13,18,.4)",
    "rgba(15,21,28,.42)", "rgba(15,21,28,.82)", "rgba(15,21,28,.96)",
    "rgba(10,13,18,.16)", "rgba(10,13,18,.20)", "rgba(10,13,18,.35)",
    "rgba(174,181,189,.20)", "rgba(174,181,189,.16)", "rgba(174,181,189,.18)",
    "rgba(127,178,220,.25)", "rgba(168,143,91,.30)", "rgba(168,143,91,.22)",
    "rgba(168,143,91,.34)", "rgba(168,143,91,.42)", "rgba(247,248,250,.12)",
    "rgba(247,248,250,.18)", "rgba(168,143,91,.02)", "rgba(168,143,91,.035)",
    "rgba(168,143,91,.045)", "rgba(168,143,91,.07)", "rgba(168,143,91,.08)",
    "rgba(168,143,91,.13)", "rgba(168,143,91,.18)", "rgba(168,143,91,.65)",
}
COLOR_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)", re.I)
ROOT_RE = re.compile(r":root\s*\{([^}]*)\}", re.I | re.S)
COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)
EXCEPTIONS = {"#000", "#fff"}
EXPECTED_EXCEPTIONS = {
    "artifact.css": {"#000": 2, "#fff": 1},
    "portfolio-theme.css": {"#000": 3},
    "site.css": {"#000": 1, "#fff": 1},
}

def normalize(value):
    return re.sub(r"\s+", "", value).lower()

def main():
    failures = []
    scanned = 0
    residual_directory = ROOT / "meuportifolio"
    if residual_directory.exists():
        failures.append("Residual directory must be removed: meuportifolio/")
    for relative in CSS_FILES:
        path = ROOT / relative
        if not path.is_file():
            failures.append(f"Missing stylesheet: {relative}")
            continue
        source = COMMENT_RE.sub("", path.read_text(encoding="utf-8"))
        scanned += 1
        colors = [normalize(value) for value in COLOR_RE.findall(source)]
        if relative == CANONICAL_THEME:
            roots = list(ROOT_RE.finditer(source))
            if len(roots) != 1:
                failures.append(f"{relative}: expected exactly one :root token block, found {len(roots)}")
                continue
            root = roots[0]
            root_colors = {normalize(value) for value in COLOR_RE.findall(root.group(1))}
            allowed_root = {normalize(value) for value in PALETTE.values()} | {normalize(value) for value in TRANSPARENCY}
            unexpected_root = sorted(root_colors - allowed_root)
            if unexpected_root:
                failures.append(f"{relative}: unapproved literal colors in canonical :root: {unexpected_root}")
            for token, value in PALETTE.items():
                declaration = re.compile(re.escape(token) + r"\s*:\s*" + re.escape(value) + r"\s*;", re.I)
                if len(declaration.findall(root.group(1))) != 1:
                    failures.append(f"{relative}: {token} must define {value} exactly once")
            outside = source[:root.start()] + source[root.end():]
            outside_colors = [normalize(value) for value in COLOR_RE.findall(outside)]
            unexpected = [value for value in outside_colors if value not in EXCEPTIONS]
            if unexpected:
                failures.append(f"{relative}: hardcoded colors outside canonical tokens: {unexpected[:12]}")
            exceptions = {value: outside_colors.count(value) for value in EXCEPTIONS if outside_colors.count(value)}
        else:
            unexpected = [value for value in colors if value not in EXCEPTIONS]
            if unexpected:
                failures.append(f"{relative}: hardcoded colors outside canonical tokens: {unexpected[:12]}")
            exceptions = {value: colors.count(value) for value in EXCEPTIONS if colors.count(value)}
        expected = EXPECTED_EXCEPTIONS.get(relative, {})
        if exceptions != expected:
            failures.append(f"{relative}: print/identity exceptions changed; expected {expected}, found {exceptions}")

    canonical_root = ROOT_RE.search(COMMENT_RE.sub("", (ROOT / CANONICAL_THEME).read_text(encoding="utf-8")))
    if not canonical_root:
        failures.append("portfolio-theme.css: canonical :root token block is missing")
    else:
        canonical_tokens = dict(re.findall(r"(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);", canonical_root.group(1)))
        if "--line" in canonical_tokens:
            failures.append("portfolio-theme.css: --line must remain page-scoped to preserve existing border transparency")

    for relative, expected_line in (
        ("site.css", "--pbos-border-light"),
        ("case-template.css", "--pbos-line"),
        ("pbos-career-theme.css", "--pbos-line"),
    ):
        source = COMMENT_RE.sub("", (ROOT / relative).read_text(encoding="utf-8"))
        declaration = re.compile(r"--line\s*:\s*var\(\s*" + re.escape(expected_line) + r"\s*\)", re.I)
        if len(declaration.findall(source)) != 1:
            failures.append(f"{relative}: --line must preserve its original {expected_line} token mapping")

    # Catch broken var(--token) references after removing duplicated local palettes.
    declared_tokens = set()
    referenced_tokens = []
    for relative in CSS_FILES:
        path = ROOT / relative
        if not path.is_file():
            continue
        source = COMMENT_RE.sub("", path.read_text(encoding="utf-8"))
        declared_tokens.update(re.findall(r"(--[a-zA-Z0-9_-]+)\s*:", source))
        referenced_tokens.extend((relative, token) for token in re.findall(r"var\(\s*(--[a-zA-Z0-9_-]+)", source))
    unresolved = sorted({f"{relative}: {token}" for relative, token in referenced_tokens if token not in declared_tokens})
    if unresolved:
        failures.append("Unresolved CSS custom properties: " + ", ".join(unresolved[:30]))

    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(
        f"Design-token audit passed: {scanned} stylesheets scanned; "
        "seven approved palette colors defined once in portfolio-theme.css; "
        "all other color literals replaced by canonical tokens. "
        "Only documented print/identity #fff and #000 exceptions remain."
    )
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
