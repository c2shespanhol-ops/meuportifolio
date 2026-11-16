#!/usr/bin/env python3
"""Validate generated Portuguese and English recruiter CV PDFs."""
from pathlib import Path
import re
import sys

from pypdf import PdfReader

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "_site/cv")
CHECKS = {
    "Cleyton-Hespanhol-Product-Owner-PT.pdf": [
        "Cleyton S. Hespanhol", "Product Owner | UX", "+55 (21) 98631-4378", "SHV Energy", "71%", "Supergasbras",
        "Peixe Urbano", "Nextel", "Contax", "Maricá",
    ],
    "Cleyton-Hespanhol-Product-Owner-EN.pdf": [
        "Cleyton S. Hespanhol", "Product Owner | UX", "+55 (21) 98631-4378", "SHV Energy", "71%", "Supergasbras",
        "Urban Fish", "Nextel", "Contax", "Maricá",
    ],
}
FORBIDDEN = ("Jan 2018 – Jun 2024", "jan/2018 – jun/2024", "Niterói", "PRODUTO DIGITAL")

def validate(path: Path, required: list[str]) -> None:
    if not path.is_file():
        raise AssertionError(f"{path}: generated PDF is missing")
    if path.stat().st_size < 1024:
        raise AssertionError(f"{path}: PDF is unexpectedly small")
    with path.open("rb") as file:
        if file.read(5) != b"%PDF-":
            raise AssertionError(f"{path}: invalid PDF signature")

    reader = PdfReader(str(path), strict=True)
    if reader.is_encrypted:
        raise AssertionError(f"{path}: PDF must be readable without a password")
    if not 1 <= len(reader.pages) <= 2:
        raise AssertionError(f"{path}: expected 1-2 pages, got {len(reader.pages)}")

    metadata = reader.metadata or {}
    metadata_text = " ".join(str(value) for value in metadata.values() if value is not None)
    if re.search(r"(?:\\+?55[\\s().-]*)?21[\\s().-]*98631[\\s().-]*4378|5521986314378|98631", metadata_text):
        raise AssertionError(f"{path}: phone number must not appear in PDF metadata")
    print(f"PASS {path.name}: PDF metadata contains no phone number")

    content = " ".join(" ".join(page.extract_text() or "" for page in reader.pages).split())
    if len(content.strip()) < 500:
        raise AssertionError(f"{path}: extracted text is too short; PDF may be image-only or incomplete")
    phone_count = content.casefold().count("+55 (21) 98631-4378".casefold())
    if phone_count != 1:
        raise AssertionError(f"{path}: expected the phone number exactly once, found {phone_count}")
    missing = [term for term in required if term.casefold() not in content.casefold()]
    if missing:
        raise AssertionError(f"{path}: missing required content: {missing}")
    found = [term for term in FORBIDDEN if term.casefold() in content.casefold()]
    if found:
        raise AssertionError(f"{path}: forbidden outdated or private content found: {found}")
    print(f"PASS {path.name}: {len(reader.pages)} page(s), {len(content)} extracted characters")

def validate_html_phone_exposure() -> None:
    site_root = ROOT.parent
    expected_noindex = {
        (site_root / "cv" / "cv-pt.html").resolve(),
        (site_root / "cv" / "cv-en.html").resolve(),
    }
    pdf_link_count = 0
    noindex_pages = set()

    for html_path in site_root.rglob("*.html"):
        source = html_path.read_text(encoding="utf-8")
        source_without_whatsapp = re.sub(r"""href=["']https://wa[.]me/[^"']*["']""", "", source, flags=re.I)
        if "98631" in source_without_whatsapp or "5521986314378" in source_without_whatsapp:
            raise AssertionError(f"{html_path}: phone number must not appear in visible HTML or non-WhatsApp attributes")

        for match in re.finditer(r"""<a\b[^>]*\bhref\s*=\s*(["'])([^"']+\.pdf(?:[?#][^"']*)?)\1[^>]*>""", source, flags=re.I):
            pdf_link_count += 1
            tag = match.group(0)
            rel_match = re.search(r""" \brel\s*=\s*(["'])(.*?)\1""".strip(), tag, flags=re.I)
            rel_tokens = set(rel_match.group(2).lower().split()) if rel_match else set()
            if not {"nofollow", "noopener"}.issubset(rel_tokens):
                raise AssertionError(f'{html_path}: PDF link must include rel="nofollow noopener"')

        robots_tags = re.findall(r"""<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex[^"']*["'])[^>]*>""", source, flags=re.I)
        if robots_tags:
            noindex_pages.add(html_path.resolve())
        if html_path.resolve() in expected_noindex:
            if len(robots_tags) != 1 or not re.search(r"""content=["']noindex\s*,\s*nofollow["']""", robots_tags[0], flags=re.I):
                raise AssertionError(f"{html_path}: expected exactly one robots noindex,nofollow directive")
        elif robots_tags:
            raise AssertionError(f"{html_path}: noindex is only permitted on the two CV HTML pages")

    if noindex_pages != expected_noindex:
        raise AssertionError("noindex directives must exist only on cv/cv-pt.html and cv/cv-en.html")
    if pdf_link_count != 4:
        raise AssertionError(f"Expected 4 PDF links across the site, found {pdf_link_count}")

    sitemap_path = site_root / "sitemap.xml"
    sitemap = sitemap_path.read_text(encoding="utf-8")
    if re.search(r"\.pdf(?:[?#<]|$)", sitemap, flags=re.I):
        raise AssertionError("PDF URLs must not appear in sitemap.xml")
    sitemap_count = len(re.findall(r"<url>\s*<loc>", sitemap, flags=re.I))

    robots_path = site_root / "robots.txt"
    robots = robots_path.read_text(encoding="utf-8")
    if "Disallow: /meuportifolio/cv/*.pdf" not in robots:
        raise AssertionError("robots.txt must disallow the portfolio PDF path")

    print(f"PASS HTML privacy: {pdf_link_count} PDF links use nofollow noopener; noindex,nofollow appears on exactly 2 CV HTML pages; sitemap has {sitemap_count} URLs and 0 PDF URLs; robots.txt disallows CV PDFs.")
    print("PASS phone exposure: phone number remains in the PDFs and the existing wa.me link only.")

for filename, required_terms in CHECKS.items():
    validate(ROOT / filename, required_terms)

validate_html_phone_exposure()
print("CV PDF validation passed for Portuguese and English versions.")
