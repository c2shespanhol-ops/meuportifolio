# Application Tracker

The Application Tracker records the real state of each job application separately from the Job Pack.

## Status model

- draft: vacancy identified; application record exists but is not ready.
- review_required: human review is still required.
- ready_to_apply: Job Pack and candidate inputs are ready; submission has not occurred.
- applied: submission was actually completed and evidence was recorded.
- blocked: submission could not be completed because an external step is unavailable or blocked.
- withdrawn, rejected, interviewing, offer, hired: post-submission lifecycle states.

## Submission gate

The system must not mark an application as applied without submission evidence.

Accepted evidence can be a confirmation page, protocol, application ID, email evidence, or an explicit recorded confirmation note. A prepared CV, an opened vacancy, a generated Job Pack, or a filled form is not submission evidence.

## Separation from Job Pack

The Job Pack answers: What should be submitted for this vacancy?
The Application Tracker answers: What actually happened with this application?

This prevents the Career OS from reporting a prepared application as a completed application.

## Source of truth

data/applications.json is the application ledger. data/application.schema.json defines its structure. career-os/application-tracker.mjs enforces the evidence gate and status transitions.
