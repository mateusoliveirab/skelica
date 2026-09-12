# ADR-0004: Remover recurso Terraform duplicado/obsoleto (`iac/main.tf`)

## Status

Accepted — arquivo removido nesta sessão. **Nenhum comando `terraform` foi executado** (nem `plan`,
nem `apply`) — essa ADR só corrige os arquivos `.tf` versionados; validar contra o state real antes do
próximo `terraform apply` é responsabilidade do usuário/CI, não deste agente.

## Contexto

`iac/main.tf` e `iac/pages.tf` declaram **o mesmo recurso lógico** (o projeto Cloudflare Pages
"skelica"), com dois endereços Terraform diferentes:

- `iac/main.tf` → `resource "cloudflare_pages_project" "skelica" { ... }`, usando sintaxe de **bloco**
  (`build_config { }`, `source { }`, `config { }`, `deployment_configs { production { ... } } }`).
- `iac/pages.tf` → `resource "cloudflare_pages_project" "main" { ... }`, usando sintaxe de
  **atributo/objeto** (`build_config = { ... }`, `source = { ... }`).

Evidências de que `main.tf` é o resíduo morto, não `pages.tf`:

1. `iac/outputs.tf` referencia `cloudflare_pages_project.main.subdomain` — ou seja, o único output do
   módulo depende do recurso de `pages.tf`, não do de `main.tf`.
2. `iac/providers.tf` fixa `cloudflare = "~> 5.0"`. O provider Cloudflare v5 migrou blocos aninhados
   (`build_config`, `source`, `deployment_configs`) de sintaxe de bloco para sintaxe de atributo como
   parte da migração para o plugin framework — a sintaxe usada em `main.tf` é da geração anterior do
   provider e não é aceita por `~> 5.0`. Rodar `terraform init/plan` com os dois arquivos presentes
   tende a falhar já na validação de `main.tf`, e mesmo que passasse, criaria dois projetos Cloudflare
   Pages de mesmo nome (`"skelica"`), o que a API da Cloudflare rejeita.
3. `git log --follow` mostra os dois arquivos entrando no mesmo commit
   (`12a4d0a feat: initial standalone repo extracted from workbench`) — resíduo da extração do
   monorepo `workbench`, não uma evolução intencional em paralelo.
4. Ambos apontavam `repo_name = "workbench"` / `root_dir = "skelica/frontend"` — path do monorepo
   antigo. Como este já é o repo standalone, isso também está desatualizado (corrigido junto).

## Decisão

Remover `iac/main.tf` inteiro (recurso não referenciado, sintaticamente incompatível com o provider
pinado) e corrigir em `iac/pages.tf`/`iac/outputs.tf` a referência de monorepo (`repo_name`, `root_dir`)
para o layout atual do repo standalone.

## Alternativas consideradas

- **Rodar `terraform plan` para decidir:** exigiria credenciais Cloudflare (`CLOUDFLARE_API_TOKEN`) não
  disponíveis neste ambiente, e mesmo com elas, rodar contra infraestrutura real é uma ação de efeito
  externo — fica fora do que este agente executa sem confirmação explícita, mesmo que fosse só
  leitura (plan pode exigir refresh de state remoto). Deixado como próximo passo manual.
- **Manter os dois arquivos "por segurança":** rejeitado — a duplicata é a própria causa de risco
  (nome de recurso colidindo na Cloudflare); mantê-la não protege nada, só adia a descoberta do erro
  para a hora de rodar `apply`.

## Consequências

- Arquivo `.tf` a menos, sem recurso perdido: nada em `outputs.tf` ou em outro `.tf` referenciava
  `cloudflare_pages_project.skelica` (o endereço de `main.tf`).
- `repo_name`/`root_dir` corrigidos para refletir o repo standalone atual.
- **Ação pendente do usuário:** antes do próximo `terraform apply` real, rodar `terraform plan` com as
  credenciais corretas para confirmar que não há drift — este agente não tem acesso a essas
  credenciais e não executa `apply`/`plan` sem confirmação explícita, por ser ação de efeito externo
  sobre infraestrutura compartilhada.
- **Achado adicional durante a verificação (não corrigido, fora do escopo desta ADR):**
  `iac/.terraform.lock.hcl` tem `cloudflare` pinado em `4.52.5` — não `~> 5.0` como `providers.tf`
  exige — e também trava um provider `integrations/github` em `6.11.1` que **nenhum `.tf` atual
  declara** (`pages.tf` só usa `source.type = "github"` como string dentro do recurso Cloudflare, não
  é um provider Terraform). O lock file está desatualizado em relação à configuração atual, sinal de
  que este diretório `iac/` não é reinicializado (`terraform init -upgrade`) há tempo. Corrigir isso
  exige rodar `terraform init` contra o registry real, o que não fiz por não ter credenciais/rede
  neste ambiente e por ser uma ação com efeito fora do repo local. Fica registrado para o usuário
  rodar manualmente.
