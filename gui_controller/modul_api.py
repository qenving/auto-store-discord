"""
API Controller Module
Manages FastAPI server lifecycle and status
"""

import subprocess
import threading
import time
import requests
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict

from .utils import log_event


class APIController:
    """Controls FastAPI server process"""

    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "offline"  # offline, starting, running, maintenance, crashed
        self.mode = "normal"  # normal, maintenance
        self.start_time: Optional[datetime] = None
        self.port = 3001
        self.request_count = 0

        # Lock for thread safety
        self.lock = threading.Lock()

    def start(self):
        """Start FastAPI server"""
        with self.lock:
            if self.process and self.process.poll() is None:
                log_event("API", "Already running", "WARNING")
                return False

            try:
                log_event("API", "Starting FastAPI server...", "INFO")
                self.status = "starting"

                # Start API process
                self.process = subprocess.Popen(
                    ["python", "-m", "src.api.main"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    cwd=str(Path(__file__).parent.parent)
                )

                # Wait for API to be ready
                time.sleep(3)

                # Check if running
                if self.process.poll() is None:
                    # Try to ping API
                    if self._check_health():
                        self.status = "running"
                        self.mode = "normal"
                        self.start_time = datetime.now()
                        log_event("API", "FastAPI server started successfully", "SUCCESS")

                        # Start output monitoring
                        threading.Thread(target=self._monitor_output, daemon=True).start()

                        return True
                    else:
                        self.status = "starting"
                        log_event("API", "API starting but not yet ready...", "INFO")
                        return True
                else:
                    # Process died
                    self.status = "crashed"
                    stderr = self.process.stderr.read() if self.process.stderr else "Unknown error"
                    log_event("API", f"Failed to start: {stderr}", "ERROR")
                    return False

            except Exception as e:
                self.status = "crashed"
                log_event("API", f"Start error: {e}", "ERROR")
                return False

    def stop(self):
        """Stop FastAPI server"""
        with self.lock:
            if not self.process or self.process.poll() is not None:
                log_event("API", "Not running", "WARNING")
                self.status = "offline"
                return False

            try:
                log_event("API", "Stopping FastAPI server...", "INFO")

                # Terminate gracefully
                self.process.terminate()

                # Wait up to 5 seconds
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # Force kill
                    log_event("API", "Force killing API process...", "WARNING")
                    self.process.kill()
                    self.process.wait()

                self.status = "offline"
                self.mode = "normal"
                self.start_time = None
                log_event("API", "FastAPI server stopped", "SUCCESS")
                return True

            except Exception as e:
                log_event("API", f"Stop error: {e}", "ERROR")
                return False

    def enter_maintenance(self):
        """Enter maintenance mode"""
        with self.lock:
            self.mode = "maintenance"
            self.status = "maintenance"
            log_event("API", "API entered maintenance mode", "WARNING")
            return True

    def exit_maintenance(self):
        """Exit maintenance mode"""
        with self.lock:
            if self.mode != "maintenance":
                return False

            self.mode = "normal"
            self.status = "running" if self.process and self.process.poll() is None else "offline"
            log_event("API", "API exited maintenance mode", "INFO")
            return True

    def get_status(self) -> Dict[str, any]:
        """Get current API status"""
        with self.lock:
            uptime = self._get_uptime()
            health = "healthy" if self._check_health() else "unhealthy"

            return {
                "status": self.status,
                "mode": self.mode,
                "uptime": uptime,
                "port": self.port,
                "requests": self.request_count,
                "health": health,
                "pid": self.process.pid if self.process else None,
                "is_alive": self.process.poll() is None if self.process else False
            }

    def _get_uptime(self) -> str:
        """Calculate uptime"""
        if not self.start_time or self.status == "offline":
            return "--"

        uptime = datetime.now() - self.start_time

        days = uptime.days
        hours, remainder = divmod(uptime.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        else:
            return f"{minutes}m {seconds}s"

    def _check_health(self) -> bool:
        """Check if API is responding"""
        try:
            response = requests.get(f"http://localhost:{self.port}/health", timeout=2)
            return response.status_code == 200
        except:
            return False

    def _monitor_output(self):
        """Monitor API process output"""
        try:
            while self.process and self.process.poll() is None:
                # Read stdout
                if self.process.stdout:
                    line = self.process.stdout.readline()
                    if line:
                        # Could parse for request count, errors, etc.
                        pass

                time.sleep(0.1)

            # Process ended
            if self.status != "offline":
                self.status = "crashed"
                log_event("API", "API process ended unexpectedly", "ERROR")

        except Exception as e:
            log_event("API", f"Output monitor error: {e}", "ERROR")

    def restart(self):
        """Restart API"""
        log_event("API", "Restarting API...", "INFO")
        self.stop()
        time.sleep(2)
        return self.start()
