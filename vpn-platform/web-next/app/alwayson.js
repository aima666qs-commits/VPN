/* ============================================================================
   Xservis — "Всегда на связи" (Always-On): приоритетные кнопки
   WhatsApp / YouTube / Telegram / Instagram.

   ЧЕСТНАЯ логика: реально пробует маршруты из X.alwaysOn[].chain по очереди
   (TCP REALITY варианты), показывает пользователю какой конкретно маршрут
   сработал, и открывает клиент именно на нём. UDP-маршруты (AmneziaWG) и
   MTProto из браузера напрямую не проверяются — честно предлагаются как
   следующий шаг, если TCP-цепочка исчерпана.

   НИКАКИХ обещаний "100% всегда работает" — см. README/презентацию,
   раздел "Честно о пределах": полной гарантии не даёт ни один VPN в мире,
   т.к. ТСПУ технически может заблокировать конкретный маршрут в любой
   момент. Многоуровневый fallback — лучшее, что можно сделать технически.
   ============================================================================ */
(function () {
  const X = window.XSERVIS;

  async function probePort(host, port, timeout = 3000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      await fetch(`https://${host}:${port}/`, { mode: "no-cors", signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t); return true;
    } catch (e) {
      clearTimeout(t); return e.name !== "AbortError";
    }
  }

  function serverById(id) {
    return X.servers.find((s) => s.id === id);
  }

  function renderCards() {
    const wrap = document.getElementById("alwayson-grid");
    if (!wrap) return;
    wrap.innerHTML = X.alwaysOn.map((svc) => `
      <div class="ao-card" data-svc="${svc.id}">
        <div class="ao-head">
          <span class="ao-ico">${svc.ico}</span>
          <span class="ao-label">${svc.label}</span>
          <span class="ao-status" id="ao-status-${svc.id}" title="не проверено">●</span>
        </div>
        <div class="ao-why">${svc.why}</div>
        <button class="btn btn-primary btn-full ao-connect" data-svc="${svc.id}">Подключить ${svc.label}</button>
        <div class="ao-chain hidden" id="ao-chain-${svc.id}"></div>
      </div>`).join("");

    wrap.querySelectorAll(".ao-connect").forEach((btn) => {
      btn.addEventListener("click", () => connectService(btn.dataset.svc));
    });
  }

  async function connectService(svcId) {
    const svc = X.alwaysOn.find((s) => s.id === svcId);
    if (!svc) return;
    const btn = document.querySelector(`.ao-connect[data-svc="${svcId}"]`);
    const statusDot = document.getElementById(`ao-status-${svcId}`);
    const chainBox = document.getElementById(`ao-chain-${svcId}`);
    btn.disabled = true; const oldText = btn.textContent;
    btn.textContent = `Ищу рабочий маршрут для ${svc.label}…`;
    statusDot.className = "ao-status checking";
    chainBox.classList.remove("hidden");
    chainBox.innerHTML = "";

    let winner = null;
    for (const route of svc.chain) {
      const row = document.createElement("div");
      row.className = "ao-route try";
      row.innerHTML = `<span class="dot"></span><span>${route.desc}…</span>`;
      chainBox.appendChild(row);

      if (route.kind === "reality-tcp" || route.kind === "reality-grpc" || route.kind === "reality-xhttp") {
        const server = serverById(route.serverId);
        if (!server) { row.className = "ao-route skip"; row.innerHTML += " (маршрут не настроен)"; continue; }
        const ok = await probePort(server.host, server.port);
        if (ok) {
          row.className = "ao-route ok";
          row.innerHTML = `<span class="dot"></span><span>${route.desc} — работает ✓</span>`;
          winner = { route, server };
          break;
        } else {
          row.className = "ao-route skip";
          row.innerHTML = `<span class="dot"></span><span>${route.desc} — недоступен, пробую дальше</span>`;
        }
      } else if (route.kind === "amneziawg-udp") {
        row.className = "ao-route skip";
        row.innerHTML = `<span class="dot"></span><span>${route.desc} — UDP, браузер проверить не может.
          <a href="${X.api.awgConfig}" style="color:var(--accent)">Скачать конфиг →</a></span>`;
      } else if (route.kind === "mtproto") {
        row.className = "ao-route skip";
        row.innerHTML = `<span class="dot"></span><span>${route.desc} — встроенный резерв Telegram, настраивается в самом приложении Telegram (Настройки → Данные и память → Прокси)</span>`;
      }
    }

    if (winner) {
      statusDot.className = "ao-status ok"; statusDot.title = "рабочий маршрут найден";
      btn.textContent = `✓ ${svc.label} через ${winner.route.desc} — открываю клиент…`;
      window.location.href = "v2raytun://import/" + encodeURIComponent(winner.server.link);
    } else {
      statusDot.className = "ao-status bad"; statusDot.title = "TCP-маршруты недоступны";
      btn.textContent = `TCP не прошёл — см. UDP/MTProto ниже`;
    }
    // автоматически останавливаем кнопку и возвращаем в исходное состояние —
    // и при успехе, и при неудаче, чтобы можно было нажать повторно
    setTimeout(() => { btn.disabled = false; btn.textContent = oldText; }, 2500);
  }

  document.addEventListener("DOMContentLoaded", renderCards);
  window.XservisAlwaysOn = { connectService };
})();
