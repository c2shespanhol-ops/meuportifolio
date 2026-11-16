# Evidências de auditoria - 16/11/2026

Esta pasta registra os resultados da auditoria automatizada executada no commit `e43e147fdaf6feb402545a9ebd715c3b0fcac1e8`.

## Relatórios
- `relatorio-wcag.md`: resultados e limites da auditoria de contraste WCAG 2.1 AA.
- `relatorio-privacidade.md`: evidências do teste de consentimento e requisições de Analytics.

## Arquivos originais preservados
Os dois artefatos originais foram baixados da execução do GitHub Actions, empacotados e versionados nesta pasta:
- [Pacote original da auditoria de contraste](arquivos-originais/portfolio-contrast-audit.zip), com o relatório bruto e as capturas das páginas.
- [Pacote original da auditoria de privacidade](arquivos-originais/portfolio-privacy-consent-audit.zip), com o log de rede e as capturas do banner.
- [Checksums SHA-256](arquivos-originais/SHA256SUMS.txt), para verificação de integridade dos pacotes.

## Execuções
- [Execução principal da auditoria](https://github.com/c2shespanhol-ops/meuportifolio/actions/runs/43955284991)
- [Deploy dos relatórios](https://github.com/c2shespanhol-ops/meuportifolio/actions/runs/43963088801)
- [Execução de arquivamento dos arquivos originais](https://github.com/c2shespanhol-ops/meuportifolio/actions/runs/43965011151)
- [Commit auditado](https://github.com/c2shespanhol-ops/meuportifolio/commit/e43e147fdaf6feb402545a9ebd715c3b0fcac1e8)

## Status documental
- Testes automatizados: concluídos com sucesso.
- Aprovação humana: confirmada pelo responsável pelo portfólio. A aprovação já havia ocorrido antes desta atualização; a data original não foi informada e, por isso, não é presumida neste registro.
- Arquivos originais: preservados permanentemente nos pacotes ZIP desta pasta.
