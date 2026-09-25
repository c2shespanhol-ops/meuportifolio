import fs from "node:fs";
import { normalizeLinkedInSnapshot, buildProfileSourceMetadata, assertLinkedInSourcedProfile } from "../career-os/linkedin-profile.mjs";

const snapshot = JSON.parse(fs.readFileSync("data/linkedin-profile.snapshot.json", "utf8"));
const profile = JSON.parse(fs.readFileSync("data/profile.json", "utf8"));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const normalized = normalizeLinkedInSnapshot(snapshot);
assert(normalized.source === "linkedin", "Snapshot source must be LinkedIn.");
assert(normalized.profile_url === "https://www.linkedin.com/in/cleyton-hespanhol", "Snapshot must use the configured LinkedIn URL.");
assert(Boolean(normalized.captured_at), "Snapshot must include captured_at.");

const metadata = buildProfileSourceMetadata(snapshot);
assert(metadata.primary_source === "linkedin", "Profile metadata must identify LinkedIn as primary source.");
assert(metadata.sync_status === "synced", "Snapshot-derived metadata must be synced.");
assert(assertLinkedInSourcedProfile(profile), "Canonical Career Profile must be LinkedIn-sourced and synced.");

const invalid = { ...snapshot, source: "manual" };
let rejected = false;
try {
  normalizeLinkedInSnapshot(invalid);
} catch {
  rejected = true;
}
assert(rejected, "Non-LinkedIn snapshots must be rejected.");

console.log("LinkedIn profile source tests passed.");
