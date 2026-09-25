# Career OS Validation Checkpoint

## Scope

Validation checkpoint for Portfolio 2.0 and Career OS on branch `feat/portfolio-2-career-os-foundation`.

## Automated checks

The GitHub Actions workflow `Career OS validation` runs:

1. `scripts/test-job-matcher.mjs`
2. `scripts/test-job-pack.mjs`
3. `scripts/test-linkedin-profile.mjs`

The checks validate matcher behavior, evidence-backed Job Pack generation, salary review gating, ownership-aware matching, and LinkedIn-sourced profile integrity.

## Current gate

The branch remains a draft PR until the validation pass is confirmed.

A successful automated run is required before treating this foundation as validated.

## Next functional validation

After CI confirmation, run the Career OS against a real Product Owner vacancy and verify:

- vacancy normalization
- requirement-to-evidence mapping
- ownership vs contribution distinction
- verified keyword selection
- up to 3 evidence-backed competencies
- adapted CV output
- salary research review state
- final status: `review_required` or `ready_for_review`

No merge to `main` is authorized by this checkpoint.
