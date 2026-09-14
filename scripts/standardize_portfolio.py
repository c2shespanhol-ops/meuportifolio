from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CSS = "portfolio-theme.css?v=20260914"

FOOTER = '''<footer class="pbos-footer">
  <div class="pbos-footer-signature">Cleyton Hespanhol | Product Owner | UX</div>
  <div class="pbos-footer-copy">© 2026 Cleyton S. Hespanhol. Todos os direitos reservados.</div>
  <a class="pbos-footer-link" href="https://www.linkedin.com/in/cleyton-hespanhol" target="_blank" rel="noopener">linkedin.com/in/cleyton-hespanhol</a>
</footer>'''

PALETTE = {
    '--bg': '#090D12', '--bg2': '#121820', '--bg3': '#19222B',
    '--gold': '#E5B642', '--gold-lt': '#E5B642', '--cyan': '#53C0CC',
    '--teal': '#53C0CC', '--teal-br': '#53C0CC', '--white': '#F7F8FA',
    '--text': '#F7F8FA', '--gray': '#AFB8C1', '--gray1': '#AFB8C1',
    '--gray2': '#7D8790', '--border': 'rgba(229,182,66,.22)',
}

COLOR_MAP = {
    '#1E2328': '#090D12', '#242B31': '#121820', '#2B343B': '#19222B',
    '#090D12': '#090D12', '#121820': '#121820', '#19222B': '#19222B',
    '#0F151B': '#121820', '#151D24': '#19222B', '#0B0C0E': '#090D12',
    '#0E1114': '#090D12', '#080A0C': '#090D12', '#0A0E12': '#090D12',
    '#0D0F10': '#090D12', '#111820': '#121820', '#121418': '#121820',
    '#13181D': '#121820', '#181B20': '#19222B', '#1A2028': '#19222B',
    '#1A1D20': '#19222B', '#DAAF57': '#E5B642', '#E6C47A': '#E5B642',
    '#E5B642': '#E5B642', '#C9A84C': '#E5B642', '#C5A25D': '#E5B642',
    '#E8C060': '#E5B642', '#F0C75A': '#E5B642', '#F57F76': '#E5B642',
    '#3A7A8A': '#53C0CC', '#4BADB8': '#53C0CC', '#56C8D4': '#53C0CC',
    '#26505A': '#53C0CC', '#F0F6FC': '#F7F8FA', '#F4F5F7': '#F7F8FA',
    '#F5F7FA': '#F7F8FA', '#8B949E': '#AFB8C1', '#9AA3AD': '#AFB8C1',
    '#B8C0C8': '#AFB8C1', '#A9B0B7': '#AFB8C1', '#68717B': '#7D8790',
    '#737D87': '#7D8790', '#66717A': '#7D8790', '#4A5568': '#7D8790',
    'rgba(218,175,87': 'rgba(229,182,66', 'rgba(229,182,66': 'rgba(229,182,66',
    'rgba(197,162,93': 'rgba(229,182,66', 'rgba(201,168,76': 'rgba(229,182,66',
    'rgba(38,80,90': 'rgba(83,192,204', 'rgba(58,122,138': 'rgba(83,192,204',
    'rgba(75,173,184': 'rgba(83,192,204', 'rgba(11,12,14': 'rgba(9,13,18',
}

FONT_IMPORT_RE = re.compile(r"<link[^>]+fonts\.googleapis\.com[^>]+>", re.I)
THEME_LINK_RE = re.compile(r"\s*<link\s+rel=[\"']stylesheet[\"']\s+href=[\"']portfolio-theme\.css(?:\?[^\"']*)?[\"']\s*/?>", re.I)
CORMORANT_RE = re.compile(r"Cormorant Garamond", re.I)
ITALIC_RE = re.compile(r"font-style\s*:\s*italic\s*;?", re.I)
OVERRIDE_RE = re.compile(r"<style\s+id=[\"']pbos-final-overrides[\"'][^>]*>.*?</style>", re.I | re.S)
CANONICAL_FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">'

FINAL_OVERRIDES = '''<style id="pbos-final-overrides">
html, body { background:#090D12 !important; color:#F7F8FA !important; }
body { font-family:'DM Sans',sans-serif !important; font-weight:300 !important; }
body, body main, body header, body footer, body .hero, body .container, body .wrap,
body .section, body .section-inner, body .cases-section, body .hero-container,
body .hero-content, body .hero-footer, body .corporate-banner { background-color:#090D12 !important; background-image:none !important; }
body .hero-bg, body .orb, body [class*="orb"], body [class*="glow"], body [class*="ambient"], body [class*="halo"] { display:none !important; background:none !important; background-image:none !important; box-shadow:none !important; filter:none !important; opacity:0 !important; }
body .hero::before, body .hero::after, body main::before, body main::after { background:none !important; background-image:none !important; box-shadow:none !important; content:none !important; }
body .gold-accent-top, body .top { height:2px !important; background:#E5B642 !important; background-image:none !important; }
body h1, body h2, body h3, body h4, body h5, body h6,
body .hero-title, body .hero-main-text, body .hero-subtitle, body .section-title,
body .section-heading, body .banner-title, body .eco-title, body .doc-title,
body .pillar-card h3, body .artifact-card h3, body .case-card h3,
body .hero-highlight-value, body .metric-display, body .number {
  font-family:'DM Sans',sans-serif !important; font-style:normal !important; color:#F7F8FA !important;
}
body h1, body .hero-title { font-weight:300 !important; letter-spacing:-.035em !important; line-height:1.08 !important; }
body h2, body .section-title, body .section-heading { font-weight:300 !important; letter-spacing:-.025em !important; line-height:1.12 !important; }
body h3, body .eco-title, body .case-card h3, body .doc-title { font-weight:400 !important; line-height:1.22 !important; }
body .hero-title em, body .section-title em, body .section-heading em, body .hero-main-text em, body .banner-desc em { font-family:'DM Sans',sans-serif !important; font-style:normal !important; color:#53C0CC !important; }
body .hero-desc, body .hero-sub-text, body .lead, body .banner-desc,
body .card p, body .pillar-card p, body .artifact-card p, body .case-card p,
body .competency-desc, body .eco-text, body .step p, body .note, body .metric p,
body .footer-copy, body .footer-right { font-family:'DM Sans',sans-serif !important; color:#AFB8C1 !important; font-weight:300 !important; line-height:1.75 !important; }
body .eyebrow, body .hero-eyebrow, body .hero-tags, body .case-label-text,
body .case-meta, body .section-label, body .nav-role, body .nav-tag, body .label,
body .artifact-action, body .competency-title, body .eco-role, body .doc-number,
body .metric-label, body .tag, body .scroll-hint, body .footer-role {
  font-family:'Orbitron',sans-serif !important; font-style:normal !important; color:#E5B642 !important; letter-spacing:.14em !important;
}
body .card, body .pillar-card, body .artifact-card, body .competency-card, body .eco-card,
body .metric, body .meta, body .hero-highlight-card, body .flow, body .note,
body .doc-card, body .case-card, body .stat-box { background:#121820 !important; border-color:rgba(229,182,66,.22) !important; box-shadow:none !important; }
body .card:hover, body .artifact-card:hover, body .case-card:hover, body .doc-card:hover,
body .competency-card:hover, body .eco-card:hover { background:#19222B !important; border-color:#E5B642 !important; }
body .back, body .back-btn { background:rgba(9,13,18,.96) !important; color:#E5B642 !important; border-color:rgba(229,182,66,.22) !important; }
body .back:hover, body .back-btn:hover { background:#E5B642 !important; color:#090D12 !important; }
body .nav-name, body .logo-text { font-family:'DM Sans',sans-serif !important; color:#F7F8FA !important; }
body .h-mark, body .logo-h { font-family:'DM Sans',sans-serif !important; color:#F7F8FA !important; border-color:#E5B642 !important; }
body .metric-display, body .number { color:#E5B642 !important; font-weight:300 !important; }
body footer, body .pbos-footer { background:#090D12 !important; border-top-color:rgba(229,182,66,.22) !important; color:#AFB8C1 !important; }
body .pbos-footer-signature { font-family:'DM Sans',sans-serif !important; color:#F7F8FA !important; font-weight:400 !important; }
body .pbos-footer-copy { color:#AFB8C1 !important; }
body .pbos-footer-link, body .footer-linkedin { color:#E5B642 !important; }
body .btn-case-mock { color:#E5B642 !important; border-color:#E5B642 !important; }
body .btn-case-mock:hover { background:#E5B642 !important; color:#090D12 !important; }
body .stat-box { color:#E5B642 !important; }
@media (max-width:760px) {
  body .container, body .wrap, body .cases-section, body .hero-content, body .hero-footer,
  body .nav, body footer, body .section, body header { padding-left:20px !important; padding-right:20px !important; }
  body .hero-title, body h1 { font-size:clamp(36px,10vw,52px) !important; }
  body .hero-main-text { font-size:clamp(28px,8vw,40px) !important; }
  body .section-title, body h2 { font-size:clamp(28px,8vw,40px) !important; }
}
</style>'''


def normalize_root_palette(text: str) -> str:
    for variable, value in PALETTE.items():
        text = re.sub(rf"({re.escape(variable)}\s*:\s*)[^;}}]+", rf"\1{value}", text, flags=re.I)
    return text


def normalize_fonts(text: str) -> str:
    text = FONT_IMPORT_RE.sub(CANONICAL_FONT_LINK, text)
    text = CORMORANT_RE.sub("DM Sans", text)
    text = ITALIC_RE.sub("font-style: normal;", text)
    return text


for path in sorted(ROOT.glob('*.html')):
    text = path.read_text(encoding='utf-8')
    original = text

    for old, new in COLOR_MAP.items():
        text = text.replace(old, new)
    text = normalize_root_palette(text)
    text = normalize_fonts(text)

    text = OVERRIDE_RE.sub('', text)
    text = THEME_LINK_RE.sub('', text)
    text = re.sub(r"\s*<link[^>]+fonts\.googleapis\.com[^>]+>\s*", "\n", text, flags=re.I)
    text = re.sub(r'</head>', f'\n{CANONICAL_FONT_LINK}\n<link rel="stylesheet" href="{CSS}">\n{FINAL_OVERRIDES}\n</head>', text, count=1, flags=re.I)

    if re.search(r'<footer\b[^>]*>.*?</footer>', text, flags=re.I | re.S):
        text = re.sub(r'<footer\b[^>]*>.*?</footer>', FOOTER, text, count=1, flags=re.I | re.S)
    elif re.search(r'</body>', text, flags=re.I):
        text = re.sub(r'</body>', FOOTER + '\n</body>', text, count=1, flags=re.I)

    if text != original:
        path.write_text(text, encoding='utf-8')
