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
 return tag[:-1]+' content="#080d12">'

def normalize_palette(source):
 # Historical literals map forward to the approved HS MIND palette.
 replacements = (
  ("#"+"1E2328", "#080d12"), ("#"+"26505A", "#111820"),
  ("#"+"DAAF57", "#e8b83f"), ("#"+"DEB758", "#e8b83f"),
  ("#"+"F5F7FA", "#f4f5f7"), ("#"+"F7F8FA", "#f4f5f7"),
  ("#"+"C4CDD3", "#aeb7c0"), ("#"+"AEB5BD", "#aeb7c0"),
  ("#"+"7FB2DC", "#4bbbc6"), ("#"+"A88F5B", "#e8b83f"),
  ("#"+"14100A", "#101419"), ("#"+"0A0D12", "#080d12"),
  ("#"+"0F151C", "#111820"), ("#"+"72d0d8", "#4bbbc6"),
  ("#"+"89949e", "#aeb7c0"), ("#"+"59636B", "#aeb7c0"),
 )
 for old, new in replacements:
  source = re.sub(re.escape(old), new, source, flags=re.I)
 source = re.sub(r"rgba?\(\s*30\s*,\s*35\s*,\s*40", "rgba(8,13,18", source, flags=re.I)
 source = re.sub(r"rgba?\(\s*38\s*,\s*80\s*,\s*90", "rgba(17,24,32", source, flags=re.I)
 source = re.sub(r"rgba\(\s*218\s*,\s*175\s*,\s*87", "rgba(232,184,63", source, flags=re.I)
 source = re.sub(r"rgba\(\s*222\s*,\s*183\s*,\s*88", "rgba(232,184,63", source, flags=re.I)
 source = re.sub(r"rgba\(\s*168\s*,\s*143\s*,\s*91", "rgba(232,184,63", source, flags=re.I)
 source = re.sub(r"rgba\(\s*245\s*,\s*247\s*,\s*250", "rgba(244,245,247", source, flags=re.I)
 source = re.sub(r"rgba\(\s*247\s*,\s*248\s*,\s*250", "rgba(244,245,247", source, flags=re.I)
 source = re.sub(r"rgba\(\s*174\s*,\s*181\s*,\s*189", "rgba(174,183,192", source, flags=re.I)
 source = re.sub(r"rgba\(\s*196\s*,\s*205\s*,\s*211", "rgba(174,183,192", source, flags=re.I)
 source = re.sub(r"rgba\(\s*127\s*,\s*178\s*,\s*220", "rgba(75,187,198", source, flags=re.I)
 source = re.sub(r"rgba?\(\s*10\s*,\s*13\s*,\s*18", "rgba(8,13,18", source, flags=re.I)
 source = re.sub(r"rgba?\(\s*15\s*,\s*21\s*,\s*28", "rgba(17,24,32", source, flags=re.I)
 source = re.sub(r"rgba?\(\s*21\s*,\s*30\s*,\s*39", "rgba(21,30,39", source, flags=re.I)
 source = re.sub(r"rgba\(\s*11\s*,\s*12\s*,\s*14", "rgba(8,13,18", source, flags=re.I)
 source = re.sub(r"rgba\(\s*240\s*,\s*246\s*,\s*252", "rgba(244,245,247", source, flags=re.I)
 source = re.sub(r"rgba\(\s*255\s*,\s*255\s*,\s*255", "rgba(244,245,247", source, flags=re.I)
 source = re.sub(r"rgba\(\s*0\s*,\s*0\s*,\s*0", "rgba(16,20,25", source, flags=re.I)
 source = re.sub(r"(--blue\s*:\s*)#(?:DEB758|A88F5B)", r"\1#4bbbc6", source, flags=re.I)
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
 href=relative+"?v=20261116-wcag-aa-contrast-v9"
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

 # Add the policy link and consent controller to every published page.
 language_match=re.search(r"<html\b[^>]*\blang=['\"]([^'\"]+)",source,re.I)
 english=bool(language_match and language_match.group(1).lower().startswith("en"))
 policy_href=os.path.relpath(root/("en/privacy.html" if english else "privacidade.html"),page.parent).replace(os.sep,"/")
 policy_label="Privacy" if english else "Privacidade"
 preferences_label="Privacy preferences" if english else "Preferências de privacidade"
 if "privacy-footer-links" not in source:
  privacy_links=(f'<div class="privacy-footer-links">'
   f'<a href="{policy_href}">{policy_label}</a>'
   f'<a class="privacy-preferences-link" href="#privacy-preferences">{preferences_label}</a>'
   f'</div>')
  if re.search(r"</footer>",source,re.I):
   source=re.sub(r"</footer>",lambda match: privacy_links+"\\n</footer>",source,count=1,flags=re.I)
  elif re.search(r"</body>",source,re.I):
   generated_footer=f'<footer class="site-footer privacy-generated-footer">{privacy_links}</footer>'
   source=re.sub(r"</body>",lambda match: generated_footer+"\\n"+match.group(0),source,count=1,flags=re.I)
  else:
   source += f'<footer class="site-footer privacy-generated-footer">{privacy_links}</footer>'
 consent_src=os.path.relpath(root/"privacy-consent.js",page.parent).replace(os.sep,"/")
 consent_tag=f'<script src="{consent_src}" defer></script>'
 consent_pattern=re.compile(r'<script\b[^>]*privacy-consent\.js',re.I)
 if not consent_pattern.search(source):
  if re.search(r"</body\s*>",source,re.I):
   source=re.sub(r"</body\s*>",lambda match: consent_tag+"\n"+match.group(0),source,count=1,flags=re.I)
  else:
   source += "\n"+consent_tag
 page.write_text(source,encoding="utf-8")
 count+=1

print(f"Stylesheets deduplicated and canonical portfolio theme loaded last in the head of {count} HTML pages.")
