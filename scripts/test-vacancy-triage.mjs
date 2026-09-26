import fs from "node:fs";
import { triageVacancy } from "../career-os/vacancy-triage.mjs";

const evidence = JSON.parse(fs.readFileSync("data/evidence-map.json", "utf8"));
const bhs = JSON.parse(fs.readFileSync("data/fixtures/vacancy-bhs-product-owner-home-office-2026-09.json", "utf8"));
const radix = JSON.parse(fs.readFileSync("data/fixtures/vacancy-radix-profissional-product-owner-senior-2026-09.json", "utf8"));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const bhsTriage = triageVacancy(bhs, evidence.claims);
assert(bhsTriage.candidacy.coverage > 50, "BHS must exceed the 50% candidacy threshold.");
assert(bhsTriage.candidacy.qualifies === true, "BHS must be an apply candidate.");
assert(bhsTriage.candidacy.decision === "apply_candidate", "BHS decision must be apply_candidate.");

const radixTriage = triageVacancy(radix, evidence.claims);
assert(radixTriage.candidacy.coverage <= 50, "Radix must not exceed the 50% candidacy threshold.");
assert(radixTriage.candidacy.qualifies === false, "Radix must not qualify for candidature.");
assert(radixTriage.candidacy.decision === "do_not_apply", "Radix decision must be do_not_apply.");

const exactHalf = {
  ...bhs,
  id: "exact-half-triage",
  normalized: { must_have: ["SaaS B2B", "Technology Degree"] }
};
const halfTriage = triageVacancy(exactHalf, evidence.claims);
assert(halfTriage.candidacy.coverage === 50, "Exact 50% must be calculated correctly.");
assert(halfTriage.candidacy.decision === "do_not_apply", "Exactly 50% must not qualify.");

console.log(JSON.stringify({ bhs: bhsTriage.candidacy, radix: radixTriage.candidacy, exact_half: halfTriage.candidacy }, null, 2));
console.log("Vacancy triage tests passed.");
