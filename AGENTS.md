# AGENTS.md

## Mission

Довести AiMA VPN от текущего состояния до проверенного multi-node production deployment без выдуманных статусов.

## Execution order

1. Найти и сохранить существующий код.
2. Выполнить аудит и создать backup branch/tag.
3. Прочитать `docs/MASTER_EXECUTION_PROMPT_RU.md`.
4. Реализовать MVP control plane, business API, web и bot.
5. Создать идемпотентные PowerShell/Bash installers.
6. Развернуть два узла только при наличии IP/SSH в `deploy.env`.
7. Выполнить проверки, failover test и backup/restore test.
8. Обновить `PROJECT_MEMORY.md` и итоговые отчёты.

## Non-negotiable rules

- Не выдумывать успешный запуск.
- Не коммитить секреты.
- Не удалять существующие данные без backup.
- Не оставлять mock/TODO в пользовательском потоке.
- Vercel используется только для web/frontend.
- Hugging Face не является обязательной runtime-зависимостью.
- Telegram Mini App не является системным VPN-клиентом.
- Любое `OK` подтверждается командой или тестом.

## Required final artifacts

- `scripts/INSTALL_WINDOWS.ps1`
- `scripts/INSTALL_UBUNTU.sh`
- `scripts/CHECK_ALL.ps1`
- `scripts/CHECK_ALL.sh`
- `reports/FINAL_REPORT.md`
- `reports/health.json`
- `docs/architecture/architecture.mmd`
- `docs/architecture/architecture.json`
