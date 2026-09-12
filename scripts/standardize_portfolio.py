from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CSS = "portfolio-theme.css"

FOOTER = '''<footer class="pbos-footer">
  <div class="pbos-footer-signature">Cleyton Hespanhol | Product Owner | UX</div>
  <div class="pbos-footer-copy">© 2026 Cleyton S. Hespanhol. Todos os direitos reservados.</div>
  <a class="pbos-footer-link" href="https://www.linkedin.com/in/cleyton-hespanhol" target="_blank" rel="noopener">linkedin.com/in/cleyton-hespanhol</a>
</footer>'''

# Homepage is the visual source of truth.
PALETTE = {
    '--bg': '#090D12',
    '--bg2': '#0F151B',
    '--bg3': '#151D24',
    '--gold': '#E5B642',
    '--gold-lt': '#F0C75A',
    '--cyan': '#4BADB8',
    '--teal': '#4BADB8',
    '--teal-br': '#4BADB8',
    '--white': '#F4F5F7',
    '--text': '#F4F5F7',
    '--gray': '#B5BBC1',
    '--gray1': '#B5BBC1',
    '--gray2': '#737D87',
    '--border': 'rgba(229,182,66,.20)',
}

COLOR_MAP = {
    '#0B0C0E': '#090D12', '#0E1114': '#090D12', '#080A0C': '#090D12',
    '#0A0E12': '#090D12', '#0D0F10': '#090D12',
    '#111820': '#0F151B', '#121418': '#0F151B', '#13181D': '#0F151B',
    '#181B20': '#151D24', '#1A2028': '#151D24', '#1A1D20': '#151D24',
    '#1E2328': '#090D12', '#242B31': '#0F151B', '#2B343B': '#151D24',
    '#C9A84C': '#E5B642', '#C5A25D': '#E5B642', '#DAAF57': '#E5B642',
    '#E8C060': '#F0C75A', '#DEC082': '#F0C75A', '#E6C47A': '#F0C75A',
    '#F0F6FC': '#F4F5F7', '#F5F7FA': '#F4F5F7', '#8B949E': '#B5BBC1',
    '#4A5568': '#737D87', '#66717A': '#737D87', '#9AA3AD': '#B5BBC1',
    '#3A7A8A': '#4BADB8', '#26505A': '#4BADB8', '#F57F76': '#E5B642',
    '#68717B': '#737D87',
    'rgba(201,168,76': 'rgba(229,182,66',
    'rgba(197,162,93': 'rgba(229,182,66',
    'rgba(11,12,14': 'rgba(9,13,18',
    'rgba(58,122,138': 'rgba(75,173,184',
    'rgba(218,175,87': 'rgba(229,182,66',
}

FONT_IMPORT_RE = re.compile(r"<link[^>]+fonts\.googleapis\.com[^>]+>", re.I)
FONT_DECL_RE = re.compile(r"font-family\s*:\s*[^;{}]*Cormorant Garamond[^;{}]*;?", re.I)
CORMORANT_TOKEN_RE = re.compile(r"['\"]Cormorant Garamond['\"]\s*,?\s*serif", re.I)
ITALIC_RE = re.compile(r"font-style\s*:\s*italic\s*;?", re.I)

CANONICAL_FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">'


def normalize_root_palette(text: str) -> str:
    for variable, value in PALETTE.items():
        text = re.sub(
            rf"({re.escape(variable)}\s*:\s*)[^;}}]+",
            rf"\1{value}",
            text,
            flags=re.I,
        )
    return text


def normalize_fonts(text: str) -> str:
    # Replace every Google Fonts import with the exact portfolio standard.
    text = FONT_IMPORT_RE.sub(CANONICAL_FONT_LINK, text)
    text = CORMORANT_TOKEN_RE.sub("'DM Sans', sans-serif", text)
    text = FONT_DECL_RE.sub("font-family: 'DM Sans', sans-serif;", text)
    text = ITALIC_RE.sub("font-style: normal;", text)
    return text


def normalize_decorative_backgrounds(text: str) -> str:
    # Remove radial glow effects used by older case pages.
    text = re.sub(
        r"background(?:-image)?\s*:\s*radial-gradient\([^;{}]+\)\s*;?",
        "background: var(--bg);",
        text,
        flags=re.I,
    )
    return text


for path in sorted(ROOT.glob('*.html')):
    text = path.read_text(encoding='utf-8')
    original = text

    # Ensure the shared stylesheet is loaded exactly once and last in <head>.
    text = re.sub(r'\s*<link rel="stylesheet" href="portfolio-theme\.css">', '', text, flags=re.I)

    for old, new in COLOR_MAP.items():
        text = text.replace(old, new)

    text = normalize_root_palette(text)
    text = normalize_fonts(text)
    text = normalize_decorative_backgrounds(text)

    # Case 02: eliminate the old decorative orb and preserve the validated role wording.
    if path.name == 'case_study_02_leadtime_final.html':
        text = re.sub(r'\.orb\s*\{[^}]*\}', '.orb{display:none;}', text, flags=re.I)
        text = re.sub(r'\.hero-bg\s*\{[^}]*\}', '.hero-bg{position:absolute;inset:0;background:var(--bg);}', text, flags=re.I)
        text = text.replace('Papel · Product Owner | UX', 'Atuação · Product Operations | UX')

    text = re.sub(r'</head>', f'\n{CANONICAL_FONT_LINK}\n<link rel="stylesheet" href="{CSS}">\n</head>', text, count=1, flags=re.I)

    # Standard footer across every HTML page in the portfolio.
    if re.search(r'<footer\b[^>]*>.*?</footer>', text, flags=re.I | re.S):
        text = re.sub(r'<footer\b[^>]*>.*?</footer>', FOOTER, text, count=1, flags=re.I | re.S)
    elif re.search(r'</body>', text, flags=re.I):
        text = re.sub(r'</body>', FOOTER + '\n</body>', text, count=1, flags=re.I)

    if text != original:
        path.write_text(text, encoding='utf-8')
