/* ============================================================================
   Xservis — РЕАЛЬНАЯ конфигурация VPN (не мок).
   Источники подписки, серверы, сервисные маршруты, домен.
   Данные взяты из живой подписки (проверено 2026-07-02, HTTP 200).
   ============================================================================ */
window.XSERVIS = {
  brand: "Xservis",
  domain: "xservis.online",          // основной домен (привязывает пользователь)

  /* URL подписок — клиент (v2RayTun/Hiddify) скачивает конфиги отсюда сам.
     Порядок = приоритет при fetch (первый рабочий выигрывает). */
  subscriptions: {
    full:      "http://157.22.253.53/sub/aima",           // 18 конфигов (Hiddify) — путь на сервере, менять нельзя
    v2raytun:  "http://157.22.253.53/sub/aima-v2raytun",  // без xhttp (v2RayTun)
    simple:    "http://157.22.253.53/sub/aima-simple",    // макс. совместимость
    httpsFull: "https://vpn.tickerhunt.com:8443/sub/aima",// HTTPS-зеркало (iOS)
    personal:  "https://vpn.tickerhunt.com:8443/sub/personal", // персональная подписка по диагностике
  },
  // основной URL, который встраиваем в deep-link клиента:
  primarySub: "http://157.22.253.53/sub/aima-simple",

  /* endpoints диагностики/телеметрии на боевом сервере (реальные, уже развёрнуты) */
  api: {
    diagReport: "https://vpn.tickerhunt.com:8443/diag/report",
    blockmap:   "https://vpn.tickerhunt.com:8443/api/blockmap",
    awgConfig:  "https://vpn.tickerhunt.com:8443/awg/ru.conf",
  },

  /* 4 реальных сервера/выхода. flow берётся из подписки. */
  servers: [
    {
      id: "de-main",
      flag: "🇩🇪",
      name: "Германия · Франкфурт",
      role: "Обход блокировок (Instagram, YouTube, WhatsApp)",
      host: "78.17.104.147",
      port: 443,
      sni: "www.cloudflare.com",
      link: "vless://a06b7132-43bb-41f0-b751-9a1b071959af@78.17.104.147:443?type=tcp&security=reality&sni=www.cloudflare.com&fp=chrome&pbk=yn13UczFM1eJue6KsEi7fP0bHCIqxYo8t4yulh2GKTc&sid=b24ad2fc6edce831&flow=xtls-rprx-vision#Xservis-DE",
    },
    {
      id: "ru-fast",
      flag: "🇷🇺",
      name: "Россия · быстрый (Yandex SNI)",
      role: "Быстрый доступ внутри РФ",
      host: "157.22.253.53",
      port: 443,
      sni: "api-maps.yandex.ru",
      link: "vless://5acc7b69-19ee-40d8-ba43-05d9b91d1a26@157.22.253.53:443?type=tcp&security=reality&sni=api-maps.yandex.ru&fp=chrome&pbk=zZmF2xD70pbTijm-2O-V6kzFNcWZY33xbnniVvchFmM&sid=78bc6f&flow=xtls-rprx-vision#Xservis-RU-fast",
    },
    {
      id: "ru-vk",
      flag: "🇷🇺",
      name: "Россия · VK SNI",
      role: "Запасной РФ-маршрут",
      host: "157.22.253.53",
      port: 2087,
      sni: "vk.com",
      link: "vless://5acc7b69-19ee-40d8-ba43-05d9b91d1a26@157.22.253.53:2087?type=tcp&security=reality&sni=vk.com&fp=chrome&pbk=zZmF2xD70pbTijm-2O-V6kzFNcWZY33xbnniVvchFmM&sid=148d74&flow=xtls-rprx-vision#Xservis-RU-vk",
    },
    {
      id: "ru-rutube",
      flag: "🇷🇺",
      name: "Россия · RuTube SNI",
      role: "Запасной РФ-маршрут (быстрый порт)",
      host: "157.22.253.53",
      port: 10443,
      sni: "rutube.ru",
      link: "vless://5acc7b69-19ee-40d8-ba43-05d9b91d1a26@157.22.253.53:10443?type=tcp&security=reality&sni=rutube.ru&fp=chrome&pbk=zZmF2xD70pbTijm-2O-V6kzFNcWZY33xbnniVvchFmM&sid=ee9658&flow=xtls-rprx-vision#Xservis-RU-rutube",
    },
    /* Новые узлы, развёрнуты и сквозным трафиком проверены 2026-07-05/06 (HostKey) */
    {
      id: "tr-main",
      flag: "🇹🇷",
      name: "Турция",
      role: "Дополнительный обход блокировок",
      host: "82.26.94.154",
      port: 443,
      sni: "www.cloudflare.com",
      link: "vless://5a778f57-b91d-4750-9166-0577445202ce@82.26.94.154:443?type=tcp&security=reality&sni=www.cloudflare.com&fp=chrome&pbk=IshJ7Aw06DAf9q9S3HvZL4C8MnO5aN47mcMfdnPA3wo&sid=761128ae5da65734&flow=xtls-rprx-vision#Xservis-TR",
    },
    {
      id: "ru-newhost",
      flag: "🇷🇺",
      name: "Россия · новый узел (Yandex SNI)",
      role: "Дополнительный быстрый РФ-маршрут",
      host: "77.91.93.217",
      port: 443,
      sni: "www.yandex.ru",
      link: "vless://270472e6-95d6-46d1-a92b-c23410fa4dfa@77.91.93.217:443?type=tcp&security=reality&sni=www.yandex.ru&fp=chrome&pbk=MlRaTsB9Bn_MmQEiLPbA0QpMpO3hLiPBfwLC1rlFV1c&sid=d51143136a97b0e8&flow=xtls-rprx-vision#Xservis-RU-new",
    },
    {
      id: "fi-main",
      flag: "🇫🇮",
      name: "Финляндия",
      role: "Дополнительный обход блокировок (север Европы)",
      host: "148.135.211.19",
      port: 443,
      sni: "www.cloudflare.com",
      link: "vless://bcd9700d-2a1e-4c49-ac3f-c80c2ebd2e01@148.135.211.19:443?type=tcp&security=reality&sni=www.cloudflare.com&fp=chrome&pbk=-WK7OQ7d3epu96rYD_TeM8hzYGpwVqtl32de6F5EYEg&sid=8b10f099605bfd1a&flow=xtls-rprx-vision#Xservis-FI",
    },
  ],

  /* Кнопки сервисов → какой сервер лучше подходит (для заблокированных → DE) */
  services: [
    { ico: "✈️", label: "Telegram",  serverId: "ru-fast", note: "работает почти везде" },
    { ico: "▶️", label: "YouTube",   serverId: "de-main", note: "через Германию" },
    { ico: "💬", label: "WhatsApp",  serverId: "de-main", note: "через Германию" },
    { ico: "📸", label: "Instagram", serverId: "de-main", note: "через Германию" },
  ],

  /* ==========================================================================
     ПРИОРИТЕТ "ВСЕГДА НА СВЯЗИ": WhatsApp / YouTube / Telegram / Instagram.
     У каждого сервиса — цепочка из НЕСКОЛЬКИХ независимых маршрутов
     (разные протоколы, разные SNI, разные страны). Если один маршрут
     заблокирован/режется DPI — приложение переключается на следующий
     автоматически (см. app/alwayson.js). ЧЕСТНО: 100%-гарантии не даёт
     НИКТО (см. презентацию — раздел "Честно о пределах"), но многоуровневый
     fallback — единственный подход, который реально применяют Telegram/
     Amnezia/Iran-VPN и который переживает и точечные, и массовые блокировки.
     ========================================================================== */
  alwaysOn: [
    {
      id: "whatsapp", ico: "💬", label: "WhatsApp",
      why: "звонки/видео заблокированы в РФ с авг. 2025 — нужен стабильный низколатентный туннель",
      chain: [
        { serverId: "de-main",   kind: "reality-tcp",  desc: "REALITY·Vision через Германию (cloudflare SNI)" },
        { serverId: "ru-vk",     kind: "reality-tcp",  desc: "REALITY через РФ (vk.com SNI) — если DE зарезан" },
        { serverId: "amneziawg", kind: "amneziawg-udp",desc: "AmneziaWG — обфусцированный WireGuard, живёт при DPI-разрыве TCP" },
      ],
    },
    {
      id: "youtube", ico: "▶️", label: "YouTube",
      why: "режется через НСДИ (национальную систему доменных имён) с 2023, усилилось в 2026",
      chain: [
        { serverId: "de-main",   kind: "reality-tcp",  desc: "REALITY·Vision через Германию" },
        { serverId: "de-grpc",   kind: "reality-grpc", desc: "REALITY·gRPC (apple.com SNI) — если Vision режут" },
        { serverId: "de-xhttp",  kind: "reality-xhttp",desc: "REALITY·XHTTP (amazon.com SNI) — резервный HTTP-маскинг" },
      ],
    },
    {
      id: "telegram", ico: "✈️", label: "Telegram",
      why: "замедление с окт. 2025, звонки заблокированы; исторически самый живучий — свой MTProto",
      chain: [
        { serverId: "ru-fast",   kind: "reality-tcp",  desc: "REALITY через РФ (Yandex SNI) — самый быстрый пинг" },
        { serverId: "de-main",   kind: "reality-tcp",  desc: "REALITY через Германию — если РФ-маршрут режут" },
        { serverId: "mtproto",   kind: "mtproto",      desc: "Встроенный MTProto-прокси Telegram (без VPN, для мессенджинга)" },
      ],
    },
    {
      id: "instagram", ico: "📸", label: "Instagram",
      why: "заблокирован Роскомнадзором ещё в 2022, стабильно недоступен без обхода",
      chain: [
        { serverId: "de-main",   kind: "reality-tcp",  desc: "REALITY·Vision через Германию" },
        { serverId: "ru-rutube", kind: "reality-tcp",  desc: "REALITY через РФ (RuTube SNI, порт 10443) — запасной" },
        { serverId: "amneziawg", kind: "amneziawg-udp",desc: "AmneziaWG — если оба TCP-маршрута заблокированы" },
      ],
    },
  ],

  /* Deep-link'и для импорта подписки в клиент (кнопка Подключить). */
  deepLinks(subUrl) {
    const enc = encodeURIComponent(subUrl);
    return {
      v2raytun: `v2raytun://import/${subUrl}`,
      hiddify:  `hiddify://import/${subUrl}`,
      // универсальный fallback — просто открыть подписку
      raw: subUrl,
    };
  },
};

/* ---- Парсер vless-ссылки в объект (host, port, sni, tag) ---- */
window.parseVless = function (link) {
  try {
    if (!link.startsWith("vless://")) return null;
    const noProto = link.slice("vless://".length);
    const [main, tagRaw] = noProto.split("#");
    const tag = tagRaw ? decodeURIComponent(tagRaw) : "";
    const at = main.indexOf("@");
    const uuid = main.slice(0, at);
    const rest = main.slice(at + 1);
    const q = rest.indexOf("?");
    const hostPort = q === -1 ? rest : rest.slice(0, q);
    const params = new URLSearchParams(q === -1 ? "" : rest.slice(q + 1));
    const [host, port] = hostPort.split(":");
    return {
      uuid, host, port: Number(port) || 443,
      sni: params.get("sni") || "",
      security: params.get("security") || "",
      flow: params.get("flow") || "",
      tag, link,
    };
  } catch (e) { return null; }
};

/* ---- Скачать и распарсить подписку (клиент делает это сам) ----
   Пробует источники по очереди, декодирует base64, возвращает массив серверов. */
window.fetchSubscription = async function () {
  const urls = [
    window.XSERVIS.subscriptions.httpsFull,  // https первым (меньше CORS-проблем)
    window.XSERVIS.subscriptions.full,
    window.XSERVIS.subscriptions.simple,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      let text = await res.text();
      // подписка обычно base64 — попробуем декодировать
      let decoded = text;
      if (!text.includes("vless://")) {
        try { decoded = atob(text.replace(/\s/g, "")); } catch (e) { /* не base64 */ }
      }
      const links = decoded.split(/\r?\n/).map((s) => s.trim()).filter((s) => s.startsWith("vless://"));
      const parsed = links.map(window.parseVless).filter(Boolean);
      if (parsed.length) return { ok: true, url, count: parsed.length, servers: parsed };
    } catch (e) { /* пробуем следующий */ }
  }
  return { ok: false, servers: [] };
};
