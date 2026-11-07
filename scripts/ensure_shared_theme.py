#!/usr/bin/env python3
from pathlib import Path
import os, re, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else "_site").resolve()
theme=root/"portfolio-theme.css"
if not theme.is_file(): raise SystemExit("Shared stylesheet not found")
pattern=re.compile(r'<link\b[^>]*href=["\'][^"\']*portfolio-theme\.css[^"\']*["\'][^>]*>',re.I)
count=0
for page in root.rglob("*.html"):
 source=page.read_text(encoding="utf-8")
 relative=os.path.relpath(theme,page.parent).replace(os.sep,"/")
 href=relative+"?v=20261107-ux"
 matches=list(pattern.finditer(source))
 if matches:
  first=matches[0].group(0)
  first=re.sub(r'href=(["\']).*?\1',f'href="{href}"',first,count=1,flags=re.I)
  n=[0]
  def keep_one(match):
   n[0]+=1
   return first if n[0]==1 else ""
  source=pattern.sub(keep_one,source)
 else:
  link=f'<link rel="stylesheet" href="{href}">\n'
  source=re.sub(r"</head>",link+"</head>",source,count=1,flags=re.I)
 if 'name="viewport"' not in source.lower():
  source=re.sub(r"<head([^>]*)>",r'<head\1>\n<meta name="viewport" content="width=device-width, initial-scale=1">',source,count=1,flags=re.I)
 page.write_text(source,encoding="utf-8")
 count+=1
print(f"Shared stylesheet deduplicated and refreshed on {count} HTML pages.")
