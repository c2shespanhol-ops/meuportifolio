#!/usr/bin/env python3
import html
import os
import re
import tempfile
from html.parser import HTMLParser

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_TAGS = {"h1", "h2", "h3", "p", "li"}

class ResumeTextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.current_tag = None
        self.current_text = []
        self.items = []

    def handle_starttag(self, tag, attrs):
        if tag == "br" and self.current_tag:
            self.current_text.append(" ")
        elif tag in TARGET_TAGS and self.current_tag is None:
            attr_map = dict(attrs)
            classes = attr_map.get("class", "").split()
            if not ({"cv-download", "cv-note"} & set(classes)):
                self.current_tag = tag
                self.current_text = []

    def handle_data(self, data):
        if self.current_tag:
            self.current_text.append(data)

    def handle_endtag(self, tag):
        if self.current_tag == tag:
            text = " ".join("".join(self.current_text).split())
            if text:
                self.items.append((tag, text))
            self.current_tag = None
            self.current_text = []

def extract_sections(source):
    parser = ResumeTextParser()
    parser.feed(source)
    if not parser.items:
        raise ValueError("No resume content found in source HTML")
    return parser.items

def build_pdf(source_path, output_path, language):
    with open(source_path, encoding="utf-8") as file:
        source = file.read()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=13 * mm,
        bottomMargin=13 * mm,
        title=("Cleyton S. Hespanhol - Product Owner Resume" if language == "en"
               else "Cleyton S. Hespanhol - Currículo Product Owner"),
        author="Cleyton S. Hespanhol",
    )
    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle("resume_h1", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=19, leading=23, spaceAfter=5, keepWithNext=True, textColor=colors.HexColor("#0A0D12")),
        "h2": ParagraphStyle("resume_h2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=11, leading=14, spaceBefore=9, spaceAfter=4, keepWithNext=True, textColor=colors.HexColor("#0F151C")),
        "h3": ParagraphStyle("resume_h3", parent=base["Heading3"], fontName="Helvetica-Bold",
            fontSize=9.6, leading=12, spaceBefore=5, spaceAfter=2, keepWithNext=True, textColor=colors.HexColor("#0A0D12")),
        "p": ParagraphStyle("resume_p", parent=base["BodyText"], fontName="Helvetica",
            fontSize=9.1, leading=12, spaceAfter=3, allowWidows=0, allowOrphans=0, splitLongWords=0, textColor=colors.HexColor("#0A0D12")),
        "meta": ParagraphStyle("resume_meta", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.2, leading=10, spaceAfter=2.5, allowWidows=0, allowOrphans=0, splitLongWords=0, textColor=colors.HexColor("#0F151C")),
        "li": ParagraphStyle("resume_li", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.9, leading=11.5, leftIndent=11, firstLineIndent=-7, spaceAfter=2.5, allowWidows=0, allowOrphans=0, splitLongWords=0,
            textColor=colors.HexColor("#0A0D12")),
    }

    story = []
    phone_added = False
    for tag, text in extract_sections(source):
        safe = html.escape(text)
        if tag == "h1":
            story.append(Paragraph(safe, styles["h1"]))
        elif tag == "h2":
            story.append(Paragraph(safe, styles["h2"]))
        elif tag == "h3":
            story.append(Paragraph(safe, styles["h3"]))
        elif tag == "li":
            story.append(Paragraph("&#8226; " + safe, styles["li"]))
        else:
            is_meta = "|" in text and any(token in text for token in ("RJ", "Brazil", "Maricá"))
            if is_meta and not phone_added:
                phone_label = "Phone" if language == "en" else "Telefone"
                safe = html.escape(text + f" | {phone_label}: +55 (21) 98631-4378")
                phone_added = True
            story.append(Paragraph(safe, styles["meta"] if is_meta else styles["p"]))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.build(story)

output_dir = os.path.join(ROOT, "_site", "cv")
os.makedirs(output_dir, exist_ok=True)

def build_atomically(source_path, filename, language):
    final_path = os.path.join(output_dir, filename)
    fd, temporary_path = tempfile.mkstemp(prefix=".cv-build-", suffix=".pdf", dir=output_dir)
    os.close(fd)
    try:
        build_pdf(source_path, temporary_path, language)
        with open(temporary_path, "rb") as generated:
            signature = generated.read(5)
        if signature != b"%PDF-" or os.path.getsize(temporary_path) < 1024:
            raise RuntimeError(f"Generated PDF is incomplete or invalid: {filename}")
        os.replace(temporary_path, final_path)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)

build_atomically(os.path.join(ROOT, "cv", "cv-pt.html"),
                 "Cleyton-Hespanhol-Product-Owner-PT.pdf", "pt")
build_atomically(os.path.join(ROOT, "cv", "cv-en.html"),
                 "Cleyton-Hespanhol-Product-Owner-EN.pdf", "en")
print("Portuguese and English CV PDFs generated atomically from the current HTML sources.")
