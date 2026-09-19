# PBOS Bilingual Portfolio Architecture v1

## Objective

Provide visitors with a clear language choice between Portuguese and English, with the English version aimed at international tech recruiters and hiring managers.

## Public routes

- Portuguese home: `/`
- English home: `/en/`
- Portuguese cases: `/case_study_XX_*.html`
- English cases: `/en/case_study_XX_*.html`

## Language selector

The selector uses two explicit options:

- PT: Portuguese
- EN: English

The selector is present on the Portuguese home, English home and the five main case-study pages in both languages.

The language switch changes the public route instead of relying on browser translation or an external translation widget. This keeps the content deterministic, indexable and independent from third-party translation services.

## SEO

English pages use:

- `lang="en"`
- English `<title>`
- English meta description
- English Open Graph locale where applicable

The Portuguese pages remain the canonical Portuguese experience.

## Scope of this first implementation

Translated public portfolio entry point and the five main case studies:

1. Institutional Virtual Assistant
2. Product Governance and Lead Time Reduction
3. Habitat Consultórios Inteligentes
4. SHV Energy
5. Federal Revenue Service PAV

Internal supporting artifacts remain in the existing repository structure and can be translated as a second documentation layer without changing the public information architecture.

## Design

Both languages reuse the same PBOS visual system:

- DM Sans for titles and operational content
- Orbitron for technical labels and metadata
- existing PBOS palette and shared portfolio theme
- same monogram and signature
- same responsive behavior

## Translation principle

The English version is not a literal word-for-word translation when that would produce unnatural professional English. It preserves the factual scope, metrics, responsibilities and limitations of the Portuguese source while adapting terminology to international Product/CX/UX recruiting language.

## Branch

`feature/bilingual-portfolio`
