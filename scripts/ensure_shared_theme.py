#!/usr/bin/env python3
from pathlib import Path
import os, re, sys

root=Path(sys.argv[1] if len(sys.argv)>1 else "_site").resolve()
theme=root/"portfolio-theme.css"
if not theme.is_file():
 raise SystemExit("Shared stylesheet not found")

pattern=re.compile(r'<link\b[^>]*href=["\'][^"\']*portfolio-theme\.css[^"\']*["\'][^>]*>',re.I)
theme_meta=re.compile(r'<meta\b(?=[^>]*\bname=["\']theme-color["\'])[^>]*>',re.I)

def normalize_theme_color(match):
 tag=match.group(0)
 if re.search(r'\bcontent\s*=',tag,re.I):
  return re.sub(r'\bcontent\s*=\s*(["\']).*?\1','content="#1E2328"',tag,count=1,flags=re.I)
 return tag[:-1]+' content="#1E2328">'

legacy_palette = (
 ("#0A0D12", "#1E2328"),
 ("#AEB5BD", "#C4CDD3"),
 ("#DEB758", "#DAAF57"),
 ("#F7F8FA", "#F5F7FA"),
 ("#9EA5AD", "#C4CDD3"),
 ("#74A9D5", "#26505A"),
 ("#0C1319", "#26505A"),
 ("#0F1D28", "#26505A"),
 ("#101317", "#1E2328"),
 ("rgba(10,13,18", "rgba(30,35,40"),
 ("rgba(222,183,88", "rgba(218,175,87"),
 ("rgba(247,248,250", "rgba(245,247,250"),
 ("rgba(116,169,213", "rgba(38,80,90"),
)

def normalize_palette(source):
 for old, new in legacy_palette:
  source = source.replace(old, new)
 return source

# Normalize shared stylesheets and SVG assets before publishing.
for asset in root.rglob("*"):
 if asset.is_file() and asset.suffix.lower() in {".css", ".svg"}:
  source = asset.read_text(encoding="utf-8")
  normalized = normalize_palette(source)
  if normalized != source:
   asset.write_text(normalized, encoding="utf-8")

count=0
for page in root.rglob("*.html"):
 source=normalize_palette(page.read_text(encoding="utf-8"))
 if theme_meta.search(source):
  source=theme_meta.sub(normalize_theme_color,source,count=1)
 else:
  source=re.sub(r"</head>",'<meta name="theme-color" content="#1E2328">\n</head>',source,count=1,flags=re.I)

 relative=os.path.relpath(theme,page.parent).replace(os.sep,"/")
 href=relative+"?v=20261114-palette"
 source=pattern.sub("",source)
 link=f'<link rel="stylesheet" href="{href}">'
 if re.search(r"</body>",source,re.I):
  source=re.sub(r"</body>",link+"\n</body>",source,count=1,flags=re.I)
 else:
  source=re.sub(r"</head>",link+"\n</head>",source,count=1,flags=re.I)

 if 'name="viewport"' not in source.lower():
  source=re.sub(r"<head([^>]*)>",r'<head\1>\n<meta name="viewport" content="width=device-width, initial-scale=1">',source,count=1,flags=re.I)

 page.write_text(source,encoding="utf-8")
 count+=1

print(f"Canonical portfolio stylesheet moved to the end of {count} HTML pages.")
