#!/usr/bin/env python3
from pathlib import Path
import os, re, sys

root=Path(sys.argv[1] if len(sys.argv)>1 else "_site").resolve()
theme=root/"portfolio-theme.css"
if not theme.is_file():
 raise SystemExit("Shared stylesheet not found")

theme_link_pattern=re.compile(r'<link\b[^>]*href=["\'][^"\']*portfolio-theme\.css[^"\']*["\'][^>]*>',re.I)
stylesheet_pattern=re.compile(r'<link\b(?=[^>]*\brel=["\']stylesheet["\'])[^>]*>',re.I)
theme_meta=re.compile(r'<meta\b(?=[^>]*\bname=["\']theme-color["\'])[^>]*>',re.I)

def normalize_theme_color(match):
 tag=match.group(0)
 if re.search(r'\bcontent\s*=',tag,re.I):
  return re.sub(r'\bcontent\s*=\s*(["\']).*?\1','content="#080d12"',tag,count=1,flags=re.I)
 return tag[:-1]+' content="#1E2328">'

legacy_palette = (
 ("#0A0D12", "#080d12"),
 ("#AEB5BD", "#aeb7c0"),
 ("#DEB758", "#e8b83f"),
 ("#F7F8FA", "#f4f5f7"),
 ("#9EA5AD", "#aeb7c0"),
 ("#74A9D5", "#4bbbc6"),
 ("#0C1319", "#111820"),
 ("#0F1D28", "#151e27"),
 ("#101317", "#080d12"),
 ("rgba(10,13,18", "rgba(8,13,18"),
 ("rgba(222,183,88", "rgba(232,184,63"),
 ("rgba(247,248,250", "rgba(244,245,247"),
 ("rgba(116,169,213", "rgba(75,187,198"),
)

def normalize_palette(source):
 for old, new in legacy_palette:
  source = source.replace(old, new)
 return source

# Normalize stylesheet and SVG source files in the generated site.
for asset in root.rglob("*"):
 if asset.is_file() and asset.suffix.lower() in {".css", ".svg"}:
  original = asset.read_text(encoding="utf-8")
  normalized = normalize_palette(original)
  if normalized != original:
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
 source=theme_link_pattern.sub("",source)

 styles=[]
 seen=set()
 def collect_stylesheet(match):
  tag=match.group(0)
  href_match=re.search(r'\bhref=["\']([^"\']+)["\']',tag,re.I)
  key=href_match.group(1) if href_match else tag
  if key not in seen:
   seen.add(key)
   styles.append(tag)
  return ""
 source=stylesheet_pattern.sub(collect_stylesheet,source)
 theme_link=f'<link rel="stylesheet" href="{href}">'
 style_block="\n".join(styles+[theme_link])
 if re.search(r"</head>",source,re.I):
  source=re.sub(r"</head>",style_block+"\n</head>",source,count=1,flags=re.I)
 else:
  source=style_block+"\n"+source

 if 'name="viewport"' not in source.lower():
  source=re.sub(r"<head([^>]*)>",r'<head\1>\n<meta name="viewport" content="width=device-width, initial-scale=1">',source,count=1,flags=re.I)

 page.write_text(source,encoding="utf-8")
 count+=1

print(f"Stylesheets deduplicated and canonical portfolio theme loaded last in the head of {count} HTML pages.")
