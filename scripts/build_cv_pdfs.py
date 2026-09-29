#!/usr/bin/env python3
import html, os, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.units import mm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def extract_sections(source):
    body = re.search(r"<body>(.*?)</body>", source, re.I | re.S)
    if not body:
        raise ValueError("CV body not found")
    items = []
    pattern = re.compile(r"<(h1|h2|h3|p|li)\b[^>]*>(.*?)</\1>", re.I | re.S)
    for tag, raw in pattern.findall(body.group(1)):
        text = re.sub(r"<[^>]+>", "", raw)
        text = re.sub(r"\s+", " ", html.unescape(text)).strip()
        if text:
            items.append((tag.lower(), text))
    return items

def build_pdf(source_path, output_path):
    with open(source_path, encoding="utf-8") as f:
        source = f.read()
    doc = SimpleDocTemplate(output_path, pagesize=A4,
        rightMargin=15*mm, leftMargin=15*mm, topMargin=13*mm, bottomMargin=13*mm,
        title="Cleyton S. Hespanhol - Product Owner", author="Cleyton S. Hespanhol")
    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle("h1x", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=18, leading=21, spaceAfter=3),
        "h2": ParagraphStyle("h2x", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, spaceBefore=8, spaceAfter=4),
        "h3": ParagraphStyle("h3x", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=9.2, leading=11.5, spaceBefore=4, spaceAfter=1.5),
        "p": ParagraphStyle("px", parent=base["BodyText"], fontName="Helvetica", fontSize=8.3, leading=10.8, spaceAfter=3),
        "meta": ParagraphStyle("mx", parent=base["BodyText"], fontName="Helvetica", fontSize=7.7, leading=9.8, spaceAfter=3, textColor="#555555"),
        "li": ParagraphStyle("lx", parent=base["BodyText"], fontName="Helvetica", fontSize=8.15, leading=10.5, leftIndent=10, firstLineIndent=-6, spaceAfter=2),
    }
    story=[]
    for tag, text in extract_sections(source):
        safe=html.escape(text)
        if tag=="h1": story.append(Paragraph(safe, styles["h1"]))
        elif tag=="h2": story.append(Paragraph(safe, styles["h2"]))
        elif tag=="h3": story.append(Paragraph(safe, styles["h3"]))
        elif tag=="li": story.append(Paragraph("• "+safe, styles["li"]))
        else:
            style=styles["meta"] if "|" in text and ("RJ" in text or "Brazil" in text) else styles["p"]
            story.append(Paragraph(safe, style))
    doc.build(story)

out=os.path.join(ROOT,"_site","cv")
os.makedirs(out,exist_ok=True)
build_pdf(os.path.join(ROOT,"cv","cv-pt.html"), os.path.join(out,"Cleyton-Hespanhol-Product-Owner-PT.pdf"))
build_pdf(os.path.join(ROOT,"cv","cv-en.html"), os.path.join(out,"Cleyton-Hespanhol-Product-Owner-EN.pdf"))
print("CV PDFs generated.")
