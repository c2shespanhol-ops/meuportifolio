# PBOS Portfolio Design System V2

## Objective
Unify the visual language of the portfolio home and Cases 01-05 while preserving all existing case content, metrics, claims and URLs.

## Typography
- DM Sans: body copy, headings, titles, navigation names and buttons.
- Orbitron: technical labels, case metadata, metric labels, tags and section labels.
- Cormorant Garamond is not part of the new portfolio standard.

## Palette
- Background: #1E2328
- Surface: #242B31
- Secondary surface: #2B343B
- Gold: #DAAF57
- Soft gold: #E6C47A
- Teal: #26505A
- Main text: #F5F7FA
- Muted text: #A9B0B7
- Border: rgba(218,175,87,.20)

## Layout
- Maximum content width: 1120px.
- Consistent horizontal gutters.
- Consistent section rhythm and card padding.
- Mobile layouts must remain readable without horizontal overflow.

## Brand
- Official signature: Cleyton Hespanhol | Product Owner | UX
- Monogram: white H inside a gold circle on the dark background.

## Implementation principles
1. `portfolio-theme.css` is the shared source of truth.
2. Local HTML styles must not introduce a competing typography system.
3. Do not solve visual conflicts by accumulating `!important` overrides.
4. Preserve factual content and evidence. Do not introduce unsupported Product Owner claims into cases where the role was not formal.
5. The home and all cases should feel like one digital product while retaining their individual narrative and content hierarchy.
