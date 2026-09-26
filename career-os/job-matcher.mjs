const normalize = (value) => String(value ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
  const relations = evidenceClaims.flatMap((claim) =>
    claim.aliases.flatMap((alias) => {
      const requirementNorm = normalize(requirement);
      const aliasNorm = normalize(alias);
      if (requirementNorm === aliasNorm) return [{ claim, relation: "exact" }];
      if (containsTerm(alias, requirement)) return [{ claim, relation: "alias_contains_requirement" }];
      if (containsTerm(requirement, alias)) return [{ claim, relation: "requirement_contains_alias" }];
      return [];
    })
  );

  if (!relations.length) {
    return {
      requirement,
      status: "gap",
      ownership: "none",
      evidence: [],
      rationale: "No verified evidence claim matched this requirement."
    };
  }

  const exactVerified = relations.find((item) => item.relation === "exact" && item.claim.status === "verified");
  const exactPartial = relations.find((item) => item.relation === "exact" && item.claim.status === "partial");
  const relatedVerified = relations.find((item) => item.claim.status === "verified");
  const relatedPartial = relations.find((item) => item.claim.status === "partial");

  if (requirementNeedsOwnership(requirement)) {
    const owned = relations.find((item) => item.claim.status === "verified" && item.claim.ownership === "ownership");
    if (!owned) {
      const candidate = exactPartial || relatedPartial || exactVerified || relatedVerified;
      return {
        requirement,
        status: "partial",
        ownership: candidate?.claim.ownership ?? "none",
        evidence: candidate?.claim.sources ?? [],
        rationale: candidate?.claim.reason ?? "Related evidence exists, but the required ownership level is not verified."
      };
    }
  }

  if (exactVerified) {
    return {
      requirement,
      status: "verified",
      ownership: exactVerified.claim.ownership,
      evidence: exactVerified.claim.sources,
      rationale: "Requirement is supported by an exact verified evidence claim."
    };
  }

  if (exactPartial) {
    return {
      requirement,
      status: "partial",
      ownership: exactPartial.claim.ownership,
      evidence: exactPartial.claim.sources,
      rationale: exactPartial.claim.reason ?? "The requirement has an exact mapped claim, but the evidence is partial."
    };
  }

  if (relatedPartial || relatedVerified) {
    const candidate = relatedPartial || relatedVerified;
    return {
      requirement,
      status: candidate.claim.status === "verified" ? "partial" : "partial",
      ownership: candidate.claim.ownership,
      evidence: candidate.claim.sources,
      rationale: candidate.claim.reason ?? "Related evidence exists, but the requirement is more specific than the mapped evidence."
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
