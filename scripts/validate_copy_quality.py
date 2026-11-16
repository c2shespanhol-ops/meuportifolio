#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import re, sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
errors = []

class CopyAudit(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "code", "pre", "svg"):
            self.skip += 1
        attrs = dict(attrs)
        inline_style = attrs.get("style", "")
        if re.search(r"word-break\s*:\s*break-all", inline_style, re.I):
            errors.append(f"{self.path}: forced break-all in inline style")
        if re.search(r"hyphens\s*:\s*auto", inline_style, re.I):
            errors.append(f"{self.path}: automatic hyphenation in inline style")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "code", "pre", "svg") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if self.skip or not data.strip():
            return
        text = data.strip()
        if re.search(r"\s{2,}", text):
            errors.append(f"{self.path}: repeated spaces: {text[:100]}")
        if re.search(r"\s+[,.!?;:]", text):
            errors.append(f"{self.path}: space before punctuation: {text[:100]}")
        if re.search(r"\b([A-Za-zÀ-ÿ]{3,})\s+\1\b", text, re.I):
            errors.append(f"{self.path}: repeated word: {text[:100]}")

pages = list(root.rglob("*.html"))
for page in pages:
    source = page.read_text(encoding="utf-8")
    audit = CopyAudit(page.relative_to(root))
    audit.feed(source)
    for match in re.finditer(r"<style\b[^>]*>(.*?)</style>", source, re.I | re.S):
        css = match.group(1)
        for block in re.finditer(r"([^{}]+)\{([^{}]+)\}", css):
            selector, declarations = block.group(1), block.group(2)
            if re.search(r"overflow-wrap\s*:\s*anywhere", declarations, re.I) and not re.search(r"(^|,)\s*(pre|code)(\s|,|$)", selector, re.I):
                errors.append(f"{page.relative_to(root)}: arbitrary word breaking in {selector.strip()[:90]}")
            if re.search(r"word-break\s*:\s*break-all|hyphens\s*:\s*auto", declarations, re.I):
                errors.append(f"{page.relative_to(root)}: forced word fragmentation in {selector.strip()[:90]}")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print(f"Copy and text-wrapping audit passed: {len(pages)} HTML pages checked.")
