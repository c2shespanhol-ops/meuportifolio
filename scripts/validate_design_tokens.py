#!/usr/bin/env python3
"""Validate HS MIND palette tokens and reject hard-coded colors in published styles."""
from pathlib import Path
import re
import sys

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_ROOT
SCAN_HTML_STYLES = len(sys.argv) > 1
CANONICAL_THEME = "portfolio-theme.css"
PALETTE = {
    "--pbos-bg": "#0A0D12",
    "--pbos-surface": "#0F151C",
    "--pbos-surface-2": "var(--pbos-surface)",
    "--pbos-gold": "#A88F5B",
    "--pbos-blue": "#7FB2DC",
    "--pbos-text": "#F7F8FA",
    "--pbos-muted": "#AEB5BD",
    "--pbos-ink": "#14100A",
}
COLOR_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)", re.I)
ROOT_RE = re.compile(r":root\s*\{([^}]*)\}", re.I | re.S)
COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)
STYLE_BLOCK_RE = re.compile(r"<style\b[^>]*>(.*?)</style\s*>", re.I | re.S)
STYLE_ATTR_RE = re.compile(r'\bstyle\s*=\s*(["\'])(.*?)\1', re.I | re.S)
EXCEPTIONS = {"#000", "#fff"}
EXPECTED_EXCEPTIONS = {
    "artifact.css": {"#000": 2, "#fff": 1},
    "portfolio-theme.css": {"#000": 3},
    "site.css": {"#000": 1, "#fff": 1},
}

def norm(value):
    return re.sub(r"\s+", "", value).lower()

def main():
    failures = []
    css_paths = sorted(ROOT.rglob("*.css"))
    if not css_paths:
        failures.append("No CSS files found.")

    for path in css_paths:
        relative = path.relative_to(ROOT).as_posix()
        source = COMMENT_RE.sub("", path.read_text(encoding="utf-8"))
        colors = [norm(value) for value in COLOR_RE.findall(source)]
        if relative == CANONICAL_THEME:
            roots = list(ROOT_RE.finditer(source))
            if len(roots) != 1:
                failures.append(f"{relative}: expected exactly one :root token block, found {len(roots)}")
                continue
            root = roots[0]
            root_source = root.group(1)
            for token, value in PALETTE.items():
                declaration = re.compile(re.escape(token) + r"\s*:\s*" + re.escape(value) + r"\s*;", re.I)
                if len(declaration.findall(root_source)) != 1:
                    failures.append(f"{relative}: {token} must define {value} exactly once")
            outside = source[:root.start()] + source[root.end():]
            outside_colors = [norm(value) for value in COLOR_RE.findall(outside)]
            unexpected = [value for value in outside_colors if value not in EXCEPTIONS]
            if unexpected:
                failures.append(f"{relative}: literal colors outside canonical :root: {unexpected[:10]}")
            exceptions = {value: outside_colors.count(value) for value in EXCEPTIONS if outside_colors.count(value)}
        else:
            unexpected = [value for value in colors if value not in EXCEPTIONS]
            if unexpected:
                failures.append(f"{relative}: hard-coded colors outside canonical tokens: {unexpected[:10]}")
            exceptions = {value: colors.count(value) for value in EXCEPTIONS if colors.count(value)}
        expected = EXPECTED_EXCEPTIONS.get(relative, {})
        if exceptions != expected:
            failures.append(f"{relative}: print exceptions changed; expected {expected}, found {exceptions}")

    if SCAN_HTML_STYLES:
        for path in ROOT.rglob("*.html"):
            source = COMMENT_RE.sub("", path.read_text(encoding="utf-8"))
            styles = STYLE_BLOCK_RE.findall(source)
            styles.extend(match.group(2) for match in STYLE_ATTR_RE.finditer(source))
            for style in styles:
                colors = [norm(value) for value in COLOR_RE.findall(style)]
                unexpected = [value for value in colors if value not in EXCEPTIONS]
                if unexpected:
                    failures.append(
                        f"{path.relative_to(ROOT)}: hard-coded colors remain in HTML styles: {unexpected[:8]}"
                    )

    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1

    mode = "; HTML inline styles checked" if SCAN_HTML_STYLES else ""
    print(
        f"HS MIND design-token audit passed: {len(css_paths)} CSS files scanned; "
        f"eight approved palette tokens verified; no noncanonical color literals remain{mode}. "
        "Only documented print/identity #fff and #000 exceptions remain."
    )
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
