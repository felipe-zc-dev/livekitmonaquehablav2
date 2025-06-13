"""Minimal health‑check HTTP server for Render/K8s."""

from __future__ import annotations

import json
import logging
import os
import signal
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, cast

import psutil

logger = logging.getLogger(__name__)
JSON_BYTES = bytes | bytearray


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def worker_load() -> float:
    """Return current normalized load [0‑1] based on CPU and RAM."""
    cpu = cast(float, psutil.cpu_percent()) / 100
    ram = cast(float, psutil.virtual_memory().percent) / 100
    return max(cpu, ram)


def _json_body(payload: dict[str, str]) -> JSON_BYTES:
    return json.dumps(payload).encode()


# --------------------------------------------------------------------------- #
# HTTP handler
# --------------------------------------------------------------------------- #
class HealthCheckHandler(BaseHTTPRequestHandler):
    """Serve /health endpoint for liveness & readiness probes."""

    server_version = sys_version = ""  # hide “BaseHTTP/0.6”

    # pylint: disable=invalid-name
    def do_GET(self) -> None:  # noqa: N802
        """Handle GET request."""
        if self.path == "/health":
            status = "ok" if worker_load() < 0.90 else "busy"
            code = 200 if status == "ok" else 503
            body = _json_body({"status": status})

            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)
            return

        self.send_error(404, json.dumps({"status": "not found"}))

    # pylint: enable=invalid-name

    # pylint: disable=arguments-differ
    def log_message(self, fmt: str, *args: Any) -> None:  # noqa: D401
        """Silence /health logs but keep others for debugging."""
        if self.path != "/health":
            logger.debug(fmt, *args)


# --------------------------------------------------------------------------- #
# server orchestration
# --------------------------------------------------------------------------- #
def run_health_server(port: int | None = None, handle_signals: bool = True) -> None:
    """Run ThreadingHTTPServer until SIGTERM or KeyboardInterrupt."""
    port = port or int(os.getenv("PORT", "8081"))
    server = ThreadingHTTPServer(("0.0.0.0", port), HealthCheckHandler)  # noqa: S104
    logger.info("Health‑check server listening on :%s", port)

    def _shutdown(*_: object) -> None:  # noqa: D401
        logger.info("Stopping health‑check server")
        server.shutdown()

    if handle_signals:
        signal.signal(signal.SIGTERM, _shutdown)

    try:
        server.serve_forever()
    finally:
        server.server_close()


def start_health_server(port: int | None = None) -> threading.Thread:
    """Lanza el servidor en un hilo *daemon* sin registrar señales."""
    thread = threading.Thread(
        target=run_health_server,
        kwargs={"port": port, "handle_signals": False},
        daemon=True,
    )
    thread.start()
    return thread
