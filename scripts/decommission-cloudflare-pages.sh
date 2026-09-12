#!/usr/bin/env bash
#
# Descomissionamento do Cloudflare Pages do Skelica.
#
# Plano completo, inventario e checklist de revogacao: docs/project/decommission-infra.md
#
# USO
#   export CLOUDFLARE_API_TOKEN=...     # token com permissao Pages:Edit
#   export CLOUDFLARE_ACCOUNT_ID=...
#
#   bash scripts/decommission-cloudflare-pages.sh            # inspecao (padrao, nao destrutivo)
#   bash scripts/decommission-cloudflare-pages.sh --delete   # apaga o projeto (pede confirmacao)
#
# POR QUE NAO USAR O TERRAFORM
#   iac/terraform.tfstate esta VAZIO. `terraform destroy` nao remove o projeto real (o state nao
#   sabe que ele existe) e `terraform apply` tentaria criar um duplicado.

set -euo pipefail

PROJECT="${PAGES_PROJECT:-skelica}"
API="https://api.cloudflare.com/client/v4"

: "${CLOUDFLARE_ACCOUNT_ID:?defina CLOUDFLARE_ACCOUNT_ID}"
: "${CLOUDFLARE_API_TOKEN:?defina CLOUDFLARE_API_TOKEN (permissao Pages:Edit)}"

DO_DELETE=0
[[ "${1:-}" == "--delete" ]] && DO_DELETE=1

api() { # metodo, caminho
  curl -sS -X "$1" "$API$2" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json"
}

echo "Conta:   $CLOUDFLARE_ACCOUNT_ID"
echo "Projeto: $PROJECT"
echo

echo "== 1. O projeto existe? =="
RESPONSE_FILE="$(mktemp)"
trap 'rm -f "$RESPONSE_FILE"' EXIT
api GET "/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT" > "$RESPONSE_FILE"

if ! python3 -c 'import json,sys; sys.exit(0 if json.load(open(sys.argv[1])).get("success") else 1)' "$RESPONSE_FILE" 2>/dev/null; then
  echo "   Nao encontrado, ou o token nao tem acesso. Resposta da API:"
  python3 - "$RESPONSE_FILE" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
for err in data.get("errors", []):
    print("   -", err.get("message"))
PY
  echo
  echo "Nada a descomissionar com esse nome. Se o site ainda responde, o projeto tem outro nome:"
  echo "   PAGES_PROJECT=<nome> bash $0"
  exit 0
fi

echo "   encontrado"
echo

echo "== 2. Integracao Git conectada? (a fase critica do plano) =="
python3 - "$RESPONSE_FILE" <<'PY'
import json, sys
project = json.load(open(sys.argv[1]))["result"]
source = project.get("source") or {}
source_type = source.get("type")
config = source.get("config") or {}

if source_type:
    print("   AVISO: source.type = %r" % source_type)
    print("   -> a Cloudflare COMPILA por conta propria a partir do repositorio.")
    print("      repo: %s/%s  branch: %s" % (
        config.get("owner"), config.get("repo_name"), config.get("production_branch")))
    print("      Congelar o GitHub Actions NAO impede esse deploy.")
    print("      Acao: painel Cloudflare -> Workers & Pages -> projeto -> Settings")
    print("            -> Builds & deployments -> desconectar a integracao Git.")
else:
    print("   OK: sem integracao Git (source.type vazio).")
    print("   Os deploys vinham so do GitHub Actions, que ja esta congelado")
    print("   (workflow_dispatch). A fase critica esta satisfeita.")

print()
print("   subdominio: https://%s" % project.get("subdomain"))
print("   criado em:  %s" % project.get("created_on"))
domains = project.get("domains") or []
if domains:
    print("   dominios:   %s" % ", ".join(domains))
PY

echo
if [[ "$DO_DELETE" == "0" ]]; then
  cat <<EOF
== 3. Apagar? ==
   Isto NAO foi executado. Voce esta na Opcao A (congelar): o site segue no ar, custo R\$ 0,
   e o URL continua vivo para portfolio.

   Para apagar de verdade (Opcao B — o URL morre):

      bash $0 --delete

   As duas opcoes custam R\$ 0. Apagar so compensa para zerar a superficie.
   Rollback: docs/project/decommission-infra.md secao 6.
EOF
  exit 0
fi

echo "== 3. Apagando o projeto '$PROJECT' =="
read -r -p "   Digite o nome do projeto para confirmar: " CONFIRM
if [[ "$CONFIRM" != "$PROJECT" ]]; then
  echo "   nao confere — abortado, nada foi apagado"
  exit 1
fi

api DELETE "/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT" > "$RESPONSE_FILE"
python3 - "$RESPONSE_FILE" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
if data.get("success"):
    print("   apagado")
else:
    print("   falhou:", data.get("errors"))
PY

echo
echo "== 4. Falta ainda (ver docs/project/decommission-infra.md secao 5) =="
echo "   [ ] revogar o token da Cloudflare"
echo "   [ ] revogar a chave ANTHROPIC_API_KEY  <- prioridade maxima, exposta ao smoke job"
echo "   [ ] apagar os secrets do GitHub: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, ANTHROPIC_API_KEY"
