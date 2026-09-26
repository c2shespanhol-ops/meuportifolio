# Career OS Validation Checkpoint

## Scope

Validation checkpoint for Portfolio 2.0 and Career OS on branch `feat/portfolio-2-career-os-foundation`.

## Automated checks

The GitHub Actions workflow `Career OS validation` runs:

1. `scripts/test-job-matcher.mjs`
2. `scripts/test-job-pack.mjs`
3. `scripts/test-linkedin-profile.mjs`
4. `scripts/test-real-vacancy.mjs`

The checks validate matcher behavior, evidence-backed Job Pack generation, salary review gating, ownership-aware matching, LinkedIn-sourced profile integrity, and a real-vacancy validation against the Radix Product Owner Senior posting.

## Current gate

The branch remains a draft PR until the validation pass is confirmed.

A successful automated run is required before treating this foundation as validated.

## Next functional validation

The current real-vacancy validation fixture is the Radix Profissional Product Owner Sênior posting. After CI confirmation, review the generated Job Pack and verify:

- vacancy normalization
- requirement-to-evidence mapping
- ownership vs contribution distinction
- verified keyword selection
- up to 3 evidence-backed competencies
- adapted CV output
- salary research review state
- final status: `review_required` or `ready_for_review`
- unsupported requirements remain `gap` rather than being inferred from adjacent experience
- Agile methodology evidence remains `partial` where the LinkedIn snapshot does not explicitly verify it

No merge to `main` is authorized by this checkpoint.
