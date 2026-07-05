/* ============================================================================
   Xservis — меню настроек: живое переключение 6 тем + reduced-motion.
   Сохраняет выбор в localStorage (xservis-theme, xservis-rm).
   Использование:
     XservisThemer.init({ defaultTheme: "aurora-glass", lockToPage: false })
   lockToPage=true — экран форсит свою тему, но переключатель всё равно работает.
   ============================================================================ */
(function () {
  const LS_THEME = "xservis-theme";
  const LS_RM = "xservis-rm";

  function applyTheme(id) {
    document.documentElement.setAttribute("data-theme", id);
  }
  function applyRM(on) {
    document.documentElement.classList.toggle("rm", !!on);
  }

  function buildPanel(current) {
    const themes = window.XSERVIS_THEMES || [];
    const rmOn = localStorage.getItem(LS_RM) === "1";

    const backdrop = document.createElement("div");
    backdrop.className = "settings-backdrop";
    backdrop.id = "xs-settings-backdrop";

    const panel = document.createElement("div");
    panel.className = "settings-panel";
    panel.id = "xs-settings-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Настройки внешнего вида");

    panel.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom:var(--sp-4)">
        <h3>Настройки дизайна</h3>
        <button class="gear" id="xs-settings-close" aria-label="Закрыть">✕</button>
      </div>
      <div class="hint">Тема применяется мгновенно и сохраняется в этом браузере.</div>
      <div class="theme-list" id="xs-theme-list"></div>
      <div class="toggle-row">
        <span>Уменьшить анимацию</span>
        <button class="switch ${rmOn ? "on" : ""}" id="xs-rm-switch" role="switch" aria-checked="${rmOn}" aria-label="Уменьшить анимацию"></button>
      </div>
      <div class="hint" style="margin-top:var(--sp-4)" id="xs-back-link"></div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    // Ссылка "назад к хабу" только на страницах концепций (в /design/)
    const backHost = panel.querySelector("#xs-back-link");
    if (/\/design\//.test(location.pathname)) {
      backHost.innerHTML = '<a href="../../index.html" style="color:var(--accent)">← Все 6 концепций</a>';
    }

    const list = panel.querySelector("#xs-theme-list");
    themes.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "theme-opt" + (t.id === current ? " active" : "");
      btn.dataset.theme = t.id;
      btn.innerHTML = `
        <span class="sw" style="background:${t.sw}"></span>
        <span>
          <span class="t-name">${t.name}</span><br>
          <span class="t-desc">${t.desc}</span>
        </span>`;
      btn.addEventListener("click", () => {
        applyTheme(t.id);
        localStorage.setItem(LS_THEME, t.id);
        list.querySelectorAll(".theme-opt").forEach((n) => n.classList.remove("active"));
        btn.classList.add("active");
      });
      list.appendChild(btn);
    });

    const rmSwitch = panel.querySelector("#xs-rm-switch");
    rmSwitch.addEventListener("click", () => {
      const now = !rmSwitch.classList.contains("on");
      rmSwitch.classList.toggle("on", now);
      rmSwitch.setAttribute("aria-checked", String(now));
      localStorage.setItem(LS_RM, now ? "1" : "0");
      applyRM(now);
    });

    function open() { backdrop.classList.add("open"); panel.classList.add("open"); }
    function close() { backdrop.classList.remove("open"); panel.classList.remove("open"); }
    backdrop.addEventListener("click", close);
    panel.querySelector("#xs-settings-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    return { open, close };
  }

  window.XservisThemer = {
    init(opts) {
      opts = opts || {};
      const saved = localStorage.getItem(LS_THEME);
      // lockToPage: экран задаёт тему по умолчанию, но сохранённый выбор имеет приоритет
      const initial = saved || opts.defaultTheme || "aurora-glass";
      applyTheme(initial);
      applyRM(localStorage.getItem(LS_RM) === "1");

      const controls = buildPanel(initial);
      const gear = document.getElementById("xs-gear");
      if (gear) gear.addEventListener("click", controls.open);
      this._controls = controls;
      return controls;
    },
    set(id) {
      applyTheme(id);
      localStorage.setItem(LS_THEME, id);
    },
  };
})();
