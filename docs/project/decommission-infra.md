# Descomissionamento da infraestrutura

**Data:** 2026-09-12
**Contexto:** [`decision-parked.md`](./decision-parked.md) — o projeto foi estacionado.
**Objetivo:** encerrar (ou congelar) a infraestrutura que roda hoje, sem quebrar o que ainda serve e sem deixar credenciais vivas.

---

## 1. Inventário: o que está rodando hoje

| # | Recurso | Onde | Estado | Custo | Reversível? |
|---|---------|------|--------|-------|-------------|
| 1 | **Cloudflare Pages `skelica`** | `https://skelica.pages.dev` (HTTP 200 verificado) | Ativo, servindo | R$ 0 (plano free) | ✅ recriável |
| 2 | **GitHub Actions `deploy.yml`** | `.github/workflows/` | **Congelado nesta sessão** (só manual) | R$ 0 | ✅ revertível no git |
| 3 | **GitHub Actions `e2e.yml`** | idem | **Congelado** | R$ 0 | ✅ |
| 4 | **GitHub Actions `iac.yml`** | idem | **Congelado** | R$ 0 | ✅ |
| 5 | **Secrets do GitHub** | Configurações do repo | Ativos | R$ 0 | ⚠️ recriar dá trabalho |
| 6 | **Terraform IaC `iac/`** | Repo | **Estado vazio** (ver §4.1) | R$ 0 | — |
| 7 | **CDN do HuggingFace** | `huggingface.co` (terceiro) | Runtime | R$ 0 | N/A — não é nosso |

**Não existe** (verificado): `vercel.json`, `netlify.toml` — as menções a Vercel/Netlify na documentação eram falsas e foram corrigidas. Nenhum domínio customizado: `skelica.pages.dev` é o subdomínio padrão do Pages.

**Secrets em uso** (extraídos dos workflows): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, e **`ANTHROPIC_API_KEY`** — este último é injetado no ambiente do job de smoke (`deploy.yml` → `smoke`), que roda um navegador headless. **Ver §5.**

---

## 2. Duas opções — escolha uma

### Opção A — Congelar (recomendada para preservar o URL)

O site continua servindo, ninguém consegue reimplantar, e o URL `skelica.pages.dev` segue vivo para portfólio, currículo ou referência.

- **Custo:** R$ 0/mês
- **Trabalho:** ~10 min (já feito no repo + desconectar a integração Git no painel)
- **O que se perde:** nada funcional
- **Quando escolher:** você quer o link vivo, ou não tem certeza ainda

### Opção B — Desligar de verdade

Apaga o projeto do Cloudflare Pages. O URL deixa de responder.

- **Custo:** R$ 0/mês (era R$ 0 de qualquer forma)
- **Trabalho:** ~15 min
- **O que se perde:** o URL público e o histórico de deploys do Pages
- **Quando escolher:** você quer zerar a superfície e não vê valor no link

> Em ambas as opções, a **revogação de credenciais (§5) é obrigatória**. Ela é o que realmente encerra o risco. Apagar o site sem revogar o token deixa a credencial viva para nada.

---

## 3. Plano por fases

### Fase 0 — ✅ Já feito nesta sessão (no repositório)

- [x] `deploy.yml`, `e2e.yml` e `iac.yml` passaram a rodar **somente** por `workflow_dispatch`.
      Um commit em `main` não dispara mais deploy nem Terraform.
- [x] Documentação corrigida (Vercel/Netlify inexistentes removidos).

Verificar que pegou:

```bash
grep -A2 '^on:' .github/workflows/deploy.yml    # deve mostrar só workflow_dispatch
```

### Fase 1 — Desconectar a integração Git do Cloudflare Pages ⚠️ **passo crítico**

**Isto é o que a Fase 0 NÃO resolve.** O `iac/pages.tf` descreve um projeto Pages com
`source.type = "github"`. Se essa integração estiver ativa no painel, **a própria Cloudflare
compila e publica a partir de `main`**, ignorando os workflows do GitHub. Desligar o Actions
não impede esse deploy.

1. Painel Cloudflare → **Workers & Pages** → projeto `skelica`
2. **Settings → Builds & deployments**
3. Em *Git integration*: **Disconnect** / desabilitar builds automáticos
4. Confirmar que "Build configuration" não está mais ligada ao repositório

> Se a integração não estiver conectada, ótimo — significa que o deploy sempre veio do
> `wrangler` no GitHub Actions, e a Fase 0 já bastou.

### Fase 2 — Escolher A ou B

**Opção A (congelar):** nada a fazer. Fase 1 concluída = congelado.

**Opção B (desligar):**

1. Painel Cloudflare → **Workers & Pages** → `skelica`
2. **Settings** (rodapé) → **Delete project**
3. Confirmar digitando o nome do projeto
4. (Opcional) Em **Account Home → Workers & Pages**, conferir que não sobrou nenhum
   `skelica-preview` ou deployment avulso

Verificar que morreu:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://skelica.pages.dev
# Opção A: 200    Opção B: 404 / falha de DNS
```

### Fase 3 — Revogar credenciais

Ver checklist completo em §5.

### Fase 4 — Arrumar o repositório (opcional, quando quiser)

- [ ] `iac/` — decidir entre **apagar** a pasta ou deixar com o aviso de §4.1.
      Como o estado está vazio, a pasta não gerencia nada hoje.
- [ ] `docs/migration/complete.md`, `docs/design/`, `docs/frontend/quick-launch/` —
      documentação de um produto que não está mais em desenvolvimento. Candidata a arquivo
      morto; mantida apenas porque é o registro de por que as decisões foram tomadas.

---

## 4. Armadilhas (leia antes de mexer)

### 4.1 O Terraform está vazio e **não** descomissiona nada

```
iac/terraform.tfstate → 0 bytes
iac/.terraform/       → não existe (só o .terraform.lock.hcl)
```

Consequências práticas:

| Comando | O que acontece |
|---------|----------------|
| `terraform destroy` | **Não remove o projeto real.** Com estado vazio, o Terraform não sabe que ele existe. Reporta "nada a destruir". |
| `terraform apply` | Vai tentar **criar** um projeto `skelica`. Se já existe, **falha** com erro de recurso já existente — ou pior, cria duplicado se o nome tiver mudado. |

**Não use o Terraform para descomissionar.** Use o painel (§3). Se um dia quiser reativar o IaC,
o caminho é `terraform import cloudflare_pages_project.main <account_id>/skelica` — não `apply`.

### 4.2 O secret `ANTHROPIC_API_KEY` está no smoke job

`deploy.yml` → job `smoke` injeta `ANTHROPIC_API_KEY` no ambiente de um teste que roda
navegador headless (`agent-browser`) contra o site em produção. Esse secret **não deveria
existir** para um app estático que roda 100% no cliente, e é a credencial de maior risco vivo hoje.

**Revogar é obrigatório**, mesmo na Opção A (congelar).

### 4.3 Revogar o token do Cloudflare não afeta o site

O `CLOUDFLARE_API_TOKEN` só serve para *publicar*. Revogá-lo deixa o site no ar normalmente —
só impede novos deploys, que é exatamente o objetivo. Não há risco de "derrubar o site" ao revogar.

---

## 5. Checklist de revogação de credenciais

Ordem importa: revogar no provedor **primeiro**, apagar do GitHub **depois** (assim nenhum
workflow roda no meio do caminho com a credencial já inválida — irrelevante aqui, mas é a ordem certa).

- [ ] **Cloudflare API token** — painel → *My Profile → API Tokens* → revogar o token com
      permissão **Pages:Edit** usado por `CLOUDFLARE_API_TOKEN`.
      Confirmar em *Workers & Pages* que nenhum token "Skelica" segue listado.
- [ ] **Anthropic API key** — console → *API Keys* → revogar a chave exposta ao smoke job.
      ⚠️ **Prioridade máxima** (§4.2).
- [ ] **OpenAI API key** — se alguma foi criada para os testes do `llm/`, revogar também.
- [ ] **GitHub secrets** — repo → *Settings → Secrets and variables → Actions* → apagar
      `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY`.
- [ ] **Variáveis do Terraform** — se algum dia foram passadas por `TF_VAR_*` em CI ou num
      `terraform.tfvars` local, apagar.
- [ ] **Verificação final:** `git log --all -p | grep -iE "sk-ant|sk-[a-zA-Z0-9]{20,}"` não deve
      retornar nenhuma chave real. (Chaves nunca devem ter entrado no git — confirme.)

---

## 6. O que quebra e o que não quebra

| Ação | O site continua no ar? | Deploy volta com? |
|------|------------------------|-------------------|
| Fase 0 (workflows manuais) | ✅ sim | `workflow_dispatch` manual |
| Fase 1 (desconectar Git do Pages) | ✅ sim | reconectar a integração no painel |
| Revogar token do Cloudflare | ✅ sim | novo token + novo secret |
| Opção B (apagar o projeto) | ❌ **não** | recriar o projeto e reimplantar |

**Rollback completo** (se mudar de ideia depois da Opção B):

```bash
cd frontend && npm ci && npm run build
npx wrangler pages project create skelica --production-branch=main
npx wrangler pages deploy dist --project-name=skelica
```

Isso recria o projeto e publica. O URL volta a ser `skelica.pages.dev` (o subdomínio derivado
do nome), sujeito a disponibilidade do nome.

---

## 7. Registro

| Data | Ação | Quem |
|------|------|------|
| 2026-09-12 | Projeto estacionado; deploys automáticos congelados no repo; documentação corrigida | sessão de encerramento |
| _pendente_ | Fase 1 — desconectar integração Git do Pages | — |
| _pendente_ | Fase 2 — escolher Opção A ou B | — |
| _pendente_ | Fase 3 — revogar credenciais (§5) | — |
