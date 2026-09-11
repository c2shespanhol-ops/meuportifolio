# PBOS D19 | Auditoria Product do Case 04 · SHV Energy

**Status:** Draft para validação
**Gate:** DG-03
**Objetivo:** identificar práticas de Product, Discovery, UX, métricas, priorização e gestão de stakeholders efetivamente presentes na experiência SHV Energy e avaliar o que merece ser explicitado no portfólio.

## 1. Regra de governança

Esta auditoria não transforma retrospectivamente uma atividade operacional em responsabilidade formal de Product Owner. Cada competência deve ser traduzida apenas quando houver evidência compatível.

## 2. Evidências históricas disponíveis

- Onboarding de novos clientes.
- Orientação sobre consumo e margem de segurança.
- Contato semanal para acompanhamento do nível do tanque.
- Identificação preventiva de risco de ruptura de abastecimento.
- Acionamento da logística para recarga emergencial quando necessário.
- Orientação ao cliente para acionar a Central de Atendimento antes de atingir a ruptura.
- Registro e acompanhamento de recarga por protocolo no Salesforce.
- Confirmação posterior com o cliente de que a recarga ocorreu.
- Uso dos cinco primeiros abastecimentos para formar histórico e calcular média de consumo.
- Transição posterior para abastecimento automático.
- Aplicação de pesquisa de satisfação de três perguntas no onboarding.
- Existência de casos em que o cliente ficou sem gás por ignorar orientação ou por indisponibilidade operacional.

## 3. Práticas de Product identificáveis

### Customer Journey / Journey Management
**Evidência:** a experiência acompanhava uma jornada definida: onboarding → monitoramento → ação preventiva/emergencial → confirmação → formação de histórico → handoff para abastecimento automático.

**Tradução segura:** Customer Journey, Journey Mapping/Management, Onboarding Journey, Handoff.

**Limite:** não afirmar ownership formal de Customer Journey Management.

### Customer Onboarding
**Evidência:** orientação inicial, explicação do processo, margem de segurança e acompanhamento dos primeiros abastecimentos.

**Tradução segura:** Customer Onboarding, User Education, Customer Experience.

### Risk / Preventive Monitoring
**Evidência:** o acompanhamento semanal existia para identificar aproximação da margem de segurança antes de uma possível ruptura.

**Tradução segura:** Preventive Monitoring, Operational Risk Management, Proactive Customer Management.

### Validation / Closed Feedback Loop
**Evidência:** além do protocolo no Salesforce, o usuário confirmava posteriormente com o cliente se o abastecimento havia realmente ocorrido.

**Tradução segura:** Service Validation, Customer Validation, Closed Feedback Loop.

### Data-informed operational decision making
**Evidência:** os cinco primeiros abastecimentos formavam histórico de consumo usado para calcular média e apoiar o intervalo de abastecimento automático.

**Tradução segura:** Data-informed decision making, usage history, consumption pattern analysis.

**Limite:** não afirmar Product Analytics formal ou ownership de KPIs.

### Handoff / Lifecycle Thinking
**Evidência:** havia uma transição explícita entre acompanhamento assistido dos primeiros abastecimentos e o fluxo automático.

**Tradução segura:** Handoff, Customer Lifecycle, operational transition.

### Stakeholder / Cross-functional Coordination
**Evidência:** quando necessário, o processo exigia interação com logística e Central de Atendimento para tratar risco de abastecimento.

**Tradução segura:** Stakeholder Coordination, Cross-functional Collaboration, Operational Coordination.

## 4. Possível conexão com Product Discovery

Existe uma evidência complementar de pensamento orientado ao usuário: o processo não esperava a ruptura para agir. O acompanhamento buscava entender o estado do cliente e antecipar um problema operacional.

Isso se aproxima de **proactive customer experience** e **risk-based service management**, mas não deve ser apresentado como Product Discovery formal.

## 5. Pesquisa de satisfação

A pesquisa de três perguntas fazia parte da atividade produtiva e avaliava a capacidade técnica e organização das equipes de alvenaria, instalação e abastecimento.

**Tradução segura:** Customer Satisfaction Survey / Customer Feedback Collection.

**Limite:** não apresentar como NPS, programa de Voice of Customer ou gestão de satisfação baseada em analytics, pois isso não está comprovado.

## 6. O que o case atual já comunica bem

- Customer Onboarding.
- Customer Journey.
- Preventive Monitoring.
- Operational Risk.
- Salesforce / CRM.
- Validation.
- Consumption History.
- Handoff.
- Escala operacional.

## 7. O que pode ser tornado mais explícito

### A. Pensamento orientado ao risco

O acompanhamento de 35% não era apenas uma rotina. Havia uma lógica preventiva: identificar um sinal antes da ruptura e acionar o processo adequado.

### B. Feedback loop fechado

O caso mostra algo mais forte do que simplesmente registrar uma ocorrência: havia comparação entre registro sistêmico e confirmação do cliente.

### C. Customer lifecycle

Os cinco primeiros abastecimentos tinham uma função de transição. O histórico construído naquele período permitia passar para o abastecimento automático.

### D. Dados usados para decisão operacional

A média de consumo não era apenas um dado armazenado. Ela era utilizada para estabelecer o padrão de abastecimento seguinte.

### E. Cross-functional coordination

O processo conectava cliente, atendimento, logística e Salesforce. Isso pode ser explicitado como coordenação entre diferentes áreas.

## 8. O que NÃO deve ser acrescentado

- Product Owner formal.
- Product Manager.
- Product Strategy.
- Product Vision.
- Product Roadmap.
- Product Backlog.
- Discovery formal de produto.
- Product Analytics formal.
- Ownership de KPIs.
- NPS ou Voice of Customer estratégico.
- Customer Success formal, caso não seja o cargo/processo original.
- Automação criada pelo usuário.
- Ownership da política de margem de segurança.
- Ownership do processo de abastecimento automático.

## 9. Recomendação

Atualizar o Case 04 para tornar mais explícitos quatro sinais de maturidade transferíveis para Product Owner:

1. **Customer Journey e lifecycle thinking**
2. **Proactive monitoring e risk-based decision making**
3. **Closed feedback loop e customer validation**
4. **Data-informed operational decision making e cross-functional coordination**

A atualização deve complementar o case existente, não substituir sua natureza operacional.

## 10. Próxima etapa

Submeter estes achados à validação do usuário em blocos de dois pontos. Após validação, atualizar o Case 04 publicamente e registrar o commit.
