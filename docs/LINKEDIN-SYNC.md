# LinkedIn sync

## Desired behavior
When a new course, certification, role, project or other professional information is added to LinkedIn, the canonical profile data used by the portfolio should be updated without duplicating manual edits.

## Current implementation boundary
The available LinkedIn integration can retrieve professional profile information but does not provide a general write/webhook feed for every profile edit. Therefore the system must not claim real-time synchronization yet.

## Safe architecture
1. data/profile.json remains the canonical application data.
2. A future authorized connector/API can populate a normalized snapshot.
3. A diff process compares the snapshot with data/profile.json.
4. Changes become a reviewable update before publishing to the public portfolio.
5. No LinkedIn password is stored in the repository.

## Review policy
Courses, certifications and experience can be proposed automatically. Publication should remain reviewable until a stable authorized synchronization source is available.
