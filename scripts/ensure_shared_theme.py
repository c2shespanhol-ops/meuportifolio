#!/usr/bin/env python3
from pathlib import Path
import os, re, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else "_site").resolve()
theme=root/"portfolio-theme.css"
if not theme.is_file(): raise SystemExit("Shared stylesheet not found")
count=0
for page in root.rglob("*.html"):
 source=page.read_text(encoding="utf-8")
 relative=os.path.relpath(theme,page.parent).replace(os.sep,"/")
 href=relative+"?v=20261107-ux"
 if "portfolio-theme.css" in source:
  source=re.sub(r'((?:\.\./)*portfolio-theme\.css)(?:\?[^"\']*)?',href,source)
 else:
  link=f'<link rel="stylesheet" href="{href}">\n'
  source=re.sub(r"</head>",link+"</head>",source,count=1,flags=re.I)
 if 'name="viewport"' not in source.lower():
  source=re.sub(r"<head([^>]*)>",r'<head\1>\n<meta name="viewport" content="width=device-width, initial-scale=1">',source,count=1,flags=re.I)
 page.write_text(source,encoding="utf-8"); count+=1
print(f"Shared stylesheet and responsive viewport applied to {count} HTML pages.")
