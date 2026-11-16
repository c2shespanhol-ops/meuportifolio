#!/usr/bin/env python3
"""Validate generated Portuguese and English recruiter CV PDFs."""
from pathlib import Path
import sys

from pypdf import PdfReader

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "_site/cv")
CHECKS = {
    "Cleyton-Hespanhol-Product-Owner-PT.pdf": [
        "Cleyton S. Hespanhol", "+55 (21) 98631-4378", "SHV Energy", "71%", "Supergasbras",
        "Peixe Urbano", "Nextel", "Contax", "Maricá",
    ],
    "Cleyton-Hespanhol-Product-Owner-EN.pdf": [
        "Cleyton S. Hespanhol", "SHV Energy", "71%", "Supergasbras",
        "Urban Fish", "Nextel", "Contax", "Maricá",
    ],
}
FORBIDDEN = ("Jan 2018 – Jun 2024", "jan/2018 – jun/2024")

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

    content = "\\n".join(page.extract_text() or "" for page in reader.pages)
    if len(content.strip()) < 500:
        raise AssertionError(f"{path}: extracted text is too short; PDF may be image-only or incomplete")
    missing = [term for term in required if term.casefold() not in content.casefold()]
    if missing:
        raise AssertionError(f"{path}: missing required content: {missing}")
    found = [term for term in FORBIDDEN if term.casefold() in content.casefold()]
    if found:
        raise AssertionError(f"{path}: forbidden outdated or private content found: {found}")
    print(f"PASS {path.name}: {len(reader.pages)} page(s), {len(content)} extracted characters")

for filename, required_terms in CHECKS.items():
    validate(ROOT / filename, required_terms)

print("CV PDF validation passed for Portuguese and English versions.")
