# PROJECT_MEMORY.md

## Project

- Name: AiMA VPN / «Свободный интернет»
- Repository: `aima666qs-commits/VPN`
- Goal: commercial multi-node VPN subscription platform with web, Telegram Bot/Mini App and future native clients.

## Verified state

- Repository is accessible.
- Master execution prompt exists at `docs/MASTER_EXECUTION_PROMPT_RU.md`.
- README, agent instructions and deployment template are initialized.
- Production deployment has not yet been verified.
- Vercel project discovery has not been verified.
- Required deployment values are expected in a local `deploy.env` file and must not be committed.

## Chosen architecture

- Remnawave control engine and Node components.
- Custom NestJS business API.
- Next.js web and Telegram Mini App on Vercel.
- PostgreSQL, Redis, monitoring and backups on Ubuntu.
- Two active data-plane nodes.
- Xray-core primary; Hysteria 2 and AmneziaWG optional fallbacks after compatibility testing.
- GitHub Actions and GHCR for CI/CD.
- Hugging Face optional for anonymized aggregate analytics only.

## Constraints

- Do not claim 100 percent availability.
- Do not claim deployment success without evidence.
- Do not store secrets in Git.
- Telegram Mini App manages subscriptions but does not create a system VPN tunnel.

## Next step

Locate or import the actual existing local code. Then generate the monorepo, installers, tests and deployment workflow described in the master prompt. Actual deployment proceeds only after the deployment environment file is complete.
