#!/usr/bin/env python3
"""Centralize visible HTML/CSS colors in the canonical HS MIND tokens."""
from decimal import Decimal
from pathlib import Path
import re
import sys

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
THEME = ROOT / "portfolio-theme.css"
if not THEME.is_file():
    raise SystemExit("Canonical portfolio-theme.css not found")

# Legacy and approved palette hex values map to semantic tokens.
HEX_TO_TOKEN = {
    "#" + "1E2328": "--pbos-bg", "#" + "080d12": "--pbos-bg", "#" + "0A0D12": "--pbos-bg",
    "#" + "26505A": "--pbos-surface", "#" + "111820": "--pbos-surface", "#" + "0F151C": "--pbos-surface",
    "#" + "151e27": "--pbos-surface-2",
    "#" + "DAAF57": "--pbos-gold", "#" + "DEB758": "--pbos-gold", "#" + "A88F5B": "--pbos-gold", "#" + "e8b83f": "--pbos-gold",
    "#" + "F5F7FA": "--pbos-text", "#" + "F7F8FA": "--pbos-text", "#" + "f4f5f7": "--pbos-text",
    "#" + "C4CDD3": "--pbos-muted", "#" + "AEB5BD": "--pbos-muted", "#" + "aeb7c0": "--pbos-muted",
    "#" + "7FB2DC": "--pbos-blue", "#" + "4bbbc6": "--pbos-blue", "#" + "72d0d8": "--pbos-blue",
    "#" + "14100A": "--pbos-ink", "#" + "101419": "--pbos-ink",
    "#" + "89949e": "--pbos-muted", "#" + "59636B": "--pbos-muted",
}
RGB_TO_BASE = {
    (30, 35, 40): ("header-overlay", (8, 13, 18)),
    (11, 12, 14): ("header-overlay", (8, 13, 18)),
    (38, 80, 90): ("surface", (17, 24, 32)),
    (218, 175, 87): ("gold", (232, 184, 63)),
    (168, 143, 91): ("gold", (232, 184, 63)),
    (232, 184, 63): ("gold", (232, 184, 63)),
    (127, 178, 220): ("blue", (75, 187, 198)),
    (75, 187, 198): ("blue", (75, 187, 198)),
    (10, 13, 18): ("bg", (8, 13, 18)),
    (8, 13, 18): ("bg", (8, 13, 18)),
    (15, 21, 28): ("surface", (17, 24, 32)),
    (17, 24, 32): ("surface", (17, 24, 32)),
    (21, 30, 39): ("surface-2", (21, 30, 39)),
    (174, 181, 189): ("muted", (174, 183, 192)),
    (196, 205, 211): ("muted", (174, 183, 192)),
    (174, 183, 192): ("muted", (174, 183, 192)),
    (247, 248, 250): ("text", (244, 245, 247)),
    (245, 247, 250): ("text", (244, 245, 247)),
    (240, 246, 252): ("text", (244, 245, 247)),
    (255, 255, 255): ("text", (244, 245, 247)),
    (244, 245, 247): ("text", (244, 245, 247)),
    (0, 0, 0): ("ink", (16, 20, 25)),
    (16, 20, 25): ("ink", (16, 20, 25)),
}
GENERATED = {}
COLOR_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)", re.I)
ROOT_RE = re.compile(r"(:root\s*\{)(.*?)(\})", re.I | re.S)
STYLE_BLOCK_RE = re.compile(r"(<style\b[^>]*>)(.*?)(</style\s*>)", re.I | re.S)
STYLE_ATTR_RE = re.compile(r'(\bstyle\s*=\s*)(["\'])(.*?)\2', re.I | re.S)
RGBA_RE = re.compile(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)", re.I)

def replace_colors(source):
    for literal, token in HEX_TO_TOKEN.items():
        source = re.sub(re.escape(literal) + r"(?![0-9a-fA-F])", f"var({token})", source, flags=re.I)

    def replace_rgba(match):
        rgb = tuple(int(match.group(i)) for i in (1, 2, 3))
        mapped = RGB_TO_BASE.get(rgb)
        if not mapped:
            return match.group(0)
        semantic, target_rgb = mapped
        alpha = match.group(4)
        if alpha is None or Decimal(alpha) >= Decimal("0.999"):
            return f"var(--pbos-{semantic})"
        slug = f"{int((Decimal(alpha) * 1000).quantize(Decimal('1'))):03d}"
        token = f"--pbos-{semantic}-alpha-{slug}"
        alpha_text = format(Decimal(alpha).normalize(), "f")
        GENERATED[token] = f"rgba({target_rgb[0]},{target_rgb[1]},{target_rgb[2]},{alpha_text})"
        return f"var({token})"

    return RGBA_RE.sub(replace_rgba, source)

def normalize_html(source):
    source = STYLE_BLOCK_RE.sub(
        lambda m: m.group(1) + replace_colors(m.group(2)) + m.group(3),
        source,
    )
    return STYLE_ATTR_RE.sub(
        lambda m: m.group(1) + m.group(2) + replace_colors(m.group(3)) + m.group(2),
        source,
    )

def append_tokens():
    if not GENERATED:
        return
    source = THEME.read_text(encoding="utf-8")

    def add(match):
        content = match.group(2)
        declared = set(re.findall(r"(--[a-zA-Z0-9_-]+)\s*:", content))
        additions = [
            f"  {name}: {value};"
            for name, value in sorted(GENERATED.items())
            if name not in declared
        ]
        if additions:
            content = content.rstrip() + "\n\n  /* Alpha tokens generated from inline page styles. */\n"
            content += "\n".join(additions) + "\n"
        return match.group(1) + content + match.group(3)

    source, count = ROOT_RE.subn(add, source, count=1)
    if count != 1:
        raise SystemExit("Could not add generated alpha tokens to canonical theme")
    THEME.write_text(source, encoding="utf-8")

def main():
    changed = 0
    for path in ROOT.rglob("*.css"):
        original = path.read_text(encoding="utf-8")
        if path.resolve() == THEME.resolve():
            match = ROOT_RE.search(original)
            if match:
                prefix = replace_colors(original[:match.start()])
                root_block = original[match.start():match.end()]
                suffix = replace_colors(original[match.end():])
                normalized = prefix + root_block + suffix
            else:
                normalized = replace_colors(original)
        else:
            normalized = replace_colors(original)
        if normalized != original:
            path.write_text(normalized, encoding="utf-8")
            changed += 1

    for path in ROOT.rglob("*.html"):
        original = path.read_text(encoding="utf-8")
        normalized = normalize_html(original)
        if normalized != original:
            path.write_text(normalized, encoding="utf-8")
            changed += 1

    append_tokens()
    print(
        f"Palette tokenization completed: {changed} HTML/CSS files updated; "
        f"{len(GENERATED)} alpha tokens centralized."
    )

if __name__ == "__main__":
    main()
