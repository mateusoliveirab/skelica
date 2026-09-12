# Descomissionamento da infraestrutura

**Data:** 2026-09-12
**Contexto:** [`decision-parked.md`](./decision-parked.md) — o projeto foi estacionado.
**Objetivo:** encerrar (ou congelar) a infraestrutura que roda hoje, sem quebrar o que ainda serve e sem deixar credenciais vivas.

---

## 1. Inventário: o que está rodando hoje

| # | Recurso | Onde | Estado | Custo | Reversível? |
|---|---------|------|--------|-------|-------------|
| 1 | ~~Cloudflare Pages `skelica`~~ | ~~`https://skelica.pages.dev`~~ | ❌ **APAGADO em 2026-09-12** — HTTP 530 | R$ 0 | ✅ recriável (rollback §6) |
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

### ⚠️ DECISÃO TOMADA: Opção B (apagar) — **executada em 2026-09-12**

As opções abaixo ficam como registro. A escolhida foi a **B**, e a execução está em §8.

### Opção A — Congelar (preservaria o URL)

O site continuaria servindo, ninguém conseguiria reimplantar, e o URL seguiria vivo para
portfólio. **Não foi o caminho escolhido.**

- **Custo:** R$ 0/mês
- **Trabalho:** ~10 min (já feito no repo + desconectar a integração Git no painel)
- **O que se perde:** nada funcional
- **Quando escolher:** você quer o link vivo, ou não tem certeza ainda

### Opção B — Desligar de verdade ✅ ESCOLHIDA E EXECUTADA

Apaga o projeto do Cloudflare Pages. O URL deixou de responder (HTTP 530).

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

### Fase 0.1 — Script de apoio (escrito nesta sessão)

Como o ambiente local **não tem token da Cloudflare** (só `CLOUDFLARE_ACCOUNT_ID`, sem
`CLOUDFLARE_API_TOKEN`) nem `wrangler` autenticado, não foi possível executar as fases abaixo
daqui. Foi escrito um script para você rodar quando tiver o token:

```bash
export CLOUDFLARE_API_TOKEN=...      # permissão Pages:Edit
export CLOUDFLARE_ACCOUNT_ID=...

bash scripts/decommission-cloudflare-pages.sh            # inspeção — não destrutivo
bash scripts/decommission-cloudflare-pages.sh --delete   # apaga (pede confirmação)
```

A inspeção responde a pergunta da Fase 1 diretamente: mostra `source.type` do projeto. Se vier
`github`, a integração está ligada e o Actions congelado **não** basta. Se vier vazio, a Fase 1
já está satisfeita.

> **Pista coletada:** o push do commit de encerramento **não** alterou o bundle em produção
> (`index-BEaUjKz_.js` antes e depois). Isso sugere que não há integração Git ativa — se
> houvesse, a Cloudflare teria compilado `main`. Não é prova (builds podem atrasar), então
> confirme com o script ou no painel.

### ⚠️ DESCOBERTA (inspeção real, 2026-09-12): a integração aponta para OUTRO repositório

A inspeção foi executada com um token válido e revelou que o projeto Pages **não** observa este
repositório:

| Campo | Valor |
|-------|-------|
| `source.type` | `github` — **integração ativa** |
| `source.config.repo_name` | **`workbench`** (não `skelica`) |
| `source.config.production_branch` | `main` |
| `build_config.root_dir` | **`skelica/frontend`** |
| `deployments_enabled` | `true` |
| Últimos 6 deploys | todos `tipo=github`, o mais recente em **2026-09-10** |

Consequências que mudam o plano:

1. **Este repositório não publica o site.** Commits em `skelica` não geram deploy — foi por isso
   que o bundle em produção não mudou depois do push de encerramento. A inferência anterior
   ("provavelmente não há integração Git") estava **errada**: a integração existe, mas observa
   outro repositório.
2. **Pushes em `workbench@main`, sob `skelica/frontend`, publicam o site em produção** —
   contornando integralmente este repositório (os workflows congelados, os testes, o dataset).
3. Portanto **congelar os workflows daqui foi inócuo para essa rota de deploy**. A Fase 1 não é
   opcional: é o único controle que fecha essa porta.
4. O `workbench` também contém `.github/workflows/terraform-destroy.yml` e `statusline-iac.yml`,
   que usam `CLOUDFLARE_API_TOKEN` com `terraform apply -auto-approve` e `destroy`. Ou seja, o
   Terraform que de fato mexe em infraestrutura provavelmente vive lá — coerente com o
   `terraform.tfstate` vazio deste repositório.

**Decisão necessária (só o dono sabe):** a ligação é **obsoleta** (o `skelica` foi extraído do
`workbench` e o projeto nunca foi re-apontado) ou **intencional** (o `workbench` continua sendo a
fonte de build)? Se obsoleta, desconectar. Se intencional, re-apontar para `mateusoliveirab/skelica`
— e então sim os workflows deste repositório passam a valer.

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

```bash
bash scripts/decommission-cloudflare-pages.sh --delete
```

ou pelo painel:

1. Painel Cloudflare → **Workers & Pages** → `skelica`
2. **Settings** (rodapé) → **Delete project**
3. Confirmar digitando o nome do projeto
4. (Opcional) Em **Account Home → Workers & Pages**, conferir que não sobrou nenhum
   `skelica-preview` ou deployment avulso

Verificar que morreu:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://skelica.pages.dev
# Opção A: 200    Opção B: 530 (verificado após a execução)
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
| 2026-09-12 | Inspeção real: a integração Git apontava para `workbench`, não para `skelica` | sessão de encerramento |
| 2026-09-12 | Verificado que nenhum Terraform/workflow gerencia o projeto → apagar é seguro | sessão de encerramento |
| 2026-09-12 | **157 deployments purgados** e **projeto apagado** (Opção B) | sessão de encerramento |
| _pendente_ | Revogar credenciais (§5) — **inclui a `ANTHROPIC_API_KEY`** | — |

---

## 8. Registro de execução (2026-09-12)

Executado com um token `CLOUDFLARE_PAGES_TOKEN` válido (o `CLOUDFLARE_API_TOKEN` do `.zshrc` é
válido mas não tem acesso a nenhuma conta — está escopado para AI Gateway).

### O que a inspeção revelou

| Campo | Valor real |
|-------|-----------|
| `source.type` | `github` — **a integração estava ativa** |
| `source.config.repo_name` | **`workbench`** — não `skelica` |
| `build_config.root_dir` | `skelica/frontend` |
| Deploys existentes | **158** |
| Mais recente | 2026-09-10 |

Ou seja: **este repositório não publicava o site.** O `workbench` publicava, a partir de
`skelica/frontend` — caminho que já não existe lá (o commit `2bfaf79` extraiu o skelica para o
repositório standalone). A integração estava obsoleta **e quebrada**.

### Verificação de segurança antes de apagar

| Verificação | Resultado |
|---|---|
| Terraform do skelica no `workbench` | ❌ não existe mais |
| Workflows de deploy do skelica no `workbench` | ❌ removidos |
| `terraform.tfstate` do skelica | ❌ nenhum |
| `cloudflare_pages_project` no `workbench` | só de outros produtos (3dseeit, hatch, breathing-timer, 3d-bussines) |

**Conclusão: nada poderia recriar o projeto.** Apagar era seguro.

### A execução

1. `DELETE /pages/projects/skelica` → **recusado**: *"Your project has too many deployments to be
   deleted"* (código 8000076).
2. Purga dos deployments: **157 apagados**. O 158º é o *deployment de produção ativo*, que a API
   protege explicitamente (*"You cannot delete the active production deployment"*). Ele não precisa
   ser removido — a exclusão do projeto o leva junto.
3. `DELETE /pages/projects/skelica` → **APAGADO**.
4. Verificação: `skelica.pages.dev` → **HTTP 530**; o projeto sumiu da lista da conta
   (restam `fourseveneight`, `hatch`, `kairoslist`, `keryx`, `portfolio-blog`).

> **Lição operacional:** excluir um projeto Pages com muitos deployments exige purgar os
> deployments antes. A API não faz isso sozinha, e o erro não é óbvio.

### Pendente

- [ ] Revogar as credenciais (§5) — **`ANTHROPIC_API_KEY` é prioridade máxima**
