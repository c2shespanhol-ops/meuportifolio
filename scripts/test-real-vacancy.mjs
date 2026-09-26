import fs from "node:fs";
import { buildJobPack } from "../career-os/job-pack.mjs";

const vacancy = JSON.parse(fs.readFileSync("data/fixtures/vacancy-radix-profissional-product-owner-senior-2026-09.json", "utf8"));
const evidence = JSON.parse(fs.readFileSync("data/evidence-map.json", "utf8"));
const profile = JSON.parse(fs.readFileSync("data/profile.json", "utf8"));

const pack = buildJobPack(vacancy, evidence.claims, profile);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const status = (group, requirement) => {
  const item = pack.matcher.matches[group].find((match) => match.requirement === requirement);
  assert(item, `Missing matcher result: ${group}/${requirement}`);
  return item.status;
};

assert(pack.status === "review_required", "Real-vacancy Job Pack must require human review.");
assert(pack.review_reasons.includes("salary research is missing"), "Salary review reason must be explicit.");
assert(pack.competencies.length <= 3, "Job Pack must contain at most 3 competencies.");
assert(pack.presentation.length <= 1500, "Presentation must be at most 1500 characters.");
assert(pack.profile_source === "linkedin", "Job Pack must use the LinkedIn-sourced profile.");
assert(pack.keywords.includes("Product Owner"), "Verified Product Owner keyword should be included.");
assert(pack.keywords.includes("Jira"), "Verified Jira keyword should be included.");
assert(pack.keywords.includes("User Stories"), "Verified User Stories keyword should be included.");
assert(pack.keywords.includes("Product Metrics"), "Verified Product Metrics keyword should be included.");
assert(!pack.keywords.includes("SQL"), "Unsupported SQL keyword must not be included.");
assert(!pack.keywords.includes("BDD"), "Unsupported BDD keyword must not be included.");

assert(status("must_have", "Agile Methodologies") === "partial", "Agile methodologies must remain partial.");
assert(status("must_have", "Waterfall") === "gap", "Waterfall must remain a gap.");
assert(status("must_have", "Jira") === "verified", "Jira must be verified.");
assert(status("must_have", "Functional Requirements") === "verified", "Requirements evidence must support functional requirements.");
assert(status("must_have", "Non-Functional Requirements") === "verified", "Requirements evidence must support non-functional requirements.");
assert(status("must_have", "User Stories") === "verified", "User Stories must be verified.");
assert(status("must_have", "Use Cases") === "gap", "Use Cases must remain a gap.");
assert(status("must_have", "BDD") === "gap", "BDD must remain a gap.");
assert(status("must_have", "Traceability Matrix") === "gap", "Traceability Matrix must remain a gap.");
assert(status("must_have", "Low-Fidelity Prototyping") === "gap", "Low-fidelity prototyping must remain a gap.");
assert(status("must_have", "Product Metrics") === "verified", "Product Metrics must be verified.");
assert(status("must_have", "SQL") === "gap", "SQL must remain a gap.");

assert(status("preferred", "UX/UI") === "verified", "UX/UI must be verified.");
assert(status("responsibilities", "Backlog Refinement") === "verified", "Backlog refinement must be verified.");
assert(status("responsibilities", "System Validation") === "verified", "System validation must be supported by validation evidence.");
assert(status("responsibilities", "Team Leadership") === "gap", "Team leadership must not be inferred.");
assert(status("responsibilities", "Mentoring") === "gap", "Mentoring must not be inferred.");
assert(status("responsibilities", "Market Analysis") === "gap", "Market analysis must remain a gap.");

const ownershipVacancy = {
  ...vacancy,
  id: "radix-ownership-check",
  normalized: { must_have: ["end-to-end Product Backlog ownership"] }
};
const ownershipPack = buildJobPack(ownershipVacancy, evidence.claims, profile);
assert(ownershipPack.matcher.matches.must_have[0].status === "partial", "End-to-end Product Backlog ownership must remain partial.");

console.log(JSON.stringify(pack, null, 2));
console.log("Real Radix vacancy validation passed.");
