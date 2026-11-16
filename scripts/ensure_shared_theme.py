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
  return re.sub(r'\bcontent\s*=\s*(["\']).*?\1','content="#0A0D12"',tag,count=1,flags=re.I)
 return tag[:-1]+' content="#0A0D12">'

def normalize_palette(source):
 replacements = (
  ("#"+"1E2328", "#0A0D12"),
  ("#"+"26505A", "#0F151C"),
  ("#"+"DAAF57", "#A88F5B"),
  ("#"+"DEB758", "#A88F5B"),
  ("#"+"F5F7FA", "#F7F8FA"),
  ("#"+"C4CDD3", "#AEB5BD"),
  ("#"+"080d12", "#0A0D12"),
  ("#"+"111820", "#0F151C"),
  ("#"+"151e27", "#0F151C"),
  ("#"+"f4f5f7", "#F7F8FA"),
  ("#"+"aeb7c0", "#AEB5BD"),
  ("#"+"4bbbc6", "#7FB2DC"),
  ("#"+"e8b83f", "#A88F5B"),
  ("#"+"101419", "#14100A"),
  ("#"+"72d0d8", "#7FB2DC"),
  ("#"+"89949e", "#AEB5BD"),
  ("#"+"59636B", "#AEB5BD"),
 )
 for old, new in replacements:
  source = re.sub(re.escape(old), new, source, flags=re.I)
 source = re.sub(r"rgba\(\s*232\s*,\s*184\s*,\s*63", "rgba(168,143,91", source, flags=re.I)
 source = re.sub(r"rgba\(\s*222\s*,\s*183\s*,\s*88", "rgba(168,143,91", source, flags=re.I)
 source = re.sub(r"rgba\(\s*218\s*,\s*175\s*,\s*87", "rgba(168,143,91", source, flags=re.I)
 source = re.sub(r"rgba\(\s*245\s*,\s*247\s*,\s*250", "rgba(247,248,250", source, flags=re.I)
 source = re.sub(r"rgba\(\s*174\s*,\s*183\s*,\s*192", "rgba(174,181,189", source, flags=re.I)
 source = re.sub(r"rgba?\(\s*8\s*,\s*13\s*,\s*18", "rgba(10,13,18", source, flags=re.I)
 source = re.sub(r"rgba?\(\s*17\s*,\s*24\s*,\s*32", "rgba(15,21,28", source, flags=re.I)
 source = re.sub(r"rgba?\(\s*21\s*,\s*30\s*,\s*39", "rgba(15,21,28", source, flags=re.I)
 source = re.sub(r"(--blue\s*:\s*)#(?:DEB758|A88F5B)", r"\1#7FB2DC", source, flags=re.I)
 return source


# Normalize stylesheet and SVG source files in the generated site.
for asset in root.rglob("*"):
 if asset.is_file() and asset.suffix.lower() in {".css", ".svg", ".js", ".mjs"}:
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
  source=re.sub(r"</head>",'<meta name="theme-color" content="#0A0D12">\n</head>',source,count=1,flags=re.I)

 relative=os.path.relpath(theme,page.parent).replace(os.sep,"/")
 href=relative+"?v=20261115-text-wrap-fix1"
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
