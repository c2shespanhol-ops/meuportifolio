# Career OS · LinkedIn Sync

## Objetivo

O LinkedIn é a fonte principal da trajetória profissional. O Career OS não deve sobrescrever essa fonte com dados inventados ou derivados de versões antigas do currículo.

O fluxo é:

1. obter um snapshot atualizado do perfil LinkedIn;
2. colocar o snapshot em `career-os/inbox/linkedin-profile.json`;
3. executar `node career-os/linkedin-sync.mjs`;
4. revisar o diff;
5. aplicar somente após a revisão, com `APPLY=true`;
6. gerar/adaptar os currículos a partir do perfil aprovado.

## Limitação atual

O conector LinkedIn disponível não fornece acesso autenticado aos campos completos do próprio perfil do usuário. Por isso, a captura do snapshot ainda é uma etapa externa. O restante do processo é automatizado e protegido por revisão.

## Regra de segurança

O script nunca altera o perfil atual automaticamente quando encontra diferenças. O estado padrão é `review_required`.

## Estrutura esperada

```json
{
  "source": {
    "type": "linkedin-profile-snapshot",
    "profileUrl": "https://www.linkedin.com/in/cleyton-hespanhol/"
  },
  "capturedAt": "2026-09-29T00:00:00-03:00",
  "profile": {
    "name": "Cleyton Hespanhol",
    "headline": "...",
    "about": "...",
    "location": "...",
    "experience": [],
    "education": [],
    "certifications": [],
    "skills": [],
    "languages": []
  }
}
```

A ausência de um campo no snapshot não deve ser interpretada como exclusão do LinkedIn sem revisão humana.
