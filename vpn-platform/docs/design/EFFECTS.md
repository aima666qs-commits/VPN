# Эффекты AiMA VPN — применённые и отклонённые

Дата: 2026-07-02. Первая итерация (главный экран, 6 концепций).
Правило: эффект остаётся, только если повышает качество и не вредит скорости,
читаемости или управлению. Все анимации — на `transform`/`opacity`, есть
`prefers-reduced-motion` fallback + ручной тумблер «Уменьшить анимацию».

## Применённые эффекты (с причиной)

| Эффект | Где | Почему |
|--------|-----|--------|
| aurora gradient mesh | Aurora, хаб | живая премиальная атмосфера без неона |
| subtle glass blur | Aurora (дозированно) | иерархия карточек, не на каждой |
| 1px luminous borders | все тёмные темы | премиальная тонкая грань |
| animated noise texture | Aurora | убирает «пластиковость» градиента, opacity 0.04 |
| cursor proximity glow | Aurora | тактильность на desktop, transform-only |
| metal sheen | Liquid Metal | ощущение дорогой ОС, один проход |
| grid + scan line | Cyber Lux | эффект командного центра |
| network nodes | Cyber Lux | визуализация сети |
| 2D orbits (CSS/SVG) | Spatial Orbit | объясняет маршрут через сеть, без WebGL |
| soft parallax | Spatial Orbit | глубина от указателя, transform-only |
| animated connection pulse | ядро (connected) | статус подключения как энергия |
| spinner ring | ядро (connecting) | понятное состояние соединения |
| number counters | ping/speed | оживление метрик, отключается при reduced-motion |
| skeleton loading | база (класс готов) | плавная загрузка |
| smooth theme transitions | смена темы | мягкое переключение фона/цвета |
| tactile button press | все кнопки/ядро | scale(0.96–0.97) на :active |
| scroll/load reveal | все блоки | появление с задержкой d1–d4 |
| card tilt (малая амплитуда) | hover карточек | translateY(-2..-4px), не крутится |

## Отклонённые эффекты (и почему)

| Отклонено | Причина |
|-----------|---------|
| тяжёлый blur на КАЖДОЙ карточке | тормозит на среднем Android, снижает читаемость |
| бесконечные вращающиеся элементы (кроме орбит/спиннера) | визуальный шум без функции |
| кислотный неон на всём экране | дёшево, вредит доверию |
| перегруженные частицы | нагрузка + отвлекает; частицы только сдержанно |
| случайные 3D-объекты | нет функции + не влезает (WebGL) |
| дешёвые AI-иллюстрации | ломают премиальность |
| огромные бессмысленные hero-блоки | пустая трата экрана |
| анимации, мешающие нажатию кнопок | вредят управлению |
| Framer Motion / React Three Fiber | не влезают (диск), для 2D избыточны |
| Tailwind CDN runtime-компилятор | ~400КБ, тормозит; заменён своим utility-слоем |

## Технические гарантии производительности

- Все движущиеся эффекты используют только `transform` и `opacity`.
- Бесконечные анимации (blob, sheen, scan, orbit) глушатся при
  `prefers-reduced-motion` и при ручном тумблере (класс `html.rm`).
- `backdrop-filter` имеет `@supports not` fallback.
- Шрифты — `display=swap` + system-ui fallback (без layout shift).
- Весь showcase — 88 КБ, без node_modules.
