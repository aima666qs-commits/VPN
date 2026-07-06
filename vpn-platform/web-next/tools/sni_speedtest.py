#!/usr/bin/env python3
"""Xservis — честный замер TLS-handshake latency до кандидатов SNI.

ЧЕСТНОСТЬ АРХИТЕКТУРЫ: агент физически не может запустить проверку с
устройства внутри России. Поэтому измерение выполняется НА самом VPN-сервере
(там, где реально проходит трафик клиента) — это максимально приближённая
к реальности метрика: как быстро сервер устанавливает TLS-соединение с
доменом, который REALITY будет использовать как маску (SNI). Чем быстрее
и стабильнее handshake — тем меньше подозрений у DPI и тем быстрее реальное
соединение клиента (client -> наш сервер -> маскировка под этот SNI).

Запуск НА боевом сервере (RU или DE):
    python3 sni_speedtest.py --out /var/www/html/sni_report.json

Что измеряет:
    - TCP-connect время до IP домена (порт 443)
    - TLS-handshake время (полное, включая ClientHello/ServerHello)
    - поддержку TLS 1.3 (обязательно для REALITY)
    - 5 повторов на домен, берём медиану (устойчиво к разовым всплескам)
"""
import argparse
import json
import socket
import ssl
import statistics
import sys
import time

RU_SNI = [
    "yandex.ru", "ya.ru", "vk.com", "ok.ru", "mail.ru",
    "dzen.ru", "rutube.ru", "ozon.ru", "sberbank.ru", "avito.ru",
]
FOREIGN_SNI = [
    "www.cloudflare.com", "www.microsoft.com", "www.apple.com",
    "www.amazon.com", "www.google.com", "www.bing.com",
    "www.wikipedia.org", "discord.com", "www.samsung.com", "www.intel.com",
]


def measure_once(host, port=443, timeout=4.0):
    """Один замер: TCP-connect + TLS 1.3 handshake. Возвращает dict или None при ошибке."""
    ctx = ssl.create_default_context()
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2  # разрешаем оба, смотрим что реально согласуется
    t0 = time.perf_counter()
    try:
        raw = socket.create_connection((host, port), timeout=timeout)
    except Exception as e:
        return {"error": f"tcp: {e}"}
    t1 = time.perf_counter()
    try:
        tls = ctx.wrap_socket(raw, server_hostname=host)
        t2 = time.perf_counter()
        version = tls.version()
        tls.close()
    except Exception as e:
        raw.close()
        return {"error": f"tls: {e}", "tcp_ms": round((t1 - t0) * 1000, 1)}
    return {
        "tcp_ms": round((t1 - t0) * 1000, 1),
        "tls_ms": round((t2 - t1) * 1000, 1),
        "total_ms": round((t2 - t0) * 1000, 1),
        "tls_version": version,
    }


def measure_domain(domain, repeats=5):
    samples = []
    errors = []
    for _ in range(repeats):
        r = measure_once(domain)
        if "error" in r:
            errors.append(r["error"])
        else:
            samples.append(r)
    if not samples:
        return {"domain": domain, "ok": False, "error": errors[-1] if errors else "unknown", "attempts": repeats}
    totals = [s["total_ms"] for s in samples]
    return {
        "domain": domain,
        "ok": True,
        "median_ms": round(statistics.median(totals), 1),
        "min_ms": round(min(totals), 1),
        "max_ms": round(max(totals), 1),
        "success_rate": f"{len(samples)}/{repeats}",
        "tls13": any(s["tls_version"] == "TLSv1.3" for s in samples),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="sni_report.json", help="куда сохранить JSON-отчёт")
    ap.add_argument("--repeats", type=int, default=5, help="повторов на домен")
    args = ap.parse_args()

    print(f"Xservis SNI speedtest — запущено {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}", file=sys.stderr)

    results = {"ru": [], "foreign": [], "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

    for domain in RU_SNI:
        r = measure_domain(domain, args.repeats)
        results["ru"].append(r)
        status = f"{r['median_ms']}ms" if r["ok"] else f"FAIL ({r['error']})"
        print(f"  RU  {domain:24s} {status}", file=sys.stderr)

    for domain in FOREIGN_SNI:
        r = measure_domain(domain, args.repeats)
        results["foreign"].append(r)
        status = f"{r['median_ms']}ms" if r["ok"] else f"FAIL ({r['error']})"
        print(f"  INT {domain:24s} {status}", file=sys.stderr)

    # сортировка по скорости внутри каждой группы (только успешные наверх)
    for key in ("ru", "foreign"):
        results[key].sort(key=lambda r: (not r["ok"], r.get("median_ms", 99999)))

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nОтчёт сохранён: {args.out}", file=sys.stderr)

    # топ-3 по каждой группе — рекомендация для REALITY SNI
    print("\n=== РЕКОМЕНДАЦИИ (самые быстрые + TLS1.3) ===", file=sys.stderr)
    for key, label in (("ru", "RU"), ("foreign", "Зарубежные")):
        best = [r for r in results[key] if r["ok"] and r.get("tls13")][:3]
        print(f"{label}: " + ", ".join(f"{r['domain']} ({r['median_ms']}ms)" for r in best), file=sys.stderr)


if __name__ == "__main__":
    main()
