# Career OS Job Matcher

## Objective

Transform a vacancy into an evidence-backed decision aid for the Product Owner job search.

The matcher does not decide whether Cleyton should apply. It exposes requirements, supporting evidence, gaps and confidence so the application decision remains explicit.

## Pipeline

1. Ingest a permitted vacancy source or manually supplied vacancy text. Preserve URL, source and capture timestamp.
2. Normalize title, company, location, work model, seniority, salary, responsibilities, must-have requirements, preferred requirements, tools, domain terms and keywords.
3. Classify requirements as must_have, preferred, tool, responsibility, domain or keyword.
4. Map evidence as verified, partial, gap or unknown.
5. Calculate transparent coverage:
   - Must-have coverage = verified must-have requirements / total must-have requirements.
   - Preferred coverage = verified preferred requirements / total preferred requirements.
   - Evidence coverage = verified requirements across all classified requirements / total classified requirements.
6. Build the Job Pack with vacancy snapshot, keywords, requirement-to-evidence matrix, gaps, presentation, up to three competencies, salary references and adapted CV.
7. Prefer official application mechanisms. If no permitted integration exists, produce an assisted-application pack instead of automating browser actions.

## Evidence rules

Ownership labels:
- ownership: directly owned activity or decision.
- contribution: materially contributed without formal end-to-end ownership.
- influence: influenced a decision through analysis, facilitation or evidence.
- exposure: worked adjacent to the activity without sufficient evidence to claim ownership.

A keyword is not evidence.

Example: if a vacancy asks for Product Backlog ownership and the available evidence only shows backlog refinement and demand prioritization, classify it as partial or gap depending on the wording. Do not rewrite it as end-to-end Product Backlog ownership.

## Human review triggers

Require review before the final application package when:
- a certification is not present in the verified profile;
- seniority is ambiguous;
- a requirement could imply formal ownership;
- salary data is absent or inconsistent;
- a specific language level is not documented;
- the job description is incomplete or contradictory;
- source terms prohibit automated interaction.

## Non-negotiable constraints

- No invented tools, certifications, employers, responsibilities or metrics.
- No transformation of operational experience into formal Product ownership without evidence.
- No CAPTCHA/MFA bypass.
- No platform password storage.
- No application automation where platform rules or official mechanisms do not permit it.
- Keep personal vacancy/application data out of the public repository unless intentionally published.
