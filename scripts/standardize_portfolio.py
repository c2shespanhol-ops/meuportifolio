from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CSS = "portfolio-theme.css"

FOOTER = '''<footer class="pbos-footer">
  <div class="pbos-footer-signature">Cleyton Hespanhol | Product Owner | UX</div>
  <div class="pbos-footer-copy">© 2026 Cleyton S. Hespanhol. Todos os direitos reservados.</div>
  <a class="pbos-footer-link" href="https://www.linkedin.com/in/cleyton-hespanhol" target="_blank" rel="noopener">linkedin.com/in/cleyton-hespanhol</a>
</footer>'''

PALETTE = {
    '--bg': '#090D12', '--bg2': '#0F151B', '--bg3': '#151D24',
    '--gold': '#E5B642', '--gold-lt': '#F0C75A', '--cyan': '#4BADB8',
    '--teal': '#4BADB8', '--teal-br': '#4BADB8', '--white': '#F4F5F7',
    '--text': '#F4F5F7', '--gray': '#B5BBC1', '--gray1': '#B5BBC1',
    '--gray2': '#737D87', '--border': 'rgba(229,182,66,.20)',
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

FINAL_OVERRIDES = '''<style id="pbos-final-overrides">
html, body { background:#090D12 !important; color:#F4F5F7 !important; }
body { font-family:'DM Sans',sans-serif !important; }
body .hero, body .hero-bg, body main, body .container, body .section, body .cases-section, body .corporate-banner, body .hero-footer, body footer, body .pbos-footer { background:#090D12 !important; }
body .hero-bg { background-image:none !important; }
body .orb, body [class*="orb"], body [class*="glow"] { display:none !important; background:none !important; box-shadow:none !important; }
body .hero::before, body .hero::after, body main::before, body main::after { background:none !important; box-shadow:none !important; }
body .gold-accent-top, body .top { height:2px !important; background:linear-gradient(90deg,#E5B642,#F0C75A,#E5B642) !important; }
body h1, body h2, body h3, body h4, body h5, body h6, body .hero-title, body .hero-subtitle, body .section-heading, body .section-title, body .eco-title, body .doc-title, body .pillar-card h3, body .artifact-card h3, body .case-card h3, body .hero-highlight-value, body .metric-display, body .number { font-family:'DM Sans',sans-serif !important; color:#F4F5F7 !important; }
body h1, body .hero-title { font-weight:300 !important; letter-spacing:-.04em !important; line-height:1.05 !important; }
body h2, body .section-heading, body .section-title { font-weight:300 !important; letter-spacing:-.025em !important; line-height:1.12 !important; }
body .hero-title em, body .section-title em, body .section-heading em, body .hero-main-text em, body .banner-desc em { font-family:'DM Sans',sans-serif !important; font-style:normal !important; color:#4BADB8 !important; }
body .eyebrow, body .hero-eyebrow, body .hero-tags, body .case-label-text, body .case-meta, body .section-label, body .nav-role, body .nav-tag, body .label, body .artifact-action, body .competency-title, body .eco-role, body .doc-number, body .metric-label, body .tag, body .scroll-hint, body .footer-role { font-family:'Orbitron',sans-serif !important; color:#E5B642 !important; letter-spacing:.12em !important; }
body p, body li, body td, body th, body .lead, body .hero-desc, body .hero-sub-text, body .hero-main-text, body .card p, body .pillar-card p, body .artifact-card p, body .competency-desc, body .eco-text, body .step p, body .note, body .metric p, body .banner-desc, body .case-card p, body .footer-copy, body .footer-right { font-family:'DM Sans',sans-serif !important; color:#B5BBC1 !important; }
body .card, body .pillar-card, body .artifact-card, body .competency-card, body .eco-card, body .metric, body .meta, body .hero-highlight-card, body .flow, body .note, body .doc-card, body .case-card, body .stat-box { background:#0F151B !important; border-color:rgba(229,182,66,.20) !important; }
body .card:hover, body .artifact-card:hover, body .case-card:hover, body .doc-card:hover, body .competency-card:hover { background:#151D24 !important; border-color:#E5B642 !important; }
body .back, body .back-btn { background:rgba(9,13,18,.94) !important; color:#E5B642 !important; border-color:rgba(229,182,66,.20) !important; }
body .back:hover, body .back-btn:hover { background:#E5B642 !important; color:#090D12 !important; }
body .nav-name, body .logo-text { font-family:'DM Sans',sans-serif !important; color:#F4F5F7 !important; }
body .h-mark, body .logo-h { font-family:'DM Sans',sans-serif !important; color:#F4F5F7 !important; border-color:#E5B642 !important; }
body .metric-display, body .number { color:#F0C75A !important; }
body footer, body .pbos-footer { border-top-color:rgba(181,187,193,.12) !important; color:#B5BBC1 !important; }
body .pbos-footer-signature { font-family:'DM Sans',sans-serif !important; color:#F4F5F7 !important; }
body .pbos-footer-copy { color:#B5BBC1 !important; }
body .pbos-footer-link, body .footer-linkedin { color:#E5B642 !important; }
</style>'''


def normalize_root_palette(text: str) -> str:
    for variable, value in PALETTE.items():
        text = re.sub(rf"({re.escape(variable)}\s*:\s*)[^;}}]+", rf"\1{value}", text, flags=re.I)
    return text


def normalize_fonts(text: str) -> str:
    text = FONT_IMPORT_RE.sub(CANONICAL_FONT_LINK, text)
    text = CORMORANT_TOKEN_RE.sub("'DM Sans', sans-serif", text)
    text = FONT_DECL_RE.sub("font-family: 'DM Sans', sans-serif;", text)
    text = ITALIC_RE.sub("font-style: normal;", text)
    return text


def normalize_decorative_backgrounds(text: str) -> str:
    return re.sub(r"background(?:-image)?\s*:\s*radial-gradient\([^;{}]+\)\s*;?", "background: var(--bg);", text, flags=re.I)


for path in sorted(ROOT.glob('*.html')):
    text = path.read_text(encoding='utf-8')
    original = text

    for old, new in COLOR_MAP.items():
        text = text.replace(old, new)
    text = normalize_root_palette(text)
    text = normalize_fonts(text)
    text = normalize_decorative_backgrounds(text)

    text = re.sub(r'\s*<link rel="stylesheet" href="portfolio-theme\.css">', '', text, flags=re.I)
    text = re.sub(r'</head>', f'\n{CANONICAL_FONT_LINK}\n<link rel="stylesheet" href="{CSS}">\n{FINAL_OVERRIDES}\n</head>', text, count=1, flags=re.I)

    if re.search(r'<footer\b[^>]*>.*?</footer>', text, flags=re.I | re.S):
        text = re.sub(r'<footer\b[^>]*>.*?</footer>', FOOTER, text, count=1, flags=re.I | re.S)
    elif re.search(r'</body>', text, flags=re.I):
        text = re.sub(r'</body>', FOOTER + '\n</body>', text, count=1, flags=re.I)

    if text != original:
        path.write_text(text, encoding='utf-8')
