from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CSS = "portfolio-theme.css"

FOOTER = '''<footer class="pbos-footer">
  <div class="pbos-footer-signature">Cleyton Hespanhol | Product Owner | UX</div>
  <div class="pbos-footer-copy">© 2026 Cleyton S. Hespanhol. Todos os direitos reservados.</div>
  <a class="pbos-footer-link" href="https://www.linkedin.com/in/cleyton-hespanhol" target="_blank" rel="noopener">linkedin.com/in/cleyton-hespanhol</a>
</footer>'''

COLOR_MAP = {
    '#0B0C0E': '#1E2328', '#0E1114': '#1E2328', '#080A0C': '#1E2328',
    '#0A0E12': '#1E2328', '#0D0F10': '#1E2328',
    '#111820': '#242B31', '#121418': '#242B31', '#13181D': '#242B31',
    '#181B20': '#2B343B', '#1A2028': '#2B343B', '#1A1D20': '#2B343B',
    '#C9A84C': '#DAAF57', '#C5A25D': '#DAAF57',
    '#E8C060': '#E6C47A', '#DEC082': '#E6C47A',
    '#F0F6FC': '#F5F7FA', '#8B949E': '#A9B0B7', '#4A5568': '#66717A',
    '#3A7A8A': '#26505A', '#F57F76': '#DAAF57',
    'rgba(201,168,76': 'rgba(218,175,87',
    'rgba(197,162,93': 'rgba(218,175,87',
    'rgba(11,12,14': 'rgba(30,35,40',
    'rgba(58,122,138': 'rgba(38,80,90',
}

FONT_IMPORT_RE = re.compile(r"<link[^>]+fonts\.googleapis\.com[^>]*>", re.I)
CORMORANT_RE = re.compile(r"font-family\s*:\s*['\"]?Cormorant Garamond['\"]?\s*,?\s*serif\s*!?important?\s*;?", re.I)
CORMORANT_TOKEN_RE = re.compile(r"['\"]Cormorant Garamond['\"]\s*,?\s*serif", re.I)

for path in sorted(ROOT.glob('*.html')):
    text = path.read_text(encoding='utf-8')
    original = text

    if 'portfolio-theme.css' not in text:
        text = re.sub(r'</head>', f'  <link rel="stylesheet" href="{CSS}">\n</head>', text, count=1, flags=re.I)

    for old, new in COLOR_MAP.items():
        text = text.replace(old, new)

    # The shared system owns typography. Remove Cormorant imports and local declarations.
    text = FONT_IMPORT_RE.sub(lambda m: m.group(0) if 'DM+Sans' in m.group(0) and 'Orbitron' in m.group(0) else '', text)
    text = re.sub(r"\s*family=Cormorant\+Garamond[^&'\"]*&?", '', text, flags=re.I)
    text = CORMORANT_RE.sub('', text)
    text = CORMORANT_TOKEN_RE.sub("'DM Sans', sans-serif", text)

    if path.name == 'case_study_02_leadtime_final.html':
        text = text.replace('<strong>Papel</strong> · Product Owner | UX', '<strong>Atuação</strong> · Product Operations | UX')

    if re.search(r'<footer\b[^>]*>.*?</footer>', text, flags=re.I | re.S):
        text = re.sub(r'<footer\b[^>]*>.*?</footer>', FOOTER, text, count=1, flags=re.I | re.S)
    elif re.search(r'</body>', text, flags=re.I):
        text = re.sub(r'</body>', FOOTER + '\n</body>', text, count=1, flags=re.I)

    if text != original:
        path.write_text(text, encoding='utf-8')
