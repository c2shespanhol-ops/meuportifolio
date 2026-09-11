# PBOS D21 | Auditoria Transversal dos Cases 01–05

**Status:** Draft para validação
**Gate:** Pós-DG-03
**Data:** 2026-09-11
**Objetivo:** avaliar os cinco cases públicos como um único portfólio Product Owner, identificando consistência de narrativa, evidência, nomenclatura, limites de responsabilidade, progressão de maturidade e lacunas de posicionamento.

## 1. Critérios da auditoria

Cada case será avaliado em sete dimensões:

1. Problema e contexto
2. Usuário/persona e necessidade
3. Discovery / entendimento do problema
4. Requisitos, decomposição e priorização
5. Validação, entrega e aprendizado
6. Métricas/evidências e limites de causalidade
7. Transferibilidade para Product Owner

A auditoria também avalia a distinção entre responsabilidade individual, participação colaborativa, prática efetivamente realizada, reconstrução posterior em linguagem de Product e resultado observado.

## 2. Leitura transversal atual

### Case 01 · Assistente Virtual Institucional

**Sinais principais:** Product Discovery, visão de produto, personas, jornada, arquitetura conversacional, requisitos e prototipação.

**Força para PO:** demonstra pensamento de produto e estruturação de uma iniciativa digital desde o problema.

**Ponto de atenção:** separar claramente evidência histórica de artefatos de Discovery reconstruídos posteriormente.

### Case 02 · Governança de Produto / Lead Time

**Sinais principais:** problema operacional, Jira, Kanban, fluxo, priorização, SLA, acompanhamento, decisão baseada em dados, validação e Lead Time.

**Força para PO:** demonstra gestão de fluxo, priorização orientada por impacto e conexão entre problema operacional e resultado mensurável.

**Ponto de atenção:** evitar transformar a atuação em ownership absoluto de Produto ou responsabilidade técnica de TI.

### Case 03 · Habitat

**Sinais principais:** CX + Produto + Scrum, SaaS, personas, jornadas, Discovery, decomposição, priorização, Product Backlog, Refinement, Planning, Daily, Review, Retrospective, validação, Customer Insights e Stakeholder Influence.

**Força para PO:** é o case mais completo para demonstrar atuação multifuncional na interface entre cliente, produto e desenvolvimento.

**Ponto de atenção:** manter explícito que a priorização final de novas funcionalidades permanecia com o proprietário do produto e que o case não representa ownership formal exclusivo de PO/Scrum Master.

### Case 04 · SHV Energy

**Sinais principais:** Customer Onboarding, Customer Journey, monitoramento preventivo, risco operacional, Salesforce, validação, histórico de consumo, handoff e coordenação entre áreas.

**Força para PO:** demonstra lifecycle thinking, acompanhamento preventivo e validação operacional.

**Ponto de atenção:** não forçar linguagem de Product Management onde a evidência é predominantemente operacional.

### Case 05 · PAV Receita Federal

**Sinais principais:** Service Discovery, Citizen Journey, Benchmarking, Requirements Gathering, Operational Readiness, Stakeholder Management, Implementation Support e User Validation.

**Força para PO:** demonstra capacidade de investigar problema, traduzir necessidade em requisitos, trabalhar com múltiplos stakeholders e acompanhar uma solução até a operação.

**Ponto de atenção:** manter a distinção entre participação na implantação e ownership formal do projeto/solução.

## 3. Competências recorrentes

### Evidência forte transversal

- Discovery / Problem Discovery
- User Focus
- Personas e User Journey
- Requirements Gathering
- Decomposição de problemas e jornadas
- Priorização por valor/impacto
- Stakeholder Management
- Validation
- Continuous Improvement
- Problem Solving
- Product Thinking
- Product Operations / Service Operations
- Kanban / Flow

### Evidência forte, mas concentrada

- SaaS: principalmente Habitat
- Scrum: principalmente Habitat
- Product Metrics / Lead Time: principalmente Case 02
- Service Design: principalmente PAV
- Lifecycle / Onboarding: principalmente SHV
- Product Vision / Strategy / Roadmap: como prática reconstruída em D14, não como ownership histórico transversal

### Competências que exigem cuidado

- E2E Product Ownership
- Product Backlog ownership exclusivo
- Product Vision ownership histórico
- Product Strategy ownership histórico
- Product Roadmap ownership histórico
- Product Analytics formal
- KPI ownership formal

## 4. Diagnóstico transversal

O portfólio já demonstra uma linha coerente de atuação:

**problema real → usuário → Discovery → requisitos/decomposição → priorização → execução/implementação → validação → evidência → melhoria.**

A principal oportunidade não é inventar novas competências. É tornar essa linha visível e consistente em todos os cases.

## 5. Arquitetura narrativa recomendada

Todos os cinco cases devem convergir progressivamente para uma arquitetura comum:

1. Contexto
2. Problema
3. Usuário / necessidade
4. O que eu fiz
5. Como tomei decisões
6. Execução / colaboração
7. Validação
8. Resultados / evidências
9. O que esta experiência demonstra
10. Limites de responsabilidade, quando necessário
11. Artefatos / fontes

A padronização não exige reescrever todo o conteúdo de uma vez. Primeiro deve existir uma hierarquia visual comum. Depois, divergências relevantes de conteúdo podem ser ajustadas sem apagar fatos já validados.

## 6. Auditoria visual

A leitura dos arquivos atuais mostra heterogeneidade entre index e cases, especialmente em:

- tokens de cor;
- larguras máximas;
- escala de títulos e textos;
- espaçamento de seções;
- estilos de cards e botões;
- navegação e botão de retorno;
- monograma H;
- assinatura profissional;
- rodapé.

### Padrão visual PBOS para unificação

**Paleta**
- Fundo principal: `#1E2328`
- Superfície: `#242B31`
- Superfície secundária: `#2B343B`
- Dourado: `#DAAF57`
- Dourado claro: `#E6C47A`
- Teal: `#26505A`
- Texto principal: `#F5F7FA`
- Texto secundário: `#A9B0B7`

**Tipografia**
- DM Sans para corpo, navegação e elementos funcionais.
- Cormorant Garamond para títulos e destaques editoriais.
- Orbitron para labels, microcopy e metadados técnicos.

**Assinatura oficial**

`Cleyton Hespanhol | Product Owner | UX`

**Monograma**

H branco, em fonte sem serifa, dentro de círculo dourado, sobre fundo escuro.

**Footer padrão**

Assinatura oficial + copyright 2026 + link para LinkedIn.

## 7. Estratégia de implementação

Foi criado um stylesheet compartilhado `portfolio-theme.css` e um script de padronização `scripts/standardize_portfolio.py`. O objetivo é aplicar a camada visual comum sem apagar o conteúdo específico dos cases.

Foi também criado um workflow de GitHub Actions para manter a padronização aplicada aos HTMLs do portfólio após alterações futuras.

## 8. Critério de conclusão D21

D21 será considerado concluído quando:

- Cases 01–05 estiverem alinhados na mesma identidade visual;
- index.html estiver alinhado aos cases;
- footer estiver padronizado;
- assinatura profissional estiver padronizada;
- monograma estiver padronizado;
- tipografia e escala tipográfica estiverem padronizadas;
- espaçamentos e largura de conteúdo estiverem padronizados;
- nenhum conteúdo histórico validado tiver sido removido;
- limites de responsabilidade continuarem explícitos onde necessários;
- o portfólio apresentar uma leitura única de profissional Product Owner | UX.

## 9. Estado

A auditoria transversal foi iniciada e o padrão visual foi definido. A validação final deve ocorrer após a execução da padronização no site publicado e uma inspeção visual das páginas principais.
