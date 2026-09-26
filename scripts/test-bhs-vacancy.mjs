import fs from "node:fs";
import { buildJobPack } from "../career-os/job-pack.mjs";

const vacancy = JSON.parse(fs.readFileSync("data/fixtures/vacancy-bhs-product-owner-home-office-2026-09.json", "utf8"));
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

assert(pack.status === "review_required", "BHS Job Pack must require human review.");
assert(pack.candidacy.qualifies === true, "BHS vacancy should qualify as a candidature above the 50% threshold.");
assert(pack.candidacy.basis === "must_have", "Candidacy threshold must be based on must-have requirements.");
assert(pack.candidacy.coverage > 50, "BHS candidacy coverage must be greater than 50%.");
assert(pack.profile_source?.primary_source === "linkedin", "Job Pack must use the LinkedIn-sourced profile.");
assert(vacancy.location.remote === true, "BHS fixture must remain remote.");
assert(pack.keywords.includes("Product Owner"), "Product Owner must be a verified keyword.");
assert(pack.keywords.includes("SaaS B2B"), "SaaS B2B must be a verified keyword.");
assert(pack.keywords.includes("Digital Products"), "Digital Products must be a verified keyword.");
assert(pack.keywords.includes("Prioritization"), "Prioritization must be a verified keyword.");
assert(!pack.keywords.includes("AI Tools"), "Unsupported AI Tools keyword must not be included.");
assert(!pack.keywords.includes("Agile Certification"), "Unsupported Agile Certification keyword must not be included.");

assert(status("must_have", "Technology Degree") === "gap", "Technology degree must remain a gap.");
assert(status("must_have", "Agile Methodologies") === "partial", "Agile methodologies must remain partial.");
assert(status("must_have", "SaaS B2B") === "verified", "SaaS B2B must be verified.");
assert(status("must_have", "Digital Products") === "verified", "Digital Products must be verified.");
assert(status("must_have", "Prioritization") === "verified", "Prioritization must be verified.");
assert(status("responsibilities", "Backlog Refinement") === "verified", "Backlog refinement must be verified.");
assert(status("responsibilities", "Backlog Prioritization") === "partial", "Backlog prioritization must remain partial when the evidence is related but not exact.");
assert(status("responsibilities", "Client Training") === "gap", "Client training must not be inferred.");
assert(status("preferred", "UX") === "verified", "UX must be verified.");
assert(!pack.review_reasons.some((reason) => reason.includes("candidacy threshold not met")), "A vacancy above the 50% threshold must not be blocked by the candidacy gate.");

console.log(JSON.stringify(pack, null, 2));
console.log("Real BHS vacancy validation passed.");
