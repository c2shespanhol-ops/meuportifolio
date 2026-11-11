#!/usr/bin/env python3
import html
import os
import re
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
            fontSize=17, leading=20, spaceAfter=3, textColor=colors.HexColor("#1E2328")),
        "h2": ParagraphStyle("resume_h2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=10, leading=12, spaceBefore=7, spaceAfter=3, textColor=colors.HexColor("#26505A")),
        "h3": ParagraphStyle("resume_h3", parent=base["Heading3"], fontName="Helvetica-Bold",
            fontSize=9, leading=10.5, spaceBefore=4, spaceAfter=1, textColor=colors.HexColor("#1E2328")),
        "p": ParagraphStyle("resume_p", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.4, leading=10.2, spaceAfter=2.2, textColor=colors.HexColor("#1E2328")),
        "meta": ParagraphStyle("resume_meta", parent=base["BodyText"], fontName="Helvetica",
            fontSize=7.7, leading=9, spaceAfter=2, textColor=colors.HexColor("#26505A")),
        "li": ParagraphStyle("resume_li", parent=base["BodyText"], fontName="Helvetica",
            fontSize=8.2, leading=9.8, leftIndent=9, firstLineIndent=-6, spaceAfter=1.5,
            textColor=colors.HexColor("#1E2328")),
    }

    story = []
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
            is_meta = "|" in text and any(token in text for token in ("RJ", "Brazil", "Niterói"))
            story.append(Paragraph(safe, styles["meta"] if is_meta else styles["p"]))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.build(story)

output_dir = os.path.join(ROOT, "_site", "cv")
build_pdf(os.path.join(ROOT, "cv", "cv-pt.html"),
          os.path.join(output_dir, "Cleyton-Hespanhol-Product-Owner-PT.pdf"), "pt")
build_pdf(os.path.join(ROOT, "cv", "cv-en.html"),
          os.path.join(output_dir, "Cleyton-Hespanhol-Product-Owner-EN.pdf"), "en")
print("Portuguese and English CV PDFs generated from the current HTML sources.")
