/* ============================================================================
   Xservis — общие мок-данные главного экрана.
   ВНИМАНИЕ: это МОК для дизайн-сравнения, НЕ реальные данные с backend.
   Все 6 концепций рисуют эти же значения — сравнение честное.
   ============================================================================ */
window.XSERVIS_CONNECT = {
  brand: { name: "Xservis", accent: "VPN" },
  state: "connected", // disconnected | connecting | connected
  server: {
    flag: "🇩🇪",
    name: "Германия · Франкфурт",
    meta: "REALITY · оптимальный маршрут",
    code: "DE",
  },
  metrics: {
    ping: 42,          // мс
    speed: 186,        // Мбит/с
    protocol: "VLESS + REALITY",
    uptime: "стабильно",
  },
  subscription: {
    plan: "Pro",
    daysLeft: 47,
    devices: 3,
    devicesMax: 5,
  },
  nodes: { active: 1, list: ["Node 1", "Node 2"] },
  quick: [
    { ico: "✈️", label: "Telegram" },
    { ico: "💬", label: "WhatsApp" },
    { ico: "▶️", label: "YouTube" },
    { ico: "📸", label: "Instagram" },
  ],
};

/* 9 тем: id, человекочитаемое имя, короткое описание, превью-градиент для свотча */
window.XSERVIS_THEMES = [
  { id: "xservis-hybrid", name: "Xservis Hybrid",     desc: "финальный гибрид · Calm + Aurora",  sw: "linear-gradient(135deg,#14B8A6,#22D3EE,#3B82F6)" },
  { id: "xservis-void",   name: "Xservis Void",       desc: "чёрный canvas, прозрачные окна, фиолет", sw: "linear-gradient(135deg,#000000,#8052FF,#000000)" },
  { id: "aurora-glass",   name: "Aurora Glass Prime", desc: "стекло + aurora, главный кандидат", sw: "linear-gradient(135deg,#22D3EE,#3B82F6,#8B5CF6)" },
  { id: "liquid-metal",   name: "Liquid Metal OS",    desc: "жидкий металл, титан/хром",         sw: "linear-gradient(135deg,#E6E9EE,#C0C4CC,#71767F)" },
  { id: "cyber-lux",      name: "Cyber Lux Network",  desc: "командный центр сети",              sw: "linear-gradient(135deg,#22D3EE,#2563EB,#EC4899)" },
  { id: "calm-enterprise",name: "Calm Enterprise",    desc: "доверие Linear/Stripe, светлая",   sw: "linear-gradient(135deg,#14B8A6,#0EA5A0,#e5e7eb)" },
  { id: "spatial-orbit",  name: "Spatial Orbit",      desc: "орбиты серверов (2D)",             sw: "linear-gradient(135deg,#2DD4BF,#22D3EE,#38BDF8)" },
  { id: "neo-editorial",  name: "Neo Editorial Tech", desc: "editorial, характер",              sw: "linear-gradient(135deg,#14B8A6,#0D9488,#FB923C)" },
  { id: "xservis-vault",  name: "Xservis Vault",      desc: "изумрудный сейф · спокойное золото", sw: "linear-gradient(135deg,#06100D,#34E3A5,#E8C87A)" },
];
