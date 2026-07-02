/* ============================================================================
   AiMA VPN — рендер общего главного экрана (экран подключения).
   Все 6 концепций вызывают AimaConnect.render("#mount").
   Декоративный фон каждой темы добавляется отдельно в её index.html.
   ============================================================================ */
(function () {
  const d = window.AIMA_CONNECT;

  const STATE_LABEL = {
    disconnected: { label: "Подключить", sub: "Отключено" },
    connecting:   { label: "Подключение", sub: "Соединение…" },
    connected:    { label: "Отключить", sub: "Защищено" },
  };

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function coreMarkup(state) {
    const s = STATE_LABEL[state];
    return `
      <div class="connect-core" data-state="${state}" id="aima-core" role="button" tabindex="0"
           aria-label="${s.label}">
        <span class="ring"></span>
        <span class="pulse"></span>
        <div class="text-center">
          <div class="label">${s.label}</div>
          <div class="sub">${s.sub}</div>
        </div>
      </div>`;
  }

  function render(mountSel) {
    const mount = document.querySelector(mountSel);
    if (!mount) return;

    mount.innerHTML = `
      <header class="topbar reveal">
        <div class="brand">
          <span class="mark">X</span>
          <span class="name">${d.brand.name}<b>${d.brand.accent}</b></span>
        </div>
        <button class="gear" id="aima-gear" aria-label="Настройки">⚙</button>
      </header>

      <div class="connect-wrap reveal d1">
        ${coreMarkup(d.state)}
      </div>

      <div class="server-row reveal d1">
        <div class="flex items-center gap-3">
          <span class="flag">${d.server.flag}</span>
          <div>
            <div class="s-name">${d.server.name}</div>
            <div class="s-meta">${d.server.meta}</div>
          </div>
        </div>
        <div class="node-toggle">
          ${d.nodes.list.map((n, i) =>
            `<span class="node ${i === d.nodes.active - 1 ? "active" : ""}">${n}</span>`).join("")}
        </div>
      </div>

      <button class="btn btn-ghost btn-full reveal d2" id="aima-auto" style="margin-top:var(--sp-3)">
        ⚡ Авто-выбор лучшего маршрута
      </button>

      <div class="metrics reveal d2">
        <div class="metric">
          <div class="k">Ping</div>
          <div class="v" id="m-ping">${d.metrics.ping}<small> мс</small></div>
        </div>
        <div class="metric">
          <div class="k">Скорость</div>
          <div class="v" id="m-speed">${d.metrics.speed}<small> Мбит/с</small></div>
        </div>
        <div class="metric">
          <div class="k">Протокол</div>
          <div class="v" style="font-size:var(--fs-md)">${d.metrics.protocol}</div>
        </div>
        <div class="metric">
          <div class="k">Подписка ${d.subscription.plan}</div>
          <div class="v">${d.subscription.daysLeft}<small> дн.</small></div>
        </div>
      </div>

      <div class="quick reveal d3">
        ${d.quick.map((q) =>
          `<a href="#" aria-label="${q.label}"><span class="ico">${q.ico}</span>${q.label}</a>`).join("")}
      </div>

      <div class="subinfo reveal d4">
        <span>Устройства: <b>${d.subscription.devices}/${d.subscription.devicesMax}</b></span>
        <span>Тариф <b>${d.subscription.plan}</b> · <b>${d.subscription.daysLeft} дн.</b></span>
      </div>
    `;

    wireInteractions();
    animateCounters();
  }

  function wireInteractions() {
    const core = document.getElementById("aima-core");
    if (!core) return;
    const order = ["disconnected", "connecting", "connected"];
    core.addEventListener("click", () => {
      const cur = core.getAttribute("data-state");
      let next;
      if (cur === "connected") next = "disconnected";
      else if (cur === "disconnected") next = "connecting";
      else next = "connected";
      setState(core, next);
      // авто-переход connecting → connected
      if (next === "connecting") {
        setTimeout(() => {
          if (core.getAttribute("data-state") === "connecting") setState(core, "connected");
        }, 1200);
      }
    });
    core.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); core.click(); }
    });
  }

  function setState(core, state) {
    const s = STATE_LABEL[state];
    core.setAttribute("data-state", state);
    core.setAttribute("aria-label", s.label);
    core.querySelector(".label").textContent = s.label;
    core.querySelector(".sub").textContent = s.sub;
  }

  function animateCounters() {
    const rm = document.documentElement.classList.contains("rm") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rm) return;
    countUp(document.getElementById("m-ping"), d.metrics.ping, " мс");
    countUp(document.getElementById("m-speed"), d.metrics.speed, " Мбит/с");
  }

  function countUp(node, target, unit) {
    if (!node) return;
    const start = performance.now();
    const dur = 900;
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      node.innerHTML = `${val}<small>${unit}</small>`;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.AimaConnect = { render };
})();
