output "pages_url" {
  description = "URL do projeto no Cloudflare Pages"
  value       = "https://${cloudflare_pages_project.main.subdomain}"
}
