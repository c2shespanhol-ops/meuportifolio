# Portfolio 2.0 + Career OS

## Objetivo
Transformar o portfólio em um produto digital bilíngue, orientado a evidências, com uma camada privada de inteligência de carreira.

## Princípios
- Evidence first: nenhuma competência, experiência ou palavra-chave será adicionada sem evidência no histórico.
- PT/EN nativos: cada idioma terá conteúdo e URL próprios, sem tradução automática como mecanismo principal.
- Case depth: resumo executivo, case detalhado e sala de evidências.
- Performance first: HTML/CSS/JS simples quando suficiente; evitar dependências desnecessárias.
- Accessibility by default: navegação por teclado, foco visível, semântica, contraste e reduced motion.
- Privacy by design: dados pessoais, candidaturas e credenciais ficam fora do site público.

## Camadas
1. Portfolio público: /pt/ e /en/
2. Cases: templates reutilizáveis e conteúdo orientado a dados
3. Evidence: artefatos, métricas, ownership e limites
4. Career OS privado: vagas, Job Pack, ATS, CV, apresentação, competências, salário e candidaturas
5. Analytics: page views, case views, CV downloads, contact clicks e conversion events

## Career OS: Job Pack
Cada oportunidade poderá gerar:
- descrição original e fonte
- keywords e requisitos
- evidências correspondentes no perfil
- CV adaptado
- texto de apresentação compatível com o limite do formulário
- três competências prioritárias quando o canal solicitar
- faixa salarial de mercado, fontes e data de consulta
- pretensão sugerida como faixa, nunca como promessa
- link e status da candidatura

## Automação de LinkedIn
A fonte canônica do perfil será data/profile.json. O projeto deve suportar sincronização futura com uma fonte autorizada. A integração não deve depender de scraping frágil nem armazenar senha do LinkedIn no repositório.

## Automação de vagas
O agente diário deve coletar somente por mecanismos permitidos por cada fonte. Quando uma plataforma não oferecer integração oficial para candidatura automatizada, o sistema muda para candidatura assistida e envia o Job Pack para revisão.

## Próximas fases
- Fase 1: refatoração visual, conteúdo, PT/EN, analytics, CV e contato.
- Fase 2: Career OS, Job Matcher, ATS e Job Pack.
- Fase 3: Salary Intelligence, histórico e candidatura assistida.
- Fase 4: integrações oficiais e automações adicionais conforme permissões das plataformas.
