#!/usr/bin/env python3
"""Create a line-by-line inventory of legacy palette literals from the pre-migration commit."""
from collections import Counter
from pathlib import Path
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE_SHA = os.environ.get("PALETTE_AUDIT_BASE_SHA", "").strip()
if not BASE_SHA:
    BASE_SHA = subprocess.check_output(["git", "rev-parse", "HEAD^"], cwd=ROOT, text=True).strip()

LEGACY_HEX = (
    "1E2328", "26505A", "DAAF57", "0A0D12", "0F151C",
    "F7F8FA", "AEB5BD", "7FB2DC", "14100A", "A88F5B",
)
RGB_TO_HEX = {
    "30,35,40": "1E2328", "38,80,90": "26505A",
    "218,175,87": "DAAF57", "10,13,18": "0A0D12",
    "15,21,28": "0F151C", "247,248,250": "F7F8FA",
    "174,181,189": "AEB5BD", "127,178,220": "7FB2DC",
    "20,16,10": "14100A", "168,143,91": "A88F5B",
}
EXTRA_HEX = ("DEB758", "F5F7FA", "C4CDD3")
EXTRA_RGB = {
    "222,183,88": "DEB758", "245,247,250": "F5F7FA",
    "196,205,211": "C4CDD3",
}
ALL_HEX = LEGACY_HEX + EXTRA_HEX
hex_re = re.compile(r"#(?P<value>" + "|".join(ALL_HEX) + r")\b", re.I)
rgb_values = {**RGB_TO_HEX, **EXTRA_RGB}
rgb_re = re.compile(
    r"\b(?P<fn>rgba?)\(\s*(?P<rgb>"
    + "|".join(re.escape(value).replace(",", r"\s*,\s*") for value in rgb_values)
    + r")\s*(?:,\s*[^)]+)?\)",
    re.I,
)
TEXT_SUFFIXES = {".html", ".css", ".py", ".js", ".mjs", ".svg", ".md", ".json", ".txt", ".xml"}
WORKFLOW_PATH = ".github/workflows/pages.yml"


def git_show(path):
    return subprocess.check_output(
        ["git", "show", f"{BASE_SHA}:{path}"], cwd=ROOT, text=True,
        encoding="utf-8", errors="replace",
    )


def classify(path, line):
    if path in {"scripts/ensure_shared_theme.py", "scripts/validate_design_tokens.py"}:
        return "constante de migração/detecção", "Atualizar mapeamento e validador; manter códigos antigos apenas como regras de detecção."
    if path == "scripts/build_cv_pdfs.py":
        return "uso visual no PDF", "Aplicar a cor equivalente da paleta aprovada ao estilo de geração do currículo."
    stripped = line.lstrip()
    if stripped.startswith(("<!--", "/*", "*", "//", "#")):
        return "comentário", "Atualizar o comentário ou identificá-lo explicitamente como histórico."
    if "theme-color" in line.lower():
        return "metadado visual", "Atualizar para o fundo canônico #080d12."
    if path.endswith((".html", ".css", ".svg")):
        return "uso visível", "Substituir pelo token ou equivalente RGBA da paleta aprovada."
    return "constante de detecção", "Documentar a referência e atualizar a regra para a paleta aprovada."


def main():
    paths = subprocess.check_output(
        ["git", "ls-tree", "-r", "--name-only", BASE_SHA], cwd=ROOT, text=True
    ).splitlines()
    records, workflow_records = [], []
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
                matches.append((match.start(), match.group(0), match.group("value").upper()))
            for match in rgb_re.finditer(line):
                rgb_key = re.sub(r"\s+", "", match.group("rgb"))
                value = next((key for key in rgb_values if re.fullmatch(key.replace(",", r"\s*,\s*"), rgb_key, re.I)), None)
                matches.append((match.start(), match.group(0), rgb_values.get(value, "RGB")))
            for _, literal, normalized in sorted(matches, key=lambda item: item[0]):
                classification, action = classify(path, line)
                record = {"path": path, "line": line_no, "literal": literal, "normalized": normalized,
                          "classification": classification, "action": action}
                (workflow_records if path == WORKFLOW_PATH else records).append(record)

    counts = Counter(record["path"] for record in records)
    classes = Counter(record["classification"] for record in records)
    report = [
        "# Auditoria de cores legadas", "",
        f"- Commit-base: {BASE_SHA}",
        f"- Ocorrências no inventário principal: **{len(records)}**",
        f"- Ocorrências de regras de CI separadas: **{len(workflow_records)}**",
        f"- Arquivos com ocorrências no inventário principal: **{len(counts)}**", "",
        "## Classificação", "", "| Classificação | Ocorrências |", "|---|---:|",
    ]
    for name, count in sorted(classes.items()):
        report.append(f"| {name} | {count} |")
    report += ["", "## Contagem por arquivo", "", "| Arquivo | Ocorrências |", "|---|---:|"]
    for path, count in sorted(counts.items()):
        report.append(f"| {path} | {count} |")
    report += ["", "## Inventário detalhado", "",
               "| Arquivo | Linha | Valor encontrado | Classificação | Ação |",
               "|---|---:|---|---|---|"]
    for record in sorted(records, key=lambda item: (item["path"], item["line"], item["literal"])):
        report.append(f"| {record['path']} | {record['line']} | {record['literal']} | {record['classification']} | {record['action']} |")
    report += ["", "## Regras de CI fora do inventário visual", "",
               "As ocorrências no workflow são padrões de detecção/validação, não estilos aplicados à interface.", "",
               "| Arquivo | Linha | Valor encontrado | Classificação | Ação |",
               "|---|---:|---|---|---|"]
    for record in sorted(workflow_records, key=lambda item: (item["path"], item["line"], item["literal"])):
        report.append(f"| {record['path']} | {record['line']} | {record['literal']} | constante de CI | Atualizar o padrão para rejeitar a paleta antiga e validar a nova. |")

    output = ROOT / "artifacts" / "legacy-color-audit.md"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Legacy palette audit: {len(records)} inventory occurrences across {len(counts)} files; {len(workflow_records)} separate CI detection literals.")
    print("Classification counts: " + ", ".join(f"{key}={value}" for key, value in sorted(classes.items())))
    print(f"Audit report: {output.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
