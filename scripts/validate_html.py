#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import re, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else "_site").resolve()
errors=[]
class Audit(HTMLParser):
 def __init__(self,page):
  super().__init__(convert_charrefs=True); self.page=page; self.ids=set(); self.stack=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if "id" in a:
   if a["id"] in self.ids: errors.append(f"{self.page}: duplicate id {a['id']}")
   self.ids.add(a["id"])
  if tag=="img" and "alt" not in a: errors.append(f"{self.page}: image missing alt attribute")
  if tag in ("li","h1","h2","h3","h4"): self.stack.append((tag,False))
  if tag in ("a","link","script","img","source"):
   attr="href" if tag in ("a","link") else "src"
   if a.get(attr): self.check_local(a[attr])
 def handle_data(self,data):
  if data.strip():
   for i,(tag,seen) in enumerate(self.stack): self.stack[i]=(tag,True)
 def handle_endtag(self,tag):
  if tag in ("li","h1","h2","h3","h4"):
   for i in range(len(self.stack)-1,-1,-1):
    if self.stack[i][0]==tag:
     t,seen=self.stack.pop(i)
     if not seen: errors.append(f"{self.page}: empty <{tag}>")
     break
 def check_local(self,value):
  if not value or value.startswith(("#","http:","https:","mailto:","tel:","data:","javascript:")): return
  target=unquote(urlparse(value).path)
  if not target: return
  resolved=((root/self.page).parent/target).resolve() if not target.startswith("/") else (root/target.lstrip("/")).resolve()
  if not resolved.exists(): errors.append(f"{self.page}: missing local resource {value}")
pages=list(root.rglob("*.html"))
for page in pages:
 source=page.read_text(encoding="utf-8"); rel=page.relative_to(root)
 if 'name="viewport"' not in source.lower(): errors.append(f"{rel}: missing viewport meta")
 theme_links=len(re.findall(r'<link\b[^>]*href=["\'][^"\']*portfolio-theme\.css[^"\']*["\'][^>]*>',source,re.I))
 if theme_links!=1: errors.append(f"{rel}: expected exactly one shared stylesheet link, found {theme_links}")
 parser=Audit(rel); parser.feed(source)
if errors: print("\n".join(errors)); raise SystemExit(1)
print(f"HTML audit passed: {len(pages)} pages checked.")
