# LinkedIn sync

## Source of truth

LinkedIn is the primary source of truth for the user's professional profile used in CV generation and job applications.

The portfolio's normalized `data/profile.json` is a derived Career Profile/cache. It must not silently replace LinkedIn content with older CV data, conversational memory, stale snapshots, inferred vacancy requirements, or invented claims.

## Target flow

LinkedIn → authorized snapshot → normalization → diff/review → Career Profile → Matcher → Job Pack → adapted CV/application

## Current implementation boundary

The available LinkedIn integration can locate professional profiles, but it does not currently provide a complete authorized feed of every self-profile field or a general write/webhook synchronization mechanism. Therefore the system must not claim real-time synchronization or pretend that the public profile URL alone is a complete professional snapshot.

## Snapshot contract

A LinkedIn snapshot must identify:

- `source: "linkedin"`
- the configured profile URL
- `captured_at` timestamp
- normalized professional profile data

Only an authorized snapshot matching the configured profile URL can be promoted to the primary-source Career Profile.

## Safe synchronization behavior

1. Capture an authorized LinkedIn snapshot.
2. Normalize it without inventing or enriching unsupported claims.
3. Compare it with the previous approved snapshot/Career Profile.
4. Surface material changes for review.
5. Update the derived Career Profile after review.
6. Regenerate affected CV/Job Pack outputs.
7. Preserve source and synchronization metadata.

## Application guardrail

If a current LinkedIn-sourced snapshot is unavailable, CV/application generation must enter `review_required` rather than silently falling back to stale profile data.

Cases, certificates and other evidence remain secondary sources. They may validate, contextualize or clarify claims, but they do not replace LinkedIn as the primary professional-profile source.

## Security

- Never store a LinkedIn password in the repository.
- Do not bypass CAPTCHA, MFA, access controls or platform restrictions.
- Use authorized export/API/connector mechanisms only.
- Do not publish private application records or credentials.
