const VALID_STATUSES = new Set([
  "draft",
  "review_required",
  "ready_to_apply",
  "applied",
  "blocked",
  "withdrawn",
  "rejected",
  "interviewing",
  "offer",
  "hired"
]);

const SUBMISSION_STATUSES = new Set(["applied", "interviewing", "offer", "hired"]);

export function createApplication(input) {
  const now = input.now ?? new Date().toISOString();
  const status = input.status ?? "draft";

  if (!VALID_STATUSES.has(status)) throw new Error("Invalid application status.");
  if (!input.id || !input.vacancy_id || !input.company || !input.title || !input.url || !input.source) {
    throw new Error("Application requires id, vacancy_id, company, title, url and source.");
  }

  return {
    id: input.id,
    vacancy_id: input.vacancy_id,
    company: input.company,
    title: input.title,
    url: input.url,
    source: input.source,
    status,
    created_at: now,
    updated_at: now,
    submitted_at: input.submitted_at ?? null,
    confirmation: input.confirmation ?? null,
    job_pack_id: input.job_pack_id ?? null,
    cv_version: input.cv_version ?? null,
    notes: Array.isArray(input.notes) ? input.notes : []
  };
}

export function canMarkApplied(application) {
  if (!application) return false;
  return Boolean(
    application.confirmation &&
    application.confirmation.type &&
    (application.confirmation.reference || application.confirmation.evidence_url || application.confirmation.note)
  );
}

export function transitionApplication(application, nextStatus, evidence = {}) {
  if (!VALID_STATUSES.has(nextStatus)) throw new Error("Invalid application status.");

  if (nextStatus === "applied" && !canMarkApplied({ ...application, confirmation: evidence.confirmation ?? application.confirmation })) {
    throw new Error("Cannot mark application as applied without submission evidence.");
  }

  const now = evidence.now ?? new Date().toISOString();
  const next = {
    ...application,
    status: nextStatus,
    updated_at: now
  };

  if (SUBMISSION_STATUSES.has(nextStatus) && !next.submitted_at) {
    next.submitted_at = evidence.submitted_at ?? now;
  }

  if (evidence.confirmation) next.confirmation = evidence.confirmation;
  if (evidence.cv_version) next.cv_version = evidence.cv_version;
  if (evidence.note) next.notes = [...(next.notes ?? []), evidence.note];

  return next;
}

export function applicationStatusLabel(status) {
  const labels = {
    draft: "Job Pack em rascunho",
    review_required: "Revisão necessária",
    ready_to_apply: "Pronta para candidatura",
    applied: "Candidatura enviada",
    blocked: "Bloqueada",
    withdrawn: "Retirada",
    rejected: "Encerrada sem avanço",
    interviewing: "Em entrevista",
    offer: "Proposta",
    hired: "Contratado"
  };
  return labels[status] ?? "Status desconhecido";
}
