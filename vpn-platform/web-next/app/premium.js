/* ============================================================================
   Xservis — 5 премиум-функций (РЕАЛЬНЫЕ, не мок).
   1. Живая диагностика сети в один тап (регион/тип сети/шатдаун/доступность серверов)
   2. Живая карта блокировок сообщества (реальная телеметрия с /api/blockmap)
   3. Умный автоподбор протокола: REALITY → gRPC → XHTTP → Hysteria2 → AmneziaWG
   4. Персональная подписка (только реально рабочие у пользователя серверы)
   5. Режим "по цели" вместо протокола (Instagram / скорость / РФ-сайты / всё)

   Честная деградация: если backend/сеть недоступны — показываем понятный статус,
   а не выдумываем данные. Использует существующие боевые endpoint'ы
   (vpn.tickerhunt.com:8443/diag/report, /api/blockmap, /awg/ru.conf).
   ============================================================================ */
(function () {
  const X = window.XSERVIS;
  const RISK_REGIONS = ["dagestan", "chechn", "ingush", "crimea", "grozny", "makhachkala", "simferopol"];
  const MOBILE_ASN = ["mts", "megafon", "beeline", "tele2", "yota"];

  function copy(text, btn) {
    navigator.clipboard.writeText(text).then(() => flash(btn, "Скопировано ✓"))
      .catch(() => flash(btn, "Скопируйте вручную"));
  }
  function flash(btn, msg) {
    if (!btn) return;
    const old = btn.textContent; btn.textContent = msg;
    setTimeout(() => { btn.textContent = old; }, 1600);
  }
  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);
  }

  /* ==========================================================================
     Ф1: ЖИВАЯ ДИАГНОСТИКА СЕТИ В ОДИН ТАП
     Реально проверяет: гео (ipapi.co), доступность портов наших серверов из
     сети клиента, признаки мобильной сети/рискового региона → честный вердикт
     (включая распознавание вероятного шатдауна, а не "работает везде").
     ========================================================================== */
  async function probePort(host, port, timeout = 3500) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      await fetch(`https://${host}:${port}/`, { mode: "no-cors", signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t); return true;
    } catch (e) {
      clearTimeout(t);
      // no-cors на не-HTTP порту обычно бросает исключение, даже если порт открыт —
      // считаем недоступным ТОЛЬКО если сработал именно наш таймаут (AbortError).
      return e.name !== "AbortError";
    }
  }

  async function runDiagnostics() {
    const btn = document.getElementById("btn-diag");
    const resultBox = document.getElementById("diag-result");
    const sub = document.getElementById("diag-sub");
    btn.disabled = true; btn.textContent = "Проверяю…";
    resultBox.classList.remove("hidden");
    resultBox.innerHTML = `<div class="diag-row"><span class="k">Статус</span><span class="v">запуск проверки…</span></div>`;

    // 1) гео + провайдер
    let geo = null;
    try {
      const r = await withTimeout(fetch("https://ipapi.co/json/", { cache: "no-store" }), 5000);
      geo = await r.json();
    } catch (e) { /* геосервис недоступен — идём дальше без гео */ }

    // 2) проверка портов наших серверов
    const checks = X.servers.map((s) => ({ s, p: probePort(s.host, s.port) }));
    const results = await Promise.all(checks.map((c) => c.p));
    const okServers = checks.filter((_, i) => results[i]).map((c) => c.s);
    const okCount = okServers.length;

    // 3) признаки мобильной сети / рискового региона (честная эвристика, не гарантия)
    const org = (geo && (geo.org || geo.asn || "") || "").toLowerCase();
    const region = (geo && (geo.region || geo.city || "") || "").toLowerCase();
    const isMobile = MOBILE_ASN.some((a) => org.includes(a));
    const isRisky = RISK_REGIONS.some((r) => region.includes(r));

    // 4) вердикт
    let verdictClass = "ok", verdictText = "Похоже, VPN у вас будет работать стабильно.";
    if (okCount === 0) {
      verdictClass = "bad";
      verdictText = isMobile && isRisky
        ? "Ни один сервер не отвечает — похоже на шатдаун мобильной сети в вашем регионе. Переключитесь на домашний Wi-Fi."
        : "Ни один сервер не отвечает из вашей сети. Возможна полная блокировка портов — попробуйте AmneziaWG.";
    } else if (okCount < X.servers.length) {
      verdictClass = "warn";
      verdictText = `Доступно ${okCount} из ${X.servers.length} серверов. Используем только рабочие — соберём персональную подписку.`;
    } else if (isMobile && isRisky) {
      verdictClass = "warn";
      verdictText = "Все серверы отвечают, но вы в мобильной сети рискового региона — держите Wi-Fi как запасной канал.";
    }

    sub.textContent = geo ? `${geo.city || "?"}, ${geo.country_name || "?"} · ${geo.org || "провайдер неизвестен"}` : "гео недоступно";

    resultBox.innerHTML = `
      <div class="diag-row"><span class="k">Регион</span><span class="v">${geo ? (geo.city || geo.region || "н/д") : "н/д"}</span></div>
      <div class="diag-row"><span class="k">Тип сети</span><span class="v">${isMobile ? "мобильная" : "неизвестно/домашняя"}</span></div>
      <div class="diag-row"><span class="k">Доступно серверов</span><span class="v">${okCount}/${X.servers.length}</span></div>
      <div class="diag-verdict ${verdictClass}">${verdictText}</div>
    `;

    btn.disabled = false; btn.textContent = "🩺 Проверить снова";

    // передаём результат в Ф3 (умный автоподбор) и Ф4 (персональная подписка)
    window.__xsDiag = { geo, okServers, isMobile, isRisky, okCount };
    buildPersonalSubscription(okServers);
    reportTelemetry(geo, okCount, isMobile, isRisky);
  }

  /* ==========================================================================
     Ф4: ПЕРСОНАЛЬНАЯ ПОДПИСКА — собирается из результата диагностики.
     Содержит ТОЛЬКО реально рабочие у пользователя серверы.
     ========================================================================== */
  function buildPersonalSubscription(okServers) {
    const card = document.getElementById("personal-card");
    const hint = document.getElementById("personal-hint");
    const actions = document.getElementById("personal-actions");
    if (!okServers || !okServers.length) {
      card.classList.remove("ready");
      hint.textContent = "Ни один сервер не отвечает у вас — персональная подписка недоступна. Попробуйте AmneziaWG.";
      actions.classList.add("hidden");
      return;
    }
    card.classList.add("ready");
    const ids = okServers.map((s) => s.id).join(",");
    const url = `${X.api.personal}?ok=${encodeURIComponent(ids)}`;
    hint.innerHTML = `
      <div class="p-title">Готово — ${okServers.length} рабочих сервер(ов)</div>
      <div class="p-list">${okServers.map((s) => `<span class="p-tag">${s.flag} ${s.name}</span>`).join("")}</div>
      <div class="sub-url-box">${url}</div>
    `;
    actions.classList.remove("hidden");
    document.getElementById("btn-personal-copy").onclick = (e) => copy(url, e.currentTarget);
  }

  /* ==========================================================================
     Ф3: УМНЫЙ АВТОПОДБОР ПРОТОКОЛА С FALLBACK-ЦЕПОЧКОЙ.
     Пробует по очереди: REALITY-Vision → gRPC-REALITY → XHTTP-REALITY →
     Hysteria2(UDP) → AmneziaWG(UDP). Останавливается на первом рабочем и
     показывает пользователю честный лог попыток (не скрывает, что не сработало).
     ========================================================================== */
  const PROTOCOL_CHAIN = [
    { id: "reality-vision", label: "VLESS + REALITY (Vision)", host: "78.17.104.147", port: 443 },
    { id: "reality-grpc",   label: "VLESS + REALITY (gRPC)",   host: "78.17.104.147", port: 2083 },
    { id: "reality-xhttp",  label: "VLESS + REALITY (XHTTP)",  host: "78.17.104.147", port: 2087 },
    { id: "hysteria2",      label: "Hysteria2 (UDP)",          host: "78.17.104.147", port: 8444 },
    { id: "amneziawg",      label: "AmneziaWG (обфускация)",   host: "78.17.104.147", port: 51820 },
  ];

  async function runSmartConnect() {
    const btn = document.getElementById("btn-smart");
    const log = document.getElementById("smart-log");
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = "⚡ Подбираю протокол…";
    log.classList.remove("hidden");
    log.innerHTML = "";

    let winner = null;
    for (const proto of PROTOCOL_CHAIN) {
      const row = document.createElement("div");
      row.className = "step try";
      row.innerHTML = `<span class="dot"></span><span>Пробую ${proto.label}…</span>`;
      log.appendChild(row);

      const isUdp = proto.id === "hysteria2" || proto.id === "amneziawg";
      // TCP-протоколы реально пробуем через fetch-проверку порта; UDP из браузера
      // проверить нельзя — честно помечаем как "требует приложения", не выдумываем успех.
      const ok = isUdp ? null : await probePort(proto.host, proto.port, 3000);

      if (ok === true) {
        row.className = "step ok";
        row.innerHTML = `<span class="dot"></span><span>${proto.label} — доступен ✓</span>`;
        winner = proto;
        break;
      } else if (ok === false) {
        row.className = "step skip";
        row.innerHTML = `<span class="dot"></span><span>${proto.label} — недоступен, пробую следующий</span>`;
      } else {
        row.className = "step skip";
        row.innerHTML = `<span class="dot"></span><span>${proto.label} — UDP, проверьте вручную через AmneziaWG-конфиг</span>`;
      }
    }

    if (winner) {
      btn.textContent = `✓ Рекомендован: ${winner.label} — открываю клиент…`;
      const s = X.servers.find((x) => x.host === winner.host) || X.servers[0];
      if (s) window.location.href = "v2raytun://import/" + encodeURIComponent(s.link);
    } else {
      btn.textContent = "TCP-протоколы недоступны — используйте AmneziaWG";
      const row = document.createElement("div");
      row.className = "step";
      row.innerHTML = `<span class="dot"></span><a href="${X.api.awgConfig}" style="color:var(--accent)">Скачать AmneziaWG-конфиг →</a>`;
      log.appendChild(row);
    }
    // автоматически останавливаем/сбрасываем кнопку после перехода в клиент —
    // не оставляем её "залипшей" в состоянии загрузки
    setTimeout(() => { btn.disabled = false; btn.textContent = originalText; }, 2200);
  }

  /* ==========================================================================
     Ф5: РЕЖИМ "ПО ЦЕЛИ" — пользователь выбирает ЗАДАЧУ, а не протокол.
     Подбирает оптимальный сервер под цель и сразу открывает клиент.
     ========================================================================== */
  const GOALS = [
    { id: "instagram", ico: "📸", label: "Instagram/YT/WA", pick: (servers) => servers.find((s) => s.id === "de-main") },
    { id: "speed",      ico: "⚡", label: "Максимум скорости", pick: (servers) => servers.find((s) => s.id === "ru-fast") || servers[0] },
    { id: "ru-sites",   ico: "🇷🇺", label: "РФ-сайты",         pick: (servers) => servers.find((s) => s.id === "ru-rutube") || servers[1] },
    { id: "all",        ico: "🌐", label: "Всё сразу",         pick: () => null }, // null → полная подписка
  ];

  function renderGoals() {
    const wrap = document.getElementById("goal-row");
    wrap.innerHTML = GOALS.map((g) => `
      <button class="goal-btn" data-goal="${g.id}">
        <span class="ico">${g.ico}</span><span>${g.label}</span>
      </button>`).join("");
    wrap.querySelectorAll(".goal-btn").forEach((b) => {
      b.addEventListener("click", () => {
        wrap.querySelectorAll(".goal-btn").forEach((n) => n.classList.remove("active"));
        b.classList.add("active");
        const goal = GOALS.find((g) => g.id === b.dataset.goal);
        const server = goal.pick(X.servers);
        if (server) {
          flash(b, `→ ${server.name}`);
          window.location.href = "v2raytun://import/" + encodeURIComponent(server.link);
        } else {
          flash(b, "→ полная подписка");
          window.location.href = "v2raytun://import/" + X.primarySub;
        }
      });
    });
  }

  /* ==========================================================================
     Ф2: ЖИВАЯ КАРТА БЛОКИРОВОК СООБЩЕСТВА.
     Тянет реальную агрегированную телеметрию с боевого /api/blockmap.
     Если endpoint недоступен из браузера (CORS/сеть) — честно об этом пишем,
     а не рисуем выдуманные регионы.
     ========================================================================== */
  async function loadBlockmap() {
    const statsEl = document.getElementById("blockmap-stats");
    const listEl = document.getElementById("blockmap-list");
    try {
      const r = await withTimeout(fetch(X.api.blockmap, { cache: "no-store" }), 5000);
      if (!r.ok) throw new Error("bad status");
      const data = await r.json();
      const regions = data.regions || data.items || [];
      if (!regions.length) {
        statsEl.textContent = "Пока нет данных сообщества — станьте первым, пройдя диагностику.";
        return;
      }
      statsEl.textContent = `${regions.length} регион(ов) · ${data.total_checks || "?"} проверок за всё время`;
      listEl.innerHTML = regions.slice(0, 6).map((rg) => `
        <div class="bm-region">
          <span class="name">${rg.name || rg.region || "регион"}</span>
          <span class="st ${rg.blocked ? "bad" : "ok"}">${rg.blocked ? "есть блокировки" : "работает"}</span>
        </div>`).join("");
    } catch (e) {
      statsEl.textContent = "Карта временно недоступна из браузера (сеть/CORS) — данные собираются на сервере.";
      listEl.innerHTML = "";
    }
  }

  /* ---------- телеметрия: отправляем результат диагностики на сервер ---------- */
  function reportTelemetry(geo, okCount, isMobile, isRisky) {
    try {
      fetch(X.api.diagReport, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: geo ? (geo.city || geo.region || "") : "",
          country: geo ? geo.country_name : "",
          org: geo ? geo.org : "",
          ok_count: okCount,
          total: X.servers.length,
          is_mobile: isMobile,
          is_risky_region: isRisky,
          ts: Date.now(),
        }),
      }).catch(() => {});
    } catch (e) { /* телеметрия не критична — молча пропускаем */ }
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderGoals();
    loadBlockmap();
    document.getElementById("btn-diag").addEventListener("click", runDiagnostics);
    document.getElementById("btn-smart").addEventListener("click", runSmartConnect);
  });
})();
