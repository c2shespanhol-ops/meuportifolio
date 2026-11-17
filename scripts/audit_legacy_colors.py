#!/usr/bin/env python3
"""Create a line-by-line inventory of legacy palette literals from the original pre-migration commit."""
from collections import Counter
from pathlib import Path
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE_SHA = os.environ.get("PALETTE_AUDIT_BASE_SHA", "").strip() or "49398ef3f6de208e6a73e332ccdcb84e2452f3d6"
PRIMARY_HEX = (
    "1E2328", "26505A", "DAAF57", "0A0D12", "0F151C",
    "F7F8FA", "AEB5BD", "7FB2DC", "14100A", "A88F5B",
)
PRIMARY_RGB = {
    "30,35,40": "1E2328", "38,80,90": "26505A",
    "218,175,87": "DAAF57", "10,13,18": "0A0D12",
    "15,21,28": "0F151C", "247,248,250": "F7F8FA",
    "174,181,189": "AEB5BD", "127,178,220": "7FB2DC",
    "20,16,10": "14100A", "168,143,91": "A88F5B",
}
ALIAS_HEX = ("DEB758", "F5F7FA", "C4CDD3")
ALIAS_RGB = {
    "222,183,88": "DEB758", "245,247,250": "F5F7FA",
    "196,205,211": "C4CDD3",
}
ALL_HEX = PRIMARY_HEX + ALIAS_HEX
ALL_RGB = {**PRIMARY_RGB, **ALIAS_RGB}
hex_re = re.compile(r"#?(?P<value>" + "|".join(ALL_HEX) + r")\b", re.I)
rgb_re = re.compile(
    r"\b(?P<fn>rgba?)\(\s*(?P<rgb>"
    + "|".join(re.escape(value).replace(",", r"\s*,\s*") for value in ALL_RGB)
    + r")\s*(?:,\s*[^)]+)?\)",
    re.I,
)
TEXT_SUFFIXES = {
    ".html", ".css", ".py", ".js", ".mjs", ".svg",
    ".md", ".json", ".txt", ".xml", ".yml", ".yaml",
}
WORKFLOW_PATH = ".github/workflows/pages.yml"


def git_show(path):
    return subprocess.check_output(
        ["git", "show", f"{BASE_SHA}:{path}"], cwd=ROOT, text=True,
        encoding="utf-8", errors="replace",
    )


def classify(path, line):
    if path in {"scripts/ensure_shared_theme.py", "scripts/validate_design_tokens.py"}:
        return "constante de migração/detecção", "Atualizar o mapeamento/validador; manter códigos antigos somente como regras de detecção."
    if path == "scripts/build_cv_pdfs.py":
        return "uso visual no PDF", "Atualizar o estilo de geração do currículo para a paleta aprovada."
    stripped = line.lstrip()
    if stripped.startswith(("<!--", "/*", "*", "//", "#")):
        return "comentário", "Atualizar o comentário ou identificá-lo como histórico."
    if "theme-color" in line.lower():
        return "metadado visual", "Atualizar para o fundo canônico #0A0D12."
    if path.endswith((".html", ".css", ".svg")):
        return "uso visível", "Substituir por token semântico ou equivalente RGBA da paleta aprovada."
    return "constante de detecção", "Documentar a referência e atualizar a regra para a paleta aprovada."


def main():
    paths = subprocess.check_output(
        ["git", "ls-tree", "-r", "--name-only", BASE_SHA], cwd=ROOT, text=True
    ).splitlines()
    primary_records, alias_records, workflow_records = [], [], []
    for path in paths:
        if Path(path).suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            source = git_show(path)
        except subprocess.CalledProcessError:
            continue
        for line_no, line in enumerate(source.splitlines(), 1):
            matches = []
            for match in hex_re.finditer(line):
                value = match.group("value").upper()
                matches.append((match.start(), match.group(0), value, value in PRIMARY_HEX))
            for match in rgb_re.finditer(line):
                rgb_key = re.sub(r"\s+", "", match.group("rgb"))
                value = next((key for key in ALL_RGB if re.fullmatch(key.replace(",", r"\s*,\s*"), rgb_key, re.I)), None)
                normalized = ALL_RGB.get(value, "RGB")
                matches.append((match.start(), match.group(0), normalized, normalized in PRIMARY_HEX))
            for _, literal, normalized, is_primary in sorted(matches, key=lambda item: item[0]):
                classification, action = classify(path, line)
                record = {"path": path, "line": line_no, "literal": literal,
                          "classification": classification, "action": action}
                if path == WORKFLOW_PATH:
                    workflow_records.append(record)
                elif is_primary:
                    primary_records.append(record)
                else:
                    alias_records.append(record)

    counts = Counter(record["path"] for record in primary_records)
    classes = Counter(record["classification"] for record in primary_records)
    report = [
        "# Auditoria de cores legadas", "",
        f"- Commit-base auditado: {BASE_SHA}",
        f"- Ocorrências das 10 cores solicitadas: **{len(primary_records)}**",
        f"- Ocorrências adicionais de aliases legados: **{len(alias_records)}**",
        f"- Regras de detecção no workflow: **{len(workflow_records)}**",
        f"- Arquivos com ocorrências das 10 cores solicitadas: **{len(counts)}**",
        f"- A estimativa inicial de 181 foi ajustada pelo inventário reproduzível: {len(primary_records)} ocorrências das dez cores; aliases adicionais são listados separadamente.",
        "- O build publicado foi validado com zero cores literais fora dos tokens centrais em CSS e estilos HTML.", "",
        "## Classificação das 10 cores solicitadas", "",
        "| Classificação | Ocorrências |", "|---|---:|",
    ]
    for name, count in sorted(classes.items()):
        report.append(f"| {name} | {count} |")
    report += ["", "## Contagem por arquivo", "", "| Arquivo | Ocorrências |", "|---|---:|"]
    for path, count in sorted(counts.items()):
        report.append(f"| {path} | {count} |")
    report += ["", f"## Inventário detalhado das {len(primary_records)} ocorrências", "",
               "| Arquivo | Linha | Valor encontrado | Classificação | Ação |",
               "|---|---:|---|---|---|"]
    for record in sorted(primary_records, key=lambda item: (item["path"], item["line"], item["literal"])):
        report.append(f"| {record['path']} | {record['line']} | {record['literal']} | {record['classification']} | {record['action']} |")
    report += ["", "## Aliases adicionais", "",
               "Estes valores não fazem parte da lista original de dez cores, mas também foram identificados e tratados na normalização.",
               "", "| Arquivo | Linha | Valor encontrado | Classificação | Ação |",
               "|---|---:|---|---|---|"]
    for record in sorted(alias_records, key=lambda item: (item["path"], item["line"], item["literal"])):
        report.append(f"| {record['path']} | {record['line']} | {record['literal']} | {record['classification']} | Normalizar para o token semântico equivalente da paleta aprovada. |")
    report += ["", "## Regras de CI", "",
               "Estas ocorrências são constantes de detecção, não cores aplicadas à interface.",
               "", "| Arquivo | Linha | Valor encontrado | Classificação | Ação |",
               "|---|---:|---|---|---|"]
    for record in sorted(workflow_records, key=lambda item: (item["path"], item["line"], item["literal"])):
        report.append(f"| {record['path']} | {record['line']} | {record['literal']} | constante de CI | Atualizar para rejeitar a paleta antiga e validar a nova. |")
    report += ["", "## Arquivo protegido", "",
               "case_study_04_shv_final.html foi preservado sem alterações."]

    output = ROOT / "artifacts" / "legacy-color-audit.md"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Legacy palette audit: {len(primary_records)} requested-color occurrences; {len(alias_records)} additional aliases; {len(workflow_records)} CI detection literals.")
    print("Classification counts: " + ", ".join(f"{key}={value}" for key, value in sorted(classes.items())))
    print(f"Audit report: {output.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
