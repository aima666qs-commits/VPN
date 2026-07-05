#!/usr/bin/env python3
"""Локальный статический сервер для web-next (design showcase Xservis).

Запуск:
    cd C:\\Users\\kkkj\\vpn-platform\\web-next
    python serve.py            # порт 4300 по умолчанию
    python serve.py 4310       # свой порт

Открыть: http://localhost:4300/  (хаб 6 концепций)
Preview-routes:
    /design/aurora-glass/     /design/liquid-metal/
    /design/cyber-lux/        /design/calm-enterprise/
    /design/spatial-orbit/    /design/neo-editorial/
"""
import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4300
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Xservis design showcase -> http://localhost:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
