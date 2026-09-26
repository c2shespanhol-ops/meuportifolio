import fs from "node:fs";
import { buildJobPack } from "../career-os/job-pack.mjs";

const vacancy = JSON.parse(fs.readFileSync("data/fixtures/vacancy-po-001.json", "utf8"));
const evidence = JSON.parse(fs.readFileSync("data/evidence-map.json", "utf8"));
const profile = JSON.parse(fs.readFileSync("data/profile.json", "utf8"));

const pack = buildJobPack(vacancy, evidence.claims, profile);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(pack.competencies.length <= 3, "Job Pack must contain at most 3 competencies.");
assert(pack.presentation.length <= 1500, "Presentation must be at most 1500 characters.");
assert(pack.keywords.includes("Product Discovery"), "Verified vacancy keyword should be included.");
assert(!pack.keywords.includes("Product Backlog"), "Unsupported keyword must not be included.");
assert(pack.status === "review_required", "Missing salary research must trigger human review.");
assert(!pack.adapted_cv.skills.includes("Scrum"), "Secondary-source Scrum must not enter the adapted CV automatically.");
assert(!pack.adapted_cv.skills.includes("Service Design"), "Secondary-source Service Design must not enter the adapted CV automatically.");
assert(!pack.adapted_cv.skills.includes("Continuous Improvement"), "Secondary-source Continuous Improvement must not enter the adapted CV automatically.");
assert(pack.review_reasons.includes("salary research is missing"), "Salary review reason must be explicit.");

const ownershipVacancy = {
  ...vacancy,
  id: "job-pack-ownership-check",
  normalized: { must_have: ["end-to-end Product Backlog ownership"] }
};
const ownershipPack = buildJobPack(ownershipVacancy, evidence.claims, profile);
assert(ownershipPack.matcher.matches.must_have[0].status === "partial", "Ownership requirement must remain partial.");

const thresholdVacancy = {
  ...vacancy,
  id: "job-pack-threshold-check",
  normalized: { must_have: ["SaaS B2B", "Digital Products", "Prioritization", "Technology Degree"] }
};
const thresholdPack = buildJobPack(thresholdVacancy, evidence.claims, profile);
assert(thresholdPack.candidacy.coverage === 75, "Candidacy coverage should count only verified must-have requirements.");
assert(thresholdPack.candidacy.qualifies === true, "More than 50% verified must-have requirements should qualify the candidature.");

const exactHalfVacancy = {
  ...vacancy,
  id: "job-pack-exact-half-check",
  normalized: { must_have: ["SaaS B2B", "Technology Degree"] }
};
const exactHalfPack = buildJobPack(exactHalfVacancy, evidence.claims, profile);
assert(exactHalfPack.candidacy.coverage === 50, "Exact 50% coverage must be represented accurately.");
assert(exactHalfPack.candidacy.qualifies === true, "Exactly 50% must qualify at the threshold.");


console.log(JSON.stringify(pack, null, 2));
console.log("Job Pack tests passed.");
