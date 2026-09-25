# Career OS UI

## First usable interface

`career-os/index.html` is a browser-only interface for the deterministic matcher.

### Flow

1. Load the synthetic normalized vacancy fixture.
2. Allow the user to replace it with another normalized vacancy JSON.
3. Load the public evidence map.
4. Run the deterministic matcher locally in the browser.
5. Show coverage by requirement group.
6. Show every requirement with status, ownership and evidence source.

### Scope

This UI is intentionally read-only. It does not submit applications, persist candidate application records, store credentials, or call third-party job platforms.

### Next layer

The interface can later consume a private ingestion service that normalizes permitted vacancy sources into the same vacancy contract. The public portfolio should continue to expose only synthetic/demo data.
