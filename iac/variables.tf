variable "cloudflare_api_token" {
  description = "API Token da Cloudflare com permissões para Pages"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Account ID da Cloudflare (encontrado na dashboard)"
  type        = string
}

variable "github_owner" {
  description = "Username ou organização do GitHub que possui o repositório"
  type        = string
}
