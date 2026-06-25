# Cloudflare Pages project for Skelica frontend
resource "cloudflare_pages_project" "skelica" {
  account_id        = var.cloudflare_account_id
  name              = "skelica"
  production_branch = "main"

  build_config {
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = "skelica/frontend"
    build_caching   = true
  }

  source {
    type = "github"

    config {
      owner                          = var.github_owner
      repo_name                      = "workbench"
      production_branch              = "main"
      pr_comments_enabled            = true
      production_deployment_enabled = true
      preview_deployment_setting     = "custom"
    }
  }

  deployment_configs {
    production {
      environment_variables = {}
    }
    preview {
      environment_variables = {}
    }
  }
}