#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import re,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else "_site").resolve()
errors=[]
class CopyAudit(HTMLParser):
 def __init__(self,path):
  super().__init__(convert_charrefs=True); self.path=path; self.skip=0
 def handle_starttag(self,tag,attrs):
  if tag in ("script","style","code","pre"): self.skip+=1
 def handle_endtag(self,tag):
  if tag in ("script","style","code","pre") and self.skip: self.skip-=1
 def handle_data(self,data):
  if self.skip or not data.strip(): return
  text=data.strip()
  if re.search(r"\s{2,}",text): errors.append(f"{self.path}: repeated spaces: {text[:100]}")
  if re.search(r"\s+[,.!?;:]",text): errors.append(f"{self.path}: space before punctuation: {text[:100]}")
  if re.search(r"\b([A-Za-zÀ-ÿ]{3,})\s+\1\b",text,re.I): errors.append(f"{self.path}: repeated word: {text[:100]}")
pages=list(root.rglob("*.html"))
for page in pages:
 audit=CopyAudit(page.relative_to(root)); audit.feed(page.read_text(encoding="utf-8"))
if errors: print("\n".join(errors)); raise SystemExit(1)
print(f"Copy spacing audit passed: {len(pages)} HTML pages checked.")
