# AiMA VPN coding instructions

Read `AGENTS.md` and `docs/MASTER_EXECUTION_PROMPT_RU.md` before changing code.

Preserve existing functionality, create backups before migrations, and never report success without running the documented checks. Keep frontend, business API, node management, data stores and deployment automation as separate modules. Store configuration in validated environment variables and never commit sensitive values.

Vercel hosts only the Next.js web layer. Long-running network services, databases and node processes run on Ubuntu servers. Hugging Face is optional analytics and must not become a core dependency.

Every change must include a test or a concrete verification command. Update `PROJECT_MEMORY.md` and `reports/FINAL_REPORT.md` with factual status only.
