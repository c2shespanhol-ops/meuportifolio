const normalize = (value) => String(value ?? "")
  .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const containsTerm = (text, term) => {
  const haystack = ` ${normalize(text)} `;
  const needle = ` ${normalize(term)} `;
  return haystack.includes(needle);
};

const requirementNeedsOwnership = (requirement) => {
  const text = normalize(requirement);
  return /ownership|owner|owned|own end to end|end to end/.test(text);
};

export function matchRequirement(requirement, evidenceClaims) {
  const direct = evidenceClaims.filter((claim) =>
    claim.aliases.some((alias) => containsTerm(requirement, alias) || containsTerm(alias, requirement))
  );

  if (!direct.length) {
    return {
      requirement,
      status: "gap",
      ownership: "none",
      evidence: [],
      rationale: "No verified evidence claim matched this requirement."
    };
  }

  const exact = direct.find((claim) => claim.status === "verified");
  const partial = direct.find((claim) => claim.status === "partial");

  if (requirementNeedsOwnership(requirement)) {
    const owned = direct.find((claim) => claim.status === "verified" && claim.ownership === "ownership");
    if (!owned) {
      const candidate = partial || exact;
      return {
        requirement,
        status: "partial",
        ownership: candidate?.ownership ?? "none",
        evidence: candidate?.sources ?? [],
        rationale: candidate?.reason ?? "Related evidence exists, but the required ownership level is not verified."
      };
    }
  }

  if (exact) {
    return {
      requirement,
      status: "verified",
      ownership: exact.ownership,
      evidence: exact.sources,
      rationale: "Requirement is supported by a verified evidence claim."
    };
  }

  if (partial) {
    return {
      requirement,
      status: "partial",
      ownership: partial.ownership,
      evidence: partial.sources,
      rationale: partial.reason ?? "Related evidence exists but is not sufficient for a verified match."
    };
  }

  return {
    requirement,
    status: "unknown",
    ownership: "none",
    evidence: [],
    rationale: "Evidence mapping is ambiguous and requires human review."
  };
}

const emptySummary = () => ({ total: 0, verified: 0, partial: 0, gap: 0, unknown: 0, coverage: 0 });

function summarize(matches) {
  const summary = emptySummary();
  summary.total = matches.length;
  for (const match of matches) summary[match.status] += 1;
  summary.coverage = summary.total ? Number(((summary.verified / summary.total) * 100).toFixed(1)) : 0;
  return summary;
}

export function matchVacancy(vacancy, evidenceClaims) {
  const normalized = vacancy?.normalized ?? {};
  const groups = [
    ["must_have", normalized.must_have ?? []],
    ["preferred", normalized.preferred ?? []],
    ["tools", normalized.tools ?? []],
    ["responsibilities", normalized.responsibilities ?? []],
    ["domain_terms", normalized.domain_terms ?? []]
  ];

  const matches = Object.fromEntries(groups.map(([group, requirements]) => [
    group,
    requirements.map((requirement) => matchRequirement(requirement, evidenceClaims))
  ]));

  return {
    vacancy_id: vacancy.id,
    title: vacancy.title,
    company: vacancy.company,
    match: {
      must_have: summarize(matches.must_have),
      preferred: summarize(matches.preferred),
      tools: summarize(matches.tools),
      responsibilities: summarize(matches.responsibilities),
      domain_terms: summarize(matches.domain_terms)
    },
    matches
  };
}
