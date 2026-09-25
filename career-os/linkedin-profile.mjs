const LINKEDIN_URL = "https://www.linkedin.com/in/cleyton-hespanhol";

export function normalizeLinkedInSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new Error("LinkedIn snapshot is required.");
  if (snapshot.source !== "linkedin") throw new Error("Profile source must be LinkedIn.");
  if (!snapshot.profile_url || snapshot.profile_url !== LINKEDIN_URL) throw new Error("LinkedIn profile URL does not match the configured profile.");
  if (!snapshot.captured_at) throw new Error("LinkedIn snapshot must include captured_at.");
  return { source: "linkedin", profile_url: snapshot.profile_url, captured_at: snapshot.captured_at, data: snapshot.data ?? {} };
}

export function assertLinkedInSourcedProfile(profile) {
  const source = profile?.source;
  return Boolean(source?.primary_source === "linkedin" && source?.profile_url === LINKEDIN_URL && source?.sync_status === "synced" && source?.last_synced_at);
}

export function buildProfileSourceMetadata(snapshot) {
  const normalized = normalizeLinkedInSnapshot(snapshot);
  return { primary_source: "linkedin", profile_url: normalized.profile_url, sync_status: "synced", last_synced_at: normalized.captured_at };
}

export { LINKEDIN_URL };
