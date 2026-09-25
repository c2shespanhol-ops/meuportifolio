# LinkedIn profile diff review

## Source

- Primary source: LinkedIn PDF export supplied by the user
- Snapshot: `data/linkedin-profile.snapshot.json`
- Snapshot captured at: 2026-09-25T10:13:00-03:00
- Comparison target: `data/profile.json`
- Branch: `feat/portfolio-2-career-os-foundation`

## Status

**Snapshot created. Career Profile is NOT yet promoted to `synced`.**

The PDF supports a materially richer professional profile than the current derived `data/profile.json`. The differences below require deliberate consolidation rather than silent overwrite.

## Material differences

| Field | Current derived profile | LinkedIn snapshot | Treatment |
|---|---|---|---|
| Title | Product Owner \| UX | Product Owner \| Gestão de Produtos \| Discovery \| Gestão de Backlog \| SaaS B2B | LinkedIn becomes source value |
| Location | Maricá, RJ, Brasil | Rio de Janeiro, Brasil | LinkedIn becomes source value |
| Languages | pt-BR, en | Português Native/Bilingual; Espanhol Elementary; Inglês Elementary | Replace only after review |
| Skills | 15 normalized skills | PDF explicitly lists Customer Journey, Jornada do cliente, Levantamento de requisitos | Do not interpret the shorter PDF skills section as proof that other skills are absent |
| Summary | Not represented in profile.json | Full Product Owner / Product Analyst positioning and evidence-backed results | Add to Career Profile after review |
| Experience | Not represented in profile.json | Six roles with titles, dates, responsibilities and results | Add as LinkedIn-derived career history after review |
| Certifications | Not represented in profile.json | 5 certifications shown in PDF | Add after review |
| Awards | Not represented in profile.json | Servidor Destaque 2025 | Add after review |
| Education | Not represented in profile.json | 4 education records | Add after review |
| Contact email | c2shespanhol@gmail.com | c2shespanhol@gmail.com | Confirmed |
| LinkedIn URL | same | same | Confirmed |
| Portfolio | Not represented | c2shespanhol-ops.github.io/meuportifolio/index.html | Add as source link after review |
| Metrics | 71%, 27%, 31% | Summary adds 31% SLA and 31% resolution-time claims | Preserve all source claims, but map evidence before using them in generated CVs |

## Important semantic findings

1. The current LinkedIn headline is more explicit about Product Management, Discovery, Backlog Management and SaaS B2B than the current derived title.
2. The LinkedIn PDF explicitly presents the Maricá role as **Product Owner | Analista de Produtos Digitais** and describes **gestão e priorização do Product Backlog**. This is source evidence and should not be weakened by reverting to an older title.
3. The Habitat role is explicitly presented as **Product Owner | Product Analyst**, with backlog, journey mapping, hypotheses, A/B tests and Produto/Operação/UX alignment.
4. The PDF does not provide evidence for every item currently present in the derived skills array. Those items should not be deleted automatically; they should be classified as secondary-source evidence or pending LinkedIn confirmation.
5. The PDF contains contact information. The public Career Profile should minimize unnecessary duplication of personal contact data even though the source contains it.
6. The PDF is a snapshot artifact, not evidence of real-time LinkedIn synchronization. The system should retain the distinction between an imported snapshot and a live connector.

## Recommended next action

Create a reviewed Career Profile derived from this snapshot, preserving provenance per field where practical. Do **not** mark `data/profile.json` as LinkedIn-synced until the material differences above are accepted.

