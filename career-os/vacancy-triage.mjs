import { matchVacancy } from "./job-matcher.mjs";

export const CANDIDACY_THRESHOLD_PERCENT = 50;

export function evaluateCandidacy(matchResult) {
  const requirements = matchResult.matches.must_have ?? [];
  const total = requirements.length;
  const verified = requirements.filter((item) => item.status === "verified").length;
  const coverage = total ? Number(((verified / total) * 100).toFixed(1)) : 0;

  return {
    qualifies: total > 0 && coverage >= CANDIDACY_THRESHOLD_PERCENT,
    threshold_percent: CANDIDACY_THRESHOLD_PERCENT,
    rule: "at_least_50_percent_of_must_have_requirements_verified",
    basis: "must_have",
    total,
    verified,
    coverage,
    decision: total === 0 ? "review_required" : coverage > CANDIDACY_THRESHOLD_PERCENT ? "apply_candidate" : "do_not_apply"
  };
}

export function triageVacancy(vacancy, evidenceClaims) {
  const matcher = matchVacancy(vacancy, evidenceClaims);
  return {
    vacancy_id: vacancy.id,
    title: vacancy.title,
    company: vacancy.company,
    url: vacancy.url,
    candidacy: evaluateCandidacy(matcher),
    matcher
  };
}
