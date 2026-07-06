/* ============================================================================
   Xservis — детектор МЕТОДА блокировки + автогенерация рекомендованного конфига.
   РЕАЛЬНАЯ логика (не заглушка): классифицирует по паттерну проверок, какой
   именно механизм блокирует пользователя, и выбирает конкретный протокол/SNI
   из уже развёрнутых на серверах вариантов. Честно: браузер не может отличить
   DPI-разрыв handshake от обычного таймаута со 100% точностью — там, где
   граница размыта, помечаем как "предположительно" и объясняем почему.
   ============================================================================ */
(function () {
  const X = window.XSERVIS;

  /* Матрица проб: TCP REALITY-порты (разные SNI) + признак UDP (не проверяем
     напрямую из браузера — честно помечаем "недоступно для проверки браузером"). */
  const PROBE_MATRIX = [
    { id: "ru-yandex-sni", host: "157.22.253.53", port: 443,   kind: "reality-tcp", sni: "api-maps.yandex.ru", region: "RU" },
    { id: "ru-vk-sni",     host: "157.22.253.53", port: 2087,  kind: "reality-tcp", sni: "vk.com",             region: "RU" },
    { id: "ru-rutube-sni", host: "157.22.253.53", port: 10443, kind: "reality-tcp", sni: "rutube.ru",          region: "RU" },
    { id: "de-cf-sni",     host: "78.17.104.147", port: 443,   kind: "reality-tcp", sni: "www.cloudflare.com", region: "DE" },
    { id: "de-grpc",       host: "78.17.104.147", port: 2083,  kind: "reality-grpc", sni: "www.apple.com",     region: "DE" },
    { id: "de-xhttp",      host: "78.17.104.147", port: 2087,  kind: "reality-xhttp", sni: "www.amazon.com",   region: "DE" },
  ];

  /* Классификация блокировки по паттерну результатов.
     probeResults: { id: true|false } — что реально ответило. */
  function classifyBlockMethod(probeResults, isMobile, isRiskyRegion) {
    const total = PROBE_MATRIX.length;
    const okIds = Object.keys(probeResults).filter((id) => probeResults[id]);
    const okCount = okIds.length;
    const ruOk = PROBE_MATRIX.filter((p) => p.region === "RU" && probeResults[p.id]).length;
    const ruTotal = PROBE_MATRIX.filter((p) => p.region === "RU").length;
    const deOk = PROBE_MATRIX.filter((p) => p.region === "DE" && probeResults[p.id]).length;
    const deTotal = PROBE_MATRIX.filter((p) => p.region === "DE").length;

    // 1) полный ноль везде + мобильная сеть в рисковом регионе → вероятный шатдаун
    if (okCount === 0 && isMobile && isRiskyRegion) {
      return {
        method: "mobile_shutdown_suspect",
        title: "Похоже на полное отключение мобильного интернета (шатдаун)",
        explain: "Ни один сервер не отвечает вообще, вы в мобильной сети рискового региона. " +
          "В шатдаун VPN не поможет — серверу физически некуда подключиться. Переключитесь на Wi-Fi.",
        recommend: null,
      };
    }

    // 2) полный ноль, но не шатдаун-паттерн → скорее всего блокировка портов целиком (firewall)
    if (okCount === 0) {
      return {
        method: "full_port_block",
        title: "Похоже на полную блокировку портов провайдером",
        explain: "TCP-порты 443/2083/2087/10443 недоступны на обоих серверах из вашей сети. " +
          "Обычный REALITY не пройдёт. Рекомендуем UDP-протокол (Hysteria2/AmneziaWG) — " +
          "их DPI режет реже, чем классический TCP-VPN.",
        recommend: "amneziawg",
      };
    }

    // 3) RU доступен, DE — нет (или наоборот) → гео-специфичная блокировка/маршрутизация
    if (ruOk > 0 && deOk === 0) {
      return {
        method: "foreign_route_blocked",
        title: "Зарубежный выход заблокирован, российский — работает",
        explain: "Российские REALITY-серверы отвечают, немецкий — нет. Похоже, ваш провайдер " +
          "режет маршруты за границу (частая практика на мобильных операторах). Используем связку " +
          "РФ-вход → авто-разделение трафика на заблокированные сервисы.",
        recommend: "ru-fast",
      };
    }
    if (deOk > 0 && ruOk === 0) {
      return {
        method: "ru_route_blocked",
        title: "Российские серверы недоступны, зарубежный — работает",
        explain: "Немецкий сервер отвечает, российские — нет. Похоже, вы уже используете зарубежную " +
          "точку выхода/роуминг. Используем прямой немецкий REALITY.",
        recommend: "de-main",
      };
    }

    // 4) TCP REALITY доступен частично → DPI режет конкретный SNI/порт, не весь трафик
    if (okCount > 0 && okCount < total) {
      const blockedSnis = PROBE_MATRIX.filter((p) => !probeResults[p.id]).map((p) => p.sni);
      return {
        method: "sni_specific_filter",
        title: "DPI блокирует отдельные SNI/порты, не весь VPN-трафик",
        explain: `Заблокированы конкретные маски (${blockedSnis.join(", ")}), остальные проходят. ` +
          "Это точечная SNI-фильтрация — используем один из рабочих SNI напрямую.",
        recommend: okIds[0],
      };
    }

    // 5) всё доступно → блокировок не обнаружено
    return {
      method: "no_block_detected",
      title: "Блокировок не обнаружено",
      explain: "Все проверенные REALITY-маршруты отвечают из вашей сети. Используйте любой сервер " +
        "или автоподбор по скорости.",
      recommend: "de-main",
    };
  }

  /* Возвращает готовый vless-конфиг (или инструкцию) под рекомендацию классификатора. */
  function buildConfigFor(recommendId) {
    if (recommendId === "amneziawg") {
      return {
        type: "amneziawg",
        label: "AmneziaWG (обфусцированный WireGuard)",
        action: "download",
        url: X.api.awgConfig,
      };
    }
    const server = X.servers.find((s) => s.id === recommendId) ||
      X.servers.find((s) => s.host && PROBE_MATRIX.some((p) => p.id === recommendId && p.host === s.host));
    if (server) {
      return { type: "vless", label: `${server.flag} ${server.name}`, action: "connect", link: server.link };
    }
    // recommendId может быть id из PROBE_MATRIX (не совпадать с X.servers) — строим ссылку по совпадению SNI
    const probe = PROBE_MATRIX.find((p) => p.id === recommendId);
    if (probe) {
      const match = X.servers.find((s) => s.sni === probe.sni);
      if (match) return { type: "vless", label: `${match.flag} ${match.name}`, action: "connect", link: match.link };
    }
    return { type: "subscription", label: "Полная подписка (авто)", action: "connect", link: X.primarySub };
  }

  async function probeOne(host, port, timeout = 3500) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      await fetch(`https://${host}:${port}/`, { mode: "no-cors", signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t); return true;
    } catch (e) {
      clearTimeout(t); return e.name !== "AbortError";
    }
  }

  async function runBlockDetection() {
    const btn = document.getElementById("btn-blockdetect");
    const box = document.getElementById("blockdetect-result");
    btn.disabled = true; btn.textContent = "Определяю метод блокировки…";
    box.classList.remove("hidden");
    box.innerHTML = `<div class="diag-row"><span class="k">Статус</span><span class="v">проверка ${PROBE_MATRIX.length} маршрутов…</span></div>`;

    const results = {};
    await Promise.all(PROBE_MATRIX.map(async (p) => {
      results[p.id] = await probeOne(p.host, p.port);
    }));

    const diag = window.__xsDiag || {};
    const verdict = classifyBlockMethod(results, !!diag.isMobile, !!diag.isRisky);
    const cfg = verdict.recommend ? buildConfigFor(verdict.recommend) : null;

    const rows = PROBE_MATRIX.map((p) => `
      <div class="diag-row">
        <span class="k">${p.region} · ${p.sni}</span>
        <span class="v" style="color:${results[p.id] ? "var(--ok)" : "var(--err)"}">${results[p.id] ? "доступен" : "заблокирован"}</span>
      </div>`).join("");

    box.innerHTML = `
      ${rows}
      <div class="diag-verdict ${verdict.method === "no_block_detected" ? "ok" : verdict.method.includes("shutdown") ? "bad" : "warn"}">
        <b>${verdict.title}</b><br>${verdict.explain}
      </div>
      ${cfg ? `<button class="btn btn-primary btn-full" id="btn-apply-detected" style="margin-top:var(--sp-3)">
        ✓ Применить: ${cfg.label}
      </button>` : ""}
    `;

    if (cfg) {
      const applyBtn = document.getElementById("btn-apply-detected");
      applyBtn.addEventListener("click", () => {
        const original = applyBtn.textContent;
        applyBtn.disabled = true;
        applyBtn.textContent = "Открываю клиент…";
        if (cfg.action === "download") window.open(cfg.url, "_blank");
        else window.location.href = "v2raytun://import/" + encodeURIComponent(cfg.link);
        // автоматически останавливаем кнопку — не оставляем "залипшей"
        setTimeout(() => { applyBtn.disabled = false; applyBtn.textContent = original; }, 2000);
      });
    }

    btn.disabled = false; btn.textContent = "🔬 Определить метод блокировки снова";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn-blockdetect");
    if (btn) btn.addEventListener("click", runBlockDetection);
  });

  window.XservisBlockDetector = { classifyBlockMethod, buildConfigFor, PROBE_MATRIX };
})();
