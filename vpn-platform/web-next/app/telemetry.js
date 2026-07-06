/* ============================================================================
   Xservis — расширенная телеметрия устройства (ЧЕСТНАЯ, только то, что
   реально доступно браузеру). НЕ имитирует точное определение модели телефона
   там, где браузер этого не даёт (iOS почти всегда прячет модель) — вместо
   этого показывает то, что действительно можно узнать, и явно помечает,
   когда точность ограничена платформой.

   Источники:
   - IP + гео + ASN/провайдер: ipapi.co (публичный сервис, без ключа)
   - User-Agent Client Hights (Chrome/Edge/Android): navigator.userAgentData
   - Fallback: классический navigator.userAgent парсинг (все браузеры)
   - Экран, язык, память, ядра, батарея (где API доступен), сеть (NetworkInformation)
   ============================================================================ */
(function () {
  async function getGeoIP() {
    try {
      const r = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (!r.ok) throw new Error("bad status");
      return await r.json();
    } catch (e) {
      return null; // честно: недоступно, не выдумываем IP
    }
  }

  /* Client Hints — доступны только в Chromium (Chrome/Edge/Android WebView).
     В Safari/Firefox navigator.userAgentData === undefined — честно фолбэк. */
  async function getClientHints() {
    if (!navigator.userAgentData) return null;
    try {
      const high = await navigator.userAgentData.getHighEntropyValues([
        "platform", "platformVersion", "model", "uaFullVersion",
        "fullVersionList", "architecture", "bitness", "mobile",
      ]);
      return high;
    } catch (e) {
      return null;
    }
  }

  function parseUserAgentFallback(ua) {
    // грубый, но честный парсинг: определяем только то, что действительно
    // читается из строки UA, без домыслов о точной модели устройства.
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isWindows = /Windows/.test(ua);
    const isMac = /Macintosh/.test(ua);
    const isLinux = /Linux/.test(ua) && !isAndroid;

    let os = "неизвестно";
    let osVersion = "";
    if (isIOS) {
      os = "iOS";
      const m = ua.match(/OS (\d+)_(\d+)/);
      if (m) osVersion = `${m[1]}.${m[2]}`;
    } else if (isAndroid) {
      os = "Android";
      const m = ua.match(/Android (\d+(\.\d+)?)/);
      if (m) osVersion = m[1];
    } else if (isWindows) {
      os = "Windows";
    } else if (isMac) {
      os = "macOS";
    } else if (isLinux) {
      os = "Linux";
    }

    let browser = "неизвестно";
    if (/Edg\//.test(ua)) browser = "Edge";
    else if (/OPR\//.test(ua)) browser = "Opera";
    else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
    else if (/Firefox\//.test(ua)) browser = "Firefox";
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";

    // Android иногда прокидывает модель прямо в UA после "; ": "Android 13; Pixel 7)"
    let androidModel = null;
    const am = ua.match(/Android [\d.]+;\s*([^;)]+)\)/);
    if (isAndroid && am) androidModel = am[1].trim();

    return { os, osVersion, browser, androidModel, isMobile: isIOS || isAndroid };
  }

  function getNetworkInfo() {
    // Network Information API — только Chromium/Android, честно null иначе
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return null;
    return {
      effectiveType: conn.effectiveType || null, // "4g", "3g", "2g", "slow-2g"
      downlinkMbps: conn.downlink != null ? conn.downlink : null,
      rttMs: conn.rtt != null ? conn.rtt : null,
      saveData: !!conn.saveData,
    };
  }

  async function getBatteryInfo() {
    if (!navigator.getBattery) return null; // Safari/Firefox не поддерживают — честно
    try {
      const b = await navigator.getBattery();
      return { level: Math.round(b.level * 100), charging: b.charging };
    } catch (e) { return null; }
  }

  function getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      dpr: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }

  /* ---------- собрать полный пакет телеметрии (для отображения и /diag/report) ---------- */
  async function collectFullTelemetry() {
    const [geo, hints, battery] = await Promise.all([
      getGeoIP(), getClientHints(), getBatteryInfo(),
    ]);
    const ua = navigator.userAgent;
    const fallback = parseUserAgentFallback(ua);
    const network = getNetworkInfo();
    const screen = getScreenInfo();

    return {
      ip: geo ? geo.ip : null,
      geo: geo ? {
        city: geo.city, region: geo.region, country: geo.country_name,
        countryCode: geo.country_code, lat: geo.latitude, lon: geo.longitude,
        org: geo.org, asn: geo.asn, timezone: geo.timezone,
      } : null,
      device: {
        os: (hints && hints.platform) || fallback.os,
        osVersion: (hints && hints.platformVersion) || fallback.osVersion || null,
        model: (hints && hints.model) || fallback.androidModel || null,
        modelAccuracy: hints && hints.model ? "точно (Client Hints)" :
          fallback.androidModel ? "приблизительно (из UA)" : "недоступно платформе",
        architecture: (hints && hints.architecture) || null,
        isMobile: (hints && hints.mobile) || fallback.isMobile,
        browser: fallback.browser,
      },
      network,
      battery,
      screen,
      lang: navigator.language,
      langs: navigator.languages ? navigator.languages.join(",") : navigator.language,
      cores: navigator.hardwareConcurrency || null,
      memoryGB: navigator.deviceMemory || null, // Chromium-only, честно null иначе
      collectedAt: new Date().toISOString(),
    };
  }

  function renderTelemetry(t) {
    const box = document.getElementById("telemetry-result");
    if (!box) return;
    const rows = [];
    rows.push(["IP-адрес", t.ip || "недоступно"]);
    if (t.geo) {
      rows.push(["Гео", `${t.geo.city || "?"}, ${t.geo.region || "?"}, ${t.geo.country || "?"}`]);
      rows.push(["Координаты", t.geo.lat != null ? `${t.geo.lat.toFixed(3)}, ${t.geo.lon.toFixed(3)}` : "н/д"]);
      rows.push(["Провайдер / ASN", `${t.geo.org || "н/д"} · ${t.geo.asn || ""}`]);
      rows.push(["Часовой пояс", t.geo.timezone || "н/д"]);
    } else {
      rows.push(["Гео", "сервис геолокации недоступен"]);
    }
    rows.push(["ОС", `${t.device.os}${t.device.osVersion ? " " + t.device.osVersion : ""}`]);
    rows.push(["Модель устройства", `${t.device.model || "не определена"} (${t.device.modelAccuracy})`]);
    rows.push(["Браузер", t.device.browser]);
    rows.push(["Тип устройства", t.device.isMobile ? "мобильное" : "десктоп"]);
    if (t.network) {
      rows.push(["Тип сети", t.network.effectiveType || "н/д"]);
      rows.push(["Скорость (оценка)", t.network.downlinkMbps != null ? `${t.network.downlinkMbps} Мбит/с` : "н/д"]);
      rows.push(["RTT", t.network.rttMs != null ? `${t.network.rttMs} мс` : "н/д"]);
    } else {
      rows.push(["Тип сети", "API недоступен в этом браузере"]);
    }
    if (t.battery) rows.push(["Батарея", `${t.battery.level}%${t.battery.charging ? " (заряжается)" : ""}`]);
    rows.push(["Экран", `${t.screen.width}×${t.screen.height} @${t.screen.dpr}x`]);
    rows.push(["Ядер CPU", t.cores || "н/д"]);
    rows.push(["Память устройства", t.memoryGB != null ? `~${t.memoryGB} ГБ` : "н/д (не Chromium)"]);
    rows.push(["Язык", t.lang]);

    box.innerHTML = rows.map(([k, v]) => `
      <div class="diag-row"><span class="k">${k}</span><span class="v">${v}</span></div>
    `).join("");
  }

  async function runFullTelemetry() {
    const btn = document.getElementById("btn-telemetry");
    const box = document.getElementById("telemetry-result");
    btn.disabled = true; btn.textContent = "Собираю данные…";
    box.classList.remove("hidden");
    box.innerHTML = `<div class="diag-row"><span class="k">Статус</span><span class="v">запрос IP/гео/устройства…</span></div>`;

    const t = await collectFullTelemetry();
    renderTelemetry(t);
    window.__xsTelemetry = t;

    btn.disabled = false; btn.textContent = "🧾 Обновить полную информацию";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn-telemetry");
    if (btn) btn.addEventListener("click", runFullTelemetry);
  });

  window.XservisTelemetry = { collectFullTelemetry };
})();
