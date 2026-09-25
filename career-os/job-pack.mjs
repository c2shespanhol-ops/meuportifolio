import { matchVacancy } from "./job-matcher.mjs";

const MAX_PRESENTATION_CHARS = 1500;
const unique = (items) => [...new Set(items.filter(Boolean))];

function verifiedRequirements(matchResult) {
  return Object.values(matchResult.matches).flat().filter((item) => item.status === "verified");
}

function selectCompetencies(vacancy, matchResult, evidenceClaims) {
  const verified = verifiedRequirements(matchResult);
  const ordered = [
    ...(vacancy.normalized?.must_have ?? []),
    ...(vacancy.normalized?.responsibilities ?? []),
    ...(vacancy.normalized?.preferred ?? []),
    ...(vacancy.normalized?.tools ?? [])
  ];
  const result = [];
  for (const requirement of ordered) {
    const hit = verified.find((item) => item.requirement === requirement);
    if (!hit) continue;
    const claim = evidenceClaims.find((item) =>
      item.status === "verified" &&
      item.aliases.some((alias) =>
        hit.requirement.toLowerCase().includes(alias.toLowerCase()) ||
        alias.toLowerCase().includes(hit.requirement.toLowerCase())
      )
    );
    if (claim && !result.includes(requirement)) result.push(requirement);
    if (result.length === 3) break;
  }
  return unique(result).slice(0, 3);
}

function verifiedKeywords(vacancy, evidenceClaims) {
  const claims = evidenceClaims.filter((claim) => claim.status === "verified");
  return unique((vacancy.normalized?.keywords ?? []).filter((keyword) =>
    claims.some((claim) => claim.aliases.some((alias) => alias.toLowerCase() === keyword.toLowerCase()))
  ));
}

function buildPresentation(vacancy, matchResult) {
  const verified = verifiedRequirements(matchResult)
    .map((item) => item.requirement);
  const focus = unique(verified).slice(0, 4);
  const skills = focus.length ? focus.join(", ") : "Discovery, experiência do usuário e melhoria contínua";

  const text = "Sou Cleyton S. Hespanhol, Product Owner com atuação complementar em UX, conectando usuários, negócio e tecnologia. Minha experiência combina Product Discovery, gestão e refinamento de backlog, priorização, Jira, Kanban e validação de soluções em contextos digitais e SaaS B2B.\n\n" +
    "Para esta oportunidade, destaco experiência verificável em " + skills + ". Também atuo na definição de User Stories e Acceptance Criteria, UAT/OAT e gestão de stakeholders, buscando reduzir gargalos e transformar problemas operacionais em melhorias de produto e experiência.\n\n" +
    "Meu trabalho é orientado por evidências: entender o problema antes da solução, priorizar com clareza, validar antes de escalar e acompanhar o impacto da mudança.";

  return text.slice(0, MAX_PRESENTATION_CHARS);
}

function emptySalary() {
  return {
    market_low: null,
    market_high: null,
    suggested_low: null,
    suggested_high: null,
    sources: [],
    checked_at: null
  };
}

export function buildJobPack(vacancy, evidenceClaims, profile, options = {}) {
  const match = matchVacancy(vacancy, evidenceClaims);
  const keywords = verifiedKeywords(vacancy, evidenceClaims);
  const competencies = selectCompetencies(vacancy, match, evidenceClaims);
  const salary = options.salary ?? emptySalary();

  const reviewReasons = [];
  if (!salary.sources?.length) reviewReasons.push("salary research is missing");
  if (match.match.must_have.partial || match.match.must_have.gap || match.match.must_have.unknown) {
    reviewReasons.push("must-have requirements need human review");
  }
  if (match.match.responsibilities.partial || match.match.responsibilities.gap || match.match.responsibilities.unknown) {
    reviewReasons.push("responsibility requirements need human review");
  }

  return {
    id: "job-pack-" + vacancy.id,
    source: vacancy.source,
    url: vacancy.url,
    title: vacancy.title,
    company: vacancy.company,
    description: vacancy.description,
    keywords,
    evidence: Object.values(match.matches).flat(),
    presentation: buildPresentation(vacancy, match, profile),
    competencies,
    salary,
    status: reviewReasons.length ? "review_required" : "ready_for_review",
    review_reasons: reviewReasons,
    matcher: match
  };
}
