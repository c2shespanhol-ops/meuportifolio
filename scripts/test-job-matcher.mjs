import fs from "node:fs";
import { matchVacancy } from "../career-os/job-matcher.mjs";

const vacancy = JSON.parse(fs.readFileSync("data/fixtures/vacancy-po-001.json", "utf8"));
const evidence = JSON.parse(fs.readFileSync("data/evidence-map.json", "utf8"));

const result = matchVacancy(vacancy, evidence.claims);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(result.match.must_have.coverage === 100, "Expected 100% must-have coverage.");
assert(result.match.preferred.coverage === 100, "Expected 100% preferred coverage.");
assert(result.match.tools.coverage === 100, "Expected 100% tool coverage.");
assert(result.match.responsibilities.coverage === 100, "Expected 100% responsibility coverage.");
assert(result.matches.must_have.every((item) => item.status === "verified"), "All synthetic must-have requirements should be verified.");
assert(result.matches.responsibilities.every((item) => item.status === "verified"), "All synthetic responsibilities should be verified.");

const ownershipCheck = matchVacancy({
  ...vacancy,
  id: "ownership-check",
  normalized: { must_have: ["end-to-end Product Backlog ownership"] }
}, evidence.claims);

assert(ownershipCheck.matches.must_have[0].status === "partial", "Product Backlog ownership must remain partial.");

console.log(JSON.stringify(result, null, 2));
console.log("Matcher tests passed.");
