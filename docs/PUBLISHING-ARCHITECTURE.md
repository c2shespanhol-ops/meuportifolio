# Publicação do portfólio e separação da HS MIND

## Decisão

O domínio `hsmind.com.br` será preservado para o futuro site institucional da HS MIND.

O portfólio profissional de Cleyton Hespanhol não deverá ser publicado como site principal da HS MIND.

## Arquitetura aprovada

```
LinkedIn
   ↓
Domínio pessoal de Cleyton Hespanhol
   ↓
Portfolio 2.0
   ├── Cases PT/EN
   ├── CV PT/EN
   ├── Evidências
   └── Career OS
        ├── Job Matcher
        ├── Job Pack
        ├── Vacancy Triage
        └── Application Tracker

HS MIND
   ↓
hsmind.com.br
   ↓
Site institucional futuro
   ├── HS MIND
   ├── PBOS
   ├── serviços/produtos
   └── cases empresariais
```

## Regras de publicação

1. Não alterar o domínio `hsmind.com.br` para apontar para o Portfolio 2.0.
2. Não fazer merge do PR #3 com a finalidade de substituir o site público atual da HS MIND antes de definir o domínio pessoal.
3. O GitHub continua sendo a base técnica do Portfolio 2.0.
4. O domínio pessoal será definido antes da publicação pública.
5. URLs internas do portfólio devem ser relativas sempre que possível, evitando dependência desnecessária de um domínio específico.
6. Sitemap, canonical, Open Graph e referências absolutas devem usar uma configuração centralizada de URL pública quando a publicação for preparada.
7. A URL pública atual da HS MIND não deve ser usada como fallback silencioso para o novo portfólio.
8. A ausência de domínio pessoal configurado mantém o projeto em estado de pré-publicação.

## Estado atual

- PR #3: aberto, draft, sem merge.
- Branch: `feat/portfolio-2-career-os-foundation`.
- `hsmind.com.br`: preservado para a futura empresa.
- Domínio pessoal do portfólio: ainda não definido.
- Publicação do Portfolio 2.0: ainda não autorizada.
- Main: permanece sem alteração por este trabalho.

## Próximo gate

Antes do merge/publicação:

1. escolher e registrar o domínio pessoal;
2. configurar o domínio no mecanismo de hospedagem;
3. centralizar a URL pública;
4. revisar sitemap/canonicals/links absolutos;
5. executar a suíte de validação;
6. verificar o site em produção;
7. somente então considerar o merge para publicação.

## Princípio

A marca profissional e a marca empresarial são ativos diferentes.

O portfólio deve responder à pergunta **"quem é Cleyton como Product Owner?"**.

O site da HS MIND deverá responder à pergunta **"o que é a HS MIND e o que ela oferece?"**.
