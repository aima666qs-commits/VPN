# Спецификация: 6 премиальных дизайн-концепций AiMA VPN (главный экран)

Дата: 2026-07-02
Проект: AiMA VPN / Xservis
Расположение: `C:\Users\kkkj\vpn-platform\web-next\`

## Цель

Реализовать 6 премиальных дизайн-концепций ГЛАВНОГО пользовательского экрана
(экран подключения) как переключаемые темы в одном статичном проекте, сравнить
их по 12 критериям и выбрать победителя. Первая итерация — только главный экран
на каждой из 6 концепций (остальные 11 экранов — в следующих итерациях уже для
победителя).

## Ограничения (реальные, проверено 2026-07-02)

- Диск C: свободно 636 МБ (100% занято) → полный Next.js + node_modules не влезает.
- Решение: чистая статика HTML + CSS + ванильный JS, без сборки, без node_modules.
- Node 26.1.0 / npm 11.17.0 установлены, но не используются (нет места под deps).
- Старый `frontend/` (рабочая ванильная статика, связана с backend :8000) НЕ трогаем.

## Технический подход

- Никакой сборки. Файлы открываются напрямую в браузере (через `serve.py` для путей `/shared/...`).
- Tailwind — НЕ CDN-runtime, а тонкий слой собственных utility-классов в `base.css`.
- Анимации: CSS transitions, `@keyframes`, Web Animations API, `requestAnimationFrame`.
- Никаких Framer Motion / React Three Fiber (не влезут, для 2D не нужны).
- Spatial Orbit — 2D-эмуляция орбит на CSS/SVG (без WebGL). Есть `prefers-reduced-motion` fallback.
- Все токены — через CSS variables, переключение темы = смена `data-theme` на `<html>`.

## Структура

```
web-next/
  index.html                 # хаб: галерея 6 концепций + меню настроек (переключатель тем)
  design/
    aurora-glass/index.html
    liquid-metal/index.html
    cyber-lux/index.html
    calm-enterprise/index.html
    spatial-orbit/index.html
    neo-editorial/index.html
  shared/
    tokens.css               # ВСЕ 6 наборов design tokens (по data-theme)
    base.css                 # reset, utility-слой, reduced-motion fallback
    connect-data.js          # общие мок-данные экрана подключения
    theme-switcher.js        # меню настроек: выбор темы, localStorage, применение
    connect-screen.js        # рендер главного экрана из общих данных
  serve.py                   # локальный http-сервер
docs/design/
  DESIGN_COMPARISON.md       # матрица 0-10 по 12 критериям
  FINAL_DESIGN_DECISION.md   # выбранный вариант + обоснование
  EFFECTS.md                 # эффекты + причины + отклонённые
```

## Меню настроек (требование пользователя)

На хабе и на каждом preview — иконка-шестерёнка открывает панель настроек с:
- живым переключением 6 тем (мгновенно, через `data-theme`);
- сохранением выбора в `localStorage` (ключ `aima-vpn-theme`);
- переключателем reduced-motion (уважает системную настройку по умолчанию).

Каждый `design/<name>/index.html` также форсит свою тему по умолчанию, но
переключатель позволяет применить любую из 6 поверх любого экрана.

## Главный экран (общие данные, connect-data.js)

Все 6 концепций рисуют ОДНИ данные (честное сравнение):
- Большая кнопка «Подключить» (3 состояния: Отключено / Подключение / Подключено).
- Текущий статус.
- Выбранный сервер (🇩🇪 Germany / 🇷🇺 Node RU).
- Ping (мс), скорость (Мбит/с), активный протокол (VLESS + REALITY).
- Оставшийся срок подписки, количество устройств.
- Кнопка «Авто-выбор лучшего маршрута».
- Быстрый доступ: Telegram, WhatsApp, YouTube, Instagram.
- Индикатор Node 1 / Node 2.
- Без технического мусора для обычного пользователя.

Данные — мок (НЕ выдаём за реальные). Интеграция с backend :8000 — следующая итерация.

## 6 концепций (токены)

Бренд-акцент: бирюзовый `#14B8A6` (ребрендинг Xservis).

1. **Aurora Glass Prime** — `--bg #0B0E14`, aurora-mesh (cyan #22D3EE + violet #8B5CF6 +
   blue #3B82F6), стекло rgba(255,255,255,.04) blur-16, борд 1px rgba(255,255,255,.08),
   шрифт Inter, ядро подключения = энергетический пульс, bento-grid. Главный кандидат.
2. **Liquid Metal OS** — `--bg #0A0A0B`, титан/хром/серебро #C0C4CC→#71767F, металлические
   градиенты с бликом, минимум цвета, бирюза точечно, шрифт Space Grotesk, morphing Connect.
3. **Cyber Lux Network** — `--bg #060810`, сетка + световые линии узлов, cyan #22D3EE +
   magenta #EC4899 + royal #2563EB, live-status командный центр, Inter + JetBrains Mono.
4. **Calm Enterprise** — `--bg #FAFAFA` (light) / dark #0E1116, нейтралы, воздух, борд 1px
   #E5E7EB, один акцент #14B8A6, ноль декора, Inter. Фундамент структуры.
5. **Spatial Orbit** — `--bg #05070D`, орбитальные узлы (CSS/SVG 2D), parallax, глубина
   через тени/blur, cyan→teal, Inter. Без WebGL, reduced-motion fallback.
6. **Neo Editorial Tech** — `--bg #0F0F0F`, контраст белое-чёрное + один яркий (бирюза/orange
   #FB923C), крупные editorial-заголовки, асимметрия, Space Grotesk + JetBrains Mono.

Шрифты — через next/font не поставить (нет сборки) → подключаются через Google Fonts
`<link>` с `display=swap` (fallback system-ui, чтобы не было layout shift).

## Design system (для каждой темы, в tokens.css)

color tokens, typography scale, spacing scale, radius scale, shadows, blur levels,
border styles, motion durations, easing curves, status colors, component states.

## Эффекты (разрешённые)

aurora gradient mesh, subtle glass blur, 1px luminous borders, animated noise,
cursor proximity glow, card tilt (малая амплитуда), spring-like transitions,
animated connection pulse, number counters, skeleton loading, smooth theme transitions,
tactile button press, restrained particles (только hero/success), scroll reveal,
soft parallax, controlled 2D depth, reduced-motion fallback.

Запрещено: тяжёлый blur на каждой карточке, бесконечные вращения, кислотный неон на
всём экране, перегруз частиц, случайный 3D, дешёвые AI-иллюстрации, эффекты без функции.

## Критерии готовности (первая итерация)

1. Папка `web-next/` создана, старый `frontend/` не тронут (verified).
2. 6 файлов `design/<name>/index.html` открываются в браузере без JS-ошибок в консоли.
3. `index.html`-хаб показывает все 6 концепций и меню настроек с рабочим переключателем тем.
4. Переключение темы через меню меняет вид мгновенно и сохраняется в localStorage (verified браузером).
5. `tokens.css` содержит все 6 наборов токенов через CSS variables.
6. `connect-data.js` — единый источник данных, все 6 экранов рисуют одно и то же.
7. `prefers-reduced-motion` реально отключает анимации (verified).
8. `DESIGN_COMPARISON.md` — матрица 0-10 по 12 критериям, выбран победитель в `FINAL_DESIGN_DECISION.md`.
9. Проверка визуалом через браузер (скриншоты/gstack) — все 6 экранов выглядят премиально, не generic.
10. Тяжёлые тесты (Playwright/axe/Lighthouse) — следующая итерация (диск/время).

## Что НЕ входит в первую итерацию (честно)

- Остальные 11 экранов (landing, login, dashboard, карта серверов, тарифы, устройства,
  Telegram Mini App, admin, mobile iOS/Android, states) — после выбора победителя.
- Реальная интеграция с backend API :8000.
- Storybook, Playwright, axe, Lighthouse, Chromatic.
- React Three Fiber / настоящий WebGL.
- Next.js / TypeScript / Tailwind-сборка / Framer Motion (блокер — диск 636 МБ).
