# Career OS Matcher Engine

## Purpose

The matcher is a deterministic evidence-mapping layer for vacancy analysis. It is a decision aid, not an application decision-maker.

## Design

1. Normalize a vacancy into the contract in `data/vacancy.schema.json`.
2. Match each requirement against explicit claims in `data/evidence-map.json`.
3. Return one of four statuses:
   - verified
   - partial
   - gap
   - unknown
4. Preserve ownership level and evidence source for every match.
5. Calculate coverage as verified requirements divided by total requirements. Partial matches do not count as verified.
6. Keep ownership-sensitive requirements conservative.

## Ownership rule

The candidate's target title or a keyword match is not proof of end-to-end Product ownership.

For example, the evidence map explicitly treats Product Backlog management/refinement as verified contribution while end-to-end Product Backlog ownership remains partial.

## Execution

Run:

`node scripts/test-job-matcher.mjs`

The test fixture is synthetic and contains no real vacancy or application data.

## Safety

The engine does not submit applications, bypass access controls, store credentials, or infer unsupported experience.
