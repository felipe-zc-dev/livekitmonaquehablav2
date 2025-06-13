"""
Sistema de monitoreo específico para Render Pro.
CORREGIDO: Type hints y API de LiveKit 1.0.
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any

import psutil
from livekit.agents import metrics
from livekit.agents.voice import MetricsCollectedEvent

logger = logging.getLogger(__name__)


@dataclass
class RenderProMetrics:
    """Métricas específicas para Render Pro."""

    # System metrics
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_available_mb: int = 0

    # Peak tracking
    peak_cpu: float = 0.0
    peak_memory: float = 0.0

    # Timing
    uptime_seconds: float = 0.0
    last_update: float = field(default_factory=time.time)

    # Counters
    total_requests: int = 0
    rejected_requests: int = 0
    active_sessions: int = 0

    # Thresholds
    cpu_warning_threshold: float = 70.0
    cpu_critical_threshold: float = 85.0
    memory_warning_threshold: float = 75.0
    memory_critical_threshold: float = 90.0


class RenderProMonitor:
    """Monitor de rendimiento específico para Render Pro 2CPU/4GB."""

    def __init__(self, log_interval: int = 30) -> None:
        """
        Inicializa el monitor.

        Args:
            log_interval: Intervalo en segundos para logging de métricas
        """
        self.start_time = time.time()
        self.log_interval = log_interval
        self.metrics = RenderProMetrics()
        self.usage_collector = metrics.UsageCollector()
        # ✅ CORREGIDO: Type parameters específicos para Task
        self._monitoring_task: asyncio.Task[None] | None = None
        self._alerts_sent: dict[str, float] = {}  # Cooldown para alertas

        logger.info("🔍 Render Pro Monitor initialized")

    def start_monitoring(self) -> None:
        """Inicia el monitoreo en background."""
        if self._monitoring_task is None or self._monitoring_task.done():
            self._monitoring_task = asyncio.create_task(self._monitor_loop())
            logger.info("▶️ Monitoring started")

    def stop_monitoring(self) -> None:
        """Detiene el monitoreo."""
        if self._monitoring_task and not self._monitoring_task.done():
            self._monitoring_task.cancel()
            logger.info("⏹️ Monitoring stopped")

    async def _monitor_loop(self) -> None:
        """Loop principal de monitoreo."""
        while True:
            try:
                await self._update_metrics()
                await self._check_alerts()
                await self._log_metrics()

                await asyncio.sleep(self.log_interval)

            except asyncio.CancelledError:
                logger.info("Monitor loop cancelled")
                break
            except Exception as e:
                logger.error("Monitor loop error: %s", str(e))
                await asyncio.sleep(60)  # Espera más tiempo si hay error

    async def _update_metrics(self) -> None:
        """Actualiza las métricas del sistema."""
        try:
            # CPU metrics
            self.metrics.cpu_percent = psutil.cpu_percent(interval=0.1)
            self.metrics.peak_cpu = max(self.metrics.peak_cpu, self.metrics.cpu_percent)

            # Memory metrics
            memory = psutil.virtual_memory()
            self.metrics.memory_percent = memory.percent
            self.metrics.memory_available_mb = memory.available // 1024 // 1024
            self.metrics.peak_memory = max(self.metrics.peak_memory, self.metrics.memory_percent)

            # Timing
            self.metrics.uptime_seconds = time.time() - self.start_time
            self.metrics.last_update = time.time()

        except Exception as e:
            logger.error("Error updating metrics: %s", str(e))

    async def _check_alerts(self) -> None:
        """Verifica y envía alertas si es necesario."""
        current_time = time.time()

        # CPU alerts
        if self.metrics.cpu_percent >= self.metrics.cpu_critical_threshold:
            await self._send_alert(
                "cpu_critical",
                f"🔥 CRITICAL CPU: {self.metrics.cpu_percent:.1f}% "
                f"(Peak: {self.metrics.peak_cpu:.1f}%)",
                current_time,
                cooldown=300,  # 5 min cooldown
            )
        elif self.metrics.cpu_percent >= self.metrics.cpu_warning_threshold:
            await self._send_alert(
                "cpu_warning",
                f"⚠️ HIGH CPU: {self.metrics.cpu_percent:.1f}% (Peak: {self.metrics.peak_cpu:.1f}%)",
                current_time,
                cooldown=60,  # 1 min cooldown
            )

        # Memory alerts
        if self.metrics.memory_percent >= self.metrics.memory_critical_threshold:
            await self._send_alert(
                "memory_critical",
                f"💾 CRITICAL MEMORY: {self.metrics.memory_percent:.1f}% "
                f"(Available: {self.metrics.memory_available_mb}MB)",
                current_time,
                cooldown=300,
            )
        elif self.metrics.memory_percent >= self.metrics.memory_warning_threshold:
            await self._send_alert(
                "memory_warning",
                f"⚠️ HIGH MEMORY: {self.metrics.memory_percent:.1f}% "
                f"(Available: {self.metrics.memory_available_mb}MB)",
                current_time,
                cooldown=60,
            )

    async def _send_alert(
        self, alert_type: str, message: str, current_time: float, cooldown: int
    ) -> None:
        """
        Envía una alerta con cooldown.

        Args:
            alert_type: Tipo de alerta
            message: Mensaje de alerta
            current_time: Timestamp actual
            cooldown: Cooldown en segundos
        """
        last_sent = self._alerts_sent.get(alert_type, 0)

        if current_time - last_sent >= cooldown:
            logger.warning(message)
            self._alerts_sent[alert_type] = current_time

    async def _log_metrics(self) -> None:
        """Log métricas normales."""
        logger.info(
            "📊 Render Pro Stats - Uptime: %.0fs, CPU: %.1f%%, Memory: %.1f%%, "
            "Available: %dMB, Sessions: %d",
            self.metrics.uptime_seconds,
            self.metrics.cpu_percent,
            self.metrics.memory_percent,
            self.metrics.memory_available_mb,
            self.metrics.active_sessions,
        )

    def on_metrics_collected(self, event: MetricsCollectedEvent) -> None:
        """
        Callback para eventos de métricas de LiveKit.

        Args:
            event: Evento de métricas de LiveKit
        """
        try:
            # Recopilar métricas de uso
            self.usage_collector.collect(event.metrics)

            # Log métricas de LiveKit
            metrics.log_metrics(event.metrics)

            # ✅ CORREGIDO: UsageCollector no tiene get_total_usage()
            # En LiveKit 1.0, las métricas se procesan diferente
            if int(time.time()) % 300 == 0:  # Cada 5 minutos
                logger.info("💰 LiveKit metrics collected: %s", event.metrics)

        except Exception as e:
            logger.error("Error processing metrics event: %s", str(e))

    def increment_request_counter(self) -> None:
        """Incrementa el contador de requests."""
        self.metrics.total_requests += 1

    def increment_rejected_counter(self) -> None:
        """Incrementa el contador de requests rechazados."""
        self.metrics.rejected_requests += 1

    def set_active_sessions(self, count: int) -> None:
        """Establece el número de sesiones activas."""
        self.metrics.active_sessions = count

    def get_health_status(self) -> dict[str, Any]:
        """
        Retorna el estado de salud del sistema.

        Returns:
            Estado de salud con métricas
        """
        # Determinar estado de salud
        if (
            self.metrics.cpu_percent >= self.metrics.cpu_critical_threshold
            or self.metrics.memory_percent >= self.metrics.memory_critical_threshold
        ):
            status = "critical"
        elif (
            self.metrics.cpu_percent >= self.metrics.cpu_warning_threshold
            or self.metrics.memory_percent >= self.metrics.memory_warning_threshold
        ):
            status = "warning"
        else:
            status = "healthy"

        return {
            "status": status,
            "timestamp": time.time(),
            "uptime_seconds": self.metrics.uptime_seconds,
            "system": {
                "cpu_percent": self.metrics.cpu_percent,
                "memory_percent": self.metrics.memory_percent,
                "memory_available_mb": self.metrics.memory_available_mb,
                "peak_cpu": self.metrics.peak_cpu,
                "peak_memory": self.metrics.peak_memory,
            },
            "application": {
                "total_requests": self.metrics.total_requests,
                "rejected_requests": self.metrics.rejected_requests,
                "active_sessions": self.metrics.active_sessions,
                "rejection_rate": (
                    self.metrics.rejected_requests / max(self.metrics.total_requests, 1) * 100
                ),
            },
            "thresholds": {
                "cpu_warning": self.metrics.cpu_warning_threshold,
                "cpu_critical": self.metrics.cpu_critical_threshold,
                "memory_warning": self.metrics.memory_warning_threshold,
                "memory_critical": self.metrics.memory_critical_threshold,
            },
        }

    def get_performance_summary(self) -> str:
        """
        Retorna un resumen de rendimiento formateado.

        Returns:
            Resumen de rendimiento
        """
        health = self.get_health_status()

        return (
            f"🏥 Render Pro Health: {health['status'].upper()}\n"
            f"⏱️ Uptime: {health['uptime_seconds']:.0f}s\n"
            f"🖥️ CPU: {health['system']['cpu_percent']:.1f}% "
            f"(Peak: {health['system']['peak_cpu']:.1f}%)\n"
            f"💾 Memory: {health['system']['memory_percent']:.1f}% "
            f"(Available: {health['system']['memory_available_mb']}MB)\n"
            f"📊 Sessions: {health['application']['active_sessions']}\n"
            f"📈 Requests: {health['application']['total_requests']} "
            f"(Rejected: {health['application']['rejection_rate']:.1f}%)"
        )


# ✅ CORREGIDO: Evitar global usando Singleton pattern
class _MonitorSingleton:
    """Singleton para el monitor global."""

    _instance: RenderProMonitor | None = None

    @classmethod
    def get_instance(cls) -> RenderProMonitor:
        """Obtiene la instancia global del monitor."""
        if cls._instance is None:
            cls._instance = RenderProMonitor()
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Resetea la instancia (útil para tests)."""
        if cls._instance and cls._instance._monitoring_task:
            cls._instance.stop_monitoring()
        cls._instance = None


def get_monitor() -> RenderProMonitor:
    """
    Obtiene la instancia global del monitor.
    ✅ CORREGIDO: Sin global statement.
    """
    return _MonitorSingleton.get_instance()


def start_monitoring() -> None:
    """Inicia el monitoreo global."""
    monitor = get_monitor()
    monitor.start_monitoring()


def stop_monitoring() -> None:
    """Detiene el monitoreo global."""
    monitor = get_monitor()
    monitor.stop_monitoring()
