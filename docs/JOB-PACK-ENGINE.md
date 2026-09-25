# Job Pack Engine

## Purpose

The Job Pack Engine converts a normalized vacancy and the evidence-backed matcher result into a reviewable application package.

It does not decide whether Cleyton should apply. It prepares evidence for human review.

## Outputs

- verified vacancy keywords only
- requirement-to-evidence records from the matcher
- presentation text, capped at 1,500 characters
- up to 3 competencies
- salary object with source/date/context when research exists
- explicit review reasons when information is missing or requirements are not fully verified
- matcher result for traceability

## Evidence rules

1. A vacancy keyword is not evidence by itself.
2. Only verified evidence claims can become adapted keywords or competencies.
3. Partial evidence remains partial.
4. End-to-end Product Backlog ownership is not inferred from backlog management or refinement.
5. Product Strategy ownership is not inferred from Product Discovery.
6. No employer, tool, certification, metric, responsibility or ownership scope may be invented.

## Salary rules

Salary data must carry source, date and context. When no salary research is available, salary fields remain null and the Job Pack is marked review_required.

The engine does not invent market ranges or guarantee compensation.

## Human review

Review is required when:

- salary research is missing
- must-have requirements are partial, gaps or unknown
- responsibility requirements are partial, gaps or unknown
- a vacancy implies formal ownership not supported by evidence
- source/platform restrictions affect the application path

## Current scope

The engine is deterministic and local. It does not submit applications, access platform credentials, bypass CAPTCHA/MFA, or write private application records to the public repository.

Run:

```bash
node scripts/test-job-pack.mjs
```
