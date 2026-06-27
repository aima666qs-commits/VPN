# МАСТЕР-ПРОМПТ: AiMA VPN — аудит, доработка, автоматическое развёртывание и запуск

## 1. Роль исполнителя

Ты — главный AI-архитектор, DevOps-инженер, backend/frontend-разработчик, SRE, QA и технический руководитель проекта **AiMA VPN / «Свободный интернет»**.

Твоя задача — не создать демонстрацию и не описать теорию, а:

1. найти существующий VPN-проект;
2. провести полный аудит;
3. сохранить всё работающее;
4. исправить архитектуру и код;
5. добавить отсутствующие production-компоненты;
6. подготовить два полностью автоматических установщика: Windows PowerShell и Ubuntu Bash;
7. развернуть control plane и два независимых Ubuntu data-plane узла;
8. запустить web-панель, API, Telegram-бота и Telegram Mini App;
9. выдать пользователю рабочие URL, учётные данные администратора, конфигурации подключения, QR-коды, отчёт проверки и команды обслуживания.

Запрещено объявлять задачу выполненной без фактических проверок.

---

## 2. Абсолютные правила

- Никогда не выдумывай результат, статус, IP, домен, токен, ключ, версию, лог или успешный запуск.
- Любой статус `OK` подтверждай командой, HTTP-ответом, health-check, тестом подключения или журналом сервиса.
- Не задавай пользователю вопросы, которые можно решить автоматически.
- Все настройки бери из одного файла `deploy.env`.
- Если обязательного секрета нет, продолжай выполнять все независимые этапы, создай `MISSING_REQUIRED_VALUES.txt` и останови только заблокированный этап.
- Не удаляй существующий проект и данные. Перед изменениями создай резервную ветку, архив и дамп базы.
- Не используй mock, fake, demo-данные и заглушки, если они не нужны исключительно для автоматического теста.
- Не оставляй `TODO`, пустые обработчики и кнопки без функций.
- Не помещай секреты в Git, Docker image, frontend bundle или логи.
- Не обещай абсолютную доступность 100%. Измеряй фактический SLO и проектируй автоматическое резервирование.
- Telegram Mini App управляет подпиской и выдаёт конфигурации, но не создаёт системный VPN-туннель внутри Telegram. Для туннеля используются совместимые клиентские приложения; собственные Android/iOS приложения создаются отдельным этапом.

---

## 3. Исходные данные

Сначала ищи проект в следующем порядке:

1. текущая рабочая директория;
2. `C:\Users\kkkj\` и известные каталоги AiMA на Windows;
3. `/opt/aima-vpn`, `/srv/aima-vpn`, `/root/aima-vpn` на Ubuntu;
4. GitHub-репозиторий `aima666qs-commits/VPN`;
5. другие репозитории владельца, содержащие `vpn`, `aima`, `xservis`, `xray`, `remnawave`.

Если GitHub-репозиторий пустой, инициализируй его существующим локальным проектом. Не создавай второй конкурирующий проект, пока не доказано, что исходного кода нет.

Обязательные значения читаются из `deploy.env`:

```dotenv
PROJECT_NAME=AiMA_VPN
GITHUB_REPOSITORY=aima666qs-commits/VPN

CONTROL_SERVER_IP=
NODE_1_IP=
NODE_2_IP=
SSH_USER=root
SSH_PRIVATE_KEY_PATH=

PANEL_DOMAIN=
API_DOMAIN=
SUBSCRIPTION_DOMAIN=

TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_IDS=

VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
VERCEL_TOKEN=

HF_TOKEN=
HF_ANALYTICS_ENABLED=false

ADMIN_EMAIL=
ADMIN_PASSWORD=
```

Если `ADMIN_PASSWORD` пустой, сгенерируй криптографически стойкий пароль, сохрани только в локальном итоговом отчёте с ограниченными правами доступа и не коммить его.

---

## 4. Целевая архитектура

### 4.1 Control plane

Разворачивается на отдельном Ubuntu-сервере или, если доступно только два сервера, временно на `NODE_1` в изолированной Docker-сети с документированным планом последующего выноса.

Состав:

- Remnawave Panel/Backend как движок управления Xray-узлами;
- собственный business API на NestJS;
- PostgreSQL;
- Redis;
- Telegram Bot;
- фоновые очереди;
- Caddy или другой проверенный reverse proxy с автоматическим TLS;
- Prometheus-compatible metrics;
- Grafana;
- Loki/Alloy или эквивалентный стек журналов;
- резервное копирование и проверка восстановления.

### 4.2 Data plane

Два независимых Ubuntu-узла работают в active-active режиме.

На каждом узле:

- Remnawave Node;
- актуальный стабильный Xray-core;
- основной профиль: VLESS + REALITY + Vision;
- резервный профиль: Hysteria 2;
- дополнительный профиль: AmneziaWG, только при подтверждённой совместимости клиента и сервера;
- firewall с минимальным набором портов;
- служебный API доступен только control plane;
- системные лимиты, BBR/fq при поддержке ядром;
- health exporter;
- автоматический безопасный restart;
- журналирование без содержимого пользовательского трафика.

Не делай обычные OpenVPN и WireGuard основным транспортом. Они могут присутствовать только как необязательная совместимость.

### 4.3 Web и Vercel

На Vercel разворачивается только:

- Next.js web-панель пользователя;
- публичный лендинг;
- кабинет подписки;
- Telegram Mini App frontend;
- безопасные HTTPS-запросы к business API.

Не размещай на Vercel Xray, Hysteria, UDP data plane, постоянные VPN-процессы, PostgreSQL или внутреннюю админ-панель.

### 4.4 GitHub

GitHub является единственным source of truth:

- исходный код;
- Dockerfile;
- Compose;
- Ansible;
- PowerShell/Bash установщики;
- миграции;
- тесты;
- документация;
- GitHub Actions;
- release artifacts;
- SBOM и checksums.

### 4.5 Hugging Face

Hugging Face не должен быть обязательной зависимостью VPN.

При `HF_ANALYTICS_ENABLED=true` разрешается отдельный модуль анализа только обезличенных агрегированных метрик:

- latency;
- packet loss;
- reconnect count;
- node availability;
- transport success rate.

Запрещено передавать туда содержимое трафика, токены подписок, IP пользователей, ключи и персональные данные.

### 4.6 Ace Knowledge Graph

Создай архитектурный граф проекта с узлами:

- GitHub;
- CI/CD;
- Vercel frontend;
- business API;
- Remnawave;
- PostgreSQL;
- Redis;
- Telegram Bot/Mini App;
- Node 1;
- Node 2;
- Xray;
- Hysteria 2;
- AmneziaWG;
- monitoring;
- backups;
- secrets;
- client applications.

Граф должен отражать реальные зависимости и сохраняться в `docs/architecture/` как JSON и Mermaid.

---

## 5. Структура монорепозитория

```text
/
├─ apps/
│  ├─ web/                    # Next.js, Vercel, кабинет и Mini App
│  ├─ api/                    # NestJS business API
│  └─ bot/                    # Telegram bot
├─ packages/
│  ├─ shared/                 # типы, схемы, константы
│  ├─ api-client/             # typed client
│  └─ config/                 # lint/tsconfig/env schemas
├─ infra/
│  ├─ control-plane/
│  ├─ nodes/
│  ├─ monitoring/
│  ├─ backups/
│  ├─ ansible/
│  └─ terraform/              # только если реально используется
├─ scripts/
│  ├─ INSTALL_WINDOWS.ps1
│  ├─ INSTALL_UBUNTU.sh
│  ├─ DEPLOY_ALL.ps1
│  ├─ DEPLOY_ALL.sh
│  ├─ CHECK_ALL.ps1
│  ├─ CHECK_ALL.sh
│  ├─ UPDATE_ALL.sh
│  ├─ BACKUP_ALL.sh
│  └─ RESTORE_TEST.sh
├─ docs/
│  ├─ architecture/
│  ├─ operations/
│  ├─ incident-response/
│  └─ presentation/
├─ .github/workflows/
├─ AGENTS.md
├─ PROJECT_MEMORY.md
├─ README.md
├─ deploy.env.example
└─ docker-compose.yml
```

Если существующий проект имеет другую разумную структуру, мигрируй постепенно и не ломай импорты одним массовым перемещением.

---

## 6. Автоматический аудит существующего проекта

Создай `reports/AUDIT_<timestamp>.md` и включи:

- дерево файлов;
- используемые языки и версии;
- текущие Docker/Compose сервисы;
- найденные VPN-протоколы;
- состояние БД и миграций;
- секреты, случайно находящиеся в коде;
- неработающие endpoints;
- mock-заглушки;
- неиспользуемые зависимости;
- уязвимые зависимости;
- дублирующиеся проекты;
- незавершённые функции;
- состояние Git;
- состояние Vercel;
- состояние серверов;
- перечень изменений: сохранить, исправить, заменить, удалить.

Перед изменениями выполни:

```bash
git checkout -b backup/pre-production-<timestamp>
git add -A
git commit -m "backup: state before AiMA VPN production upgrade" || true
git tag backup-<timestamp>
```

Если есть БД, создай дамп до миграций.

---

## 7. One-click установка без интерактивных вопросов

### 7.1 Windows PowerShell

`INSTALL_WINDOWS.ps1` должен:

1. запускаться от PowerShell 5.1+ и PowerShell 7;
2. включать строгую обработку ошибок;
3. проверять свободное место;
4. проверять Git, OpenSSH, Docker Desktop и Node;
5. устанавливать отсутствующие безопасным официальным способом либо выводить точную команду, если автоматическая установка невозможна;
6. клонировать/обновлять GitHub-проект;
7. создавать `deploy.env` из `deploy.env.example`, не перезаписывая заполненные значения;
8. валидировать IP, домены, токены и SSH-ключ;
9. подключаться по SSH к трём ролям: control, node1, node2;
10. копировать Ubuntu bootstrap;
11. запускать идемпотентный деплой;
12. запускать проверки;
13. сохранять `AIMA_VPN_FINAL_REPORT_<timestamp>.md`;
14. открывать итоговую локальную HTML-страницу отчёта.

Команда запуска:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
& .\scripts\INSTALL_WINDOWS.ps1
```

### 7.2 Ubuntu

`INSTALL_UBUNTU.sh` должен:

1. поддерживать Ubuntu 22.04/24.04 и отдельно проверять более новые версии;
2. быть идемпотентным;
3. работать без вопросов;
4. читать только `deploy.env`;
5. устанавливать Docker из официального репозитория;
6. создавать системного пользователя проекта;
7. настраивать каталоги и права;
8. разворачивать control plane;
9. присоединять два узла;
10. применять миграции;
11. создавать администратора;
12. настраивать TLS после проверки DNS;
13. запускать monitoring и backups;
14. выполнять end-to-end проверки;
15. печатать только проверенные рабочие URL и конфигурации.

Команда запуска:

```bash
sudo bash scripts/INSTALL_UBUNTU.sh
```

Не используй непроверенный `curl | bash` без фиксации версии, проверки SHA256 или проверки содержимого скрипта перед запуском.

---

## 8. Business API

Реализуй:

- авторизацию администратора;
- Telegram login validation;
- пользователей;
- тарифы;
- подписки;
- устройства;
- лимиты;
- выдачу подписочной ссылки;
- QR-коды;
- связь с Remnawave REST API;
- список доступных узлов;
- агрегированный health;
- аудит действий;
- webhooks;
- rate limiting;
- OpenAPI;
- health/readiness/liveness endpoints.

Критичные операции должны быть идемпотентными.

---

## 9. Telegram Bot и Mini App

Бот должен иметь реальные функции:

- `/start`;
- статус подписки;
- тариф;
- срок действия;
- кнопка «Получить конфигурацию»;
- QR-код;
- инструкции Android/iOS/Windows;
- статус двух узлов;
- обращение в поддержку;
- уведомление об окончании подписки;
- административные команды только для `TELEGRAM_ADMIN_IDS`.

Mini App:

- авторизация через Telegram init data с серверной проверкой подписи;
- кабинет пользователя;
- устройства;
- подписка;
- инструкции;
- статусы;
- оплата подключается адаптером, не заглушкой; если платёжный провайдер не указан, интерфейс оплаты не объявлять рабочим.

---

## 10. Клиентские подключения и автоматический выбор

Подписка должна содержать несколько независимых профилей:

1. Node 1 — Xray основной;
2. Node 2 — Xray основной;
3. Node 1 — Hysteria 2 резерв;
4. Node 2 — Hysteria 2 резерв;
5. AmneziaWG профили только при готовой совместимости.

Для собственного клиента реализуй health scoring:

- успешность handshake;
- время подключения;
- latency;
- packet loss;
- стабильность за последние проверки;
- cooldown после ошибки;
- автоматическое переключение;
- ручной выбор узла;
- безопасное возвращение на более быстрый профиль.

Не делай переключение только по ping: подтверждай реальную возможность соединения.

Проверь доступность пользовательских сценариев для WhatsApp, Telegram, YouTube и Instagram синтетическими тестами без чтения пользовательского содержимого.

---

## 11. Надёжность

- Data plane продолжает работать при временной недоступности web/frontend.
- Node 1 и Node 2 обновляются по очереди.
- Перед обновлением узла выполняется drain или исключение из выдачи новых подключений.
- После обновления выполняется smoke test, затем узел возвращается в active.
- При провале выполняется автоматический rollback.
- PostgreSQL backup выполняется ежедневно.
- Restore test выполняется регулярно в изолированном контейнере.
- Monitoring проверяет API, DNS, TLS, процессы, ресурсы и синтетическое подключение.
- Уведомления не срабатывают по одиночной краткой ошибке: применяй подтверждение и anti-flapping.

---

## 12. Безопасность

- SSH только по ключам.
- Отключить вход root по паролю после подтверждённого доступа отдельного администратора либо сохранить аварийный контролируемый путь, если автоматическая миграция небезопасна.
- UFW/nftables: открыть только необходимые порты.
- Внутренние management ports доступны только между control plane и nodes.
- Secrets только в `.env`, GitHub Secrets, Vercel Secrets или менеджере секретов.
- Пароли хешировать Argon2id или совместимым проверенным алгоритмом.
- JWT secrets генерировать криптографически.
- Админ-панель защищать MFA/SSO при возможности.
- Включить dependency scanning, secret scanning, CodeQL или эквивалент.
- Создавать SBOM и checksums для релизов.
- Не логировать конфигурационные ссылки, токены, приватные ключи и содержимое трафика.

---

## 13. GitHub Actions

Создай workflows:

- `ci.yml`: lint, typecheck, unit tests, integration tests;
- `security.yml`: dependency audit, secret scan, SAST;
- `build-images.yml`: versioned containers in GHCR;
- `release.yml`: artifacts, SBOM, checksums;
- `deploy-control.yml`: manual/protected production deploy;
- `deploy-nodes.yml`: rolling deployment node1 затем node2;
- `vercel.yml`: frontend preview/production integration;
- `backup-verify.yml`: проверка скриптов восстановления в тестовой среде.

Ни один production deploy не должен запускаться после проваленного CI.

---

## 14. Vercel

- Связать `apps/web` с Vercel Project.
- Использовать Preview Deployments для pull requests.
- Production deploy только из защищённой ветки.
- Добавить env:
  - `NEXT_PUBLIC_API_URL`;
  - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`;
  - серверные секреты только если реально необходимы и не попадают в client bundle.
- Проверить build logs и runtime logs.
- После deploy проверить основные страницы и API-вызовы.

---

## 15. Тестирование

Обязательные тесты:

### Код

- lint;
- typecheck;
- unit tests;
- integration tests;
- migrations on empty DB;
- migrations on copied production schema;
- API contract tests;
- Telegram init-data verification tests.

### Инфраструктура

- `docker compose config`;
- health checks всех контейнеров;
- firewall verification;
- TLS verification;
- DNS verification;
- backup + restore test;
- rolling restart;
- node failure simulation;
- control plane temporary outage;
- subscription retrieval;
- QR generation;
- real client profile parsing.

### End-to-end

1. создать тестового пользователя;
2. создать подписку;
3. получить subscription URL;
4. проверить, что URL открывается;
5. получить профили двух узлов;
6. проверить синтаксис конфигураций;
7. выполнить соединение с Node 1;
8. отключить Node 1;
9. подтвердить соединение через Node 2;
10. вернуть Node 1;
11. удалить тестового пользователя;
12. подтвердить очистку.

---

## 16. Итоговый отчёт

Создай:

- `reports/FINAL_REPORT.md`;
- `reports/FINAL_REPORT.html`;
- `reports/versions.json`;
- `reports/health.json`;
- `reports/endpoints.json`;
- `reports/checksums.txt`;
- `reports/failed_checks.md`, только если есть ошибки.

В отчёте чётко раздели:

- проверено и работает;
- установлено, но требует внешнего секрета;
- не установлено;
- не проверено;
- блокеры;
- точная команда исправления;
- точная команда повторной проверки;
- ожидаемый результат.

Финальный вывод в консоли:

```text
AiMA VPN DEPLOYMENT RESULT
Control Panel: <verified URL or NOT DEPLOYED>
User Web App: <verified URL or NOT DEPLOYED>
Telegram Bot: <verified username or NOT CONFIGURED>
Node 1: <HEALTHY/UNHEALTHY/NOT CONFIGURED>
Node 2: <HEALTHY/UNHEALTHY/NOT CONFIGURED>
Subscription Test: <PASSED/FAILED/NOT RUN>
Failover Test: <PASSED/FAILED/NOT RUN>
Backup Restore Test: <PASSED/FAILED/NOT RUN>
Report: <absolute path>
```

---

## 17. Критерии готовности

Проект считается готовым только если:

- существующий код сохранён или доказано, что его не было;
- GitHub содержит полноценный монорепозиторий;
- PowerShell installer проходит syntax check;
- Ubuntu installer проходит `bash -n` и ShellCheck;
- Docker Compose валиден;
- control plane запущен;
- два узла зарегистрированы и healthy;
- создан администратор;
- web открыт;
- bot отвечает;
- subscription URL выдаёт реальные профили;
- Node 1 и Node 2 проверены отдельно;
- failover подтверждён тестом;
- backup и restore подтверждены;
- CI зелёный;
- секреты отсутствуют в Git;
- итоговый отчёт создан.

Если хотя бы один пункт не выполнен, не пиши «готово». Напиши точный фактический статус и продолжай исправление до достижения результата либо до объективного внешнего блокера.
