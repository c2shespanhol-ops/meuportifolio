import { createApplication, canMarkApplied, transitionApplication, applicationStatusLabel } from "../career-os/application-tracker.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const base = createApplication({
  id: "app-test-001",
  vacancy_id: "vacancy-test-001",
  company: "Example",
  title: "Product Owner",
  url: "https://example.com/job",
  source: "linkedin",
  now: "2026-09-26T08:00:00-03:00"
});

assert(base.status === "draft", "New application must start as draft.");
assert(!canMarkApplied(base), "Draft without evidence cannot be marked applied.");

let rejected = false;
try {
  transitionApplication(base, "applied", { now: "2026-09-26T08:01:00-03:00" });
} catch {
  rejected = true;
}
assert(rejected, "Application without submission evidence must be rejected.");

const ready = transitionApplication(base, "ready_to_apply", {
  now: "2026-09-26T08:02:00-03:00",
  note: "Job Pack reviewed; candidate action still required."
});
assert(ready.status === "ready_to_apply", "Application should support a ready-to-apply state.");

const applied = transitionApplication(ready, "applied", {
  now: "2026-09-26T08:05:00-03:00",
  confirmation: {
    type: "application_id",
    reference: "APP-123",
    note: "Submission confirmation recorded."
  },
  cv_version: "job-pack-v1"
});

assert(applied.status === "applied", "Application should become applied only with evidence.");
assert(applied.submitted_at === "2026-09-26T08:05:00-03:00", "Submission timestamp must be recorded.");
assert(applied.confirmation.reference === "APP-123", "Submission reference must be retained.");
assert(applicationStatusLabel("applied") === "Candidatura enviada", "Applied status label must be explicit.");

console.log(JSON.stringify(applied, null, 2));
console.log("Application tracker tests passed.");
