"""
Bot Controller Module
Manages Discord bot lifecycle and status
"""

import subprocess
import threading
import time
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict

from .utils import log_event


class BotController:
    """Controls Discord bot process"""

    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "offline"  # offline, starting, running, paused, maintenance, crashed
        self.mode = "normal"  # normal, paused, maintenance
        self.start_time: Optional[datetime] = None
        self.command_count = 0
        self.guild_name = "--"

        # Lock for thread safety
        self.lock = threading.Lock()

    def start(self):
        """Start Discord bot"""
        with self.lock:
            if self.process and self.process.poll() is None:
                log_event("Bot", "Already running", "WARNING")
                return False

            try:
                log_event("Bot", "Starting Discord bot...", "INFO")
                self.status = "starting"

                # Start bot process
                self.process = subprocess.Popen(
                    ["python", "-m", "src.bot.main"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    cwd=str(Path(__file__).parent.parent)
                )

                # Wait a moment to check if it started
                time.sleep(2)

                if self.process.poll() is None:
                    # Still running
                    self.status = "running"
                    self.mode = "normal"
                    self.start_time = datetime.now()
                    log_event("Bot", "Discord bot started successfully", "SUCCESS")

                    # Start output monitoring thread
                    threading.Thread(target=self._monitor_output, daemon=True).start()

                    return True
                else:
                    # Process died
                    self.status = "crashed"
                    stderr = self.process.stderr.read() if self.process.stderr else "Unknown error"
                    log_event("Bot", f"Failed to start: {stderr}", "ERROR")
                    return False

            except Exception as e:
                self.status = "crashed"
                log_event("Bot", f"Start error: {e}", "ERROR")
                return False

    def stop(self):
        """Stop Discord bot"""
        with self.lock:
            if not self.process or self.process.poll() is not None:
                log_event("Bot", "Not running", "WARNING")
                self.status = "offline"
                return False

            try:
                log_event("Bot", "Stopping Discord bot...", "INFO")

                # Terminate gracefully
                self.process.terminate()

                # Wait up to 5 seconds
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # Force kill if not stopped
                    log_event("Bot", "Force killing bot process...", "WARNING")
                    self.process.kill()
                    self.process.wait()

                self.status = "offline"
                self.mode = "normal"
                self.start_time = None
                log_event("Bot", "Discord bot stopped", "SUCCESS")
                return True

            except Exception as e:
                log_event("Bot", f"Stop error: {e}", "ERROR")
                return False

    def pause(self):
        """Pause bot (stop accepting commands)"""
        with self.lock:
            if self.status != "running":
                return False

            self.mode = "paused"
            self.status = "paused"
            log_event("Bot", "Bot paused (not accepting commands)", "INFO")

            # Note: Actual pause implementation would require bot support
            # For now, this is a status change only
            return True

    def resume(self):
        """Resume bot from pause"""
        with self.lock:
            if self.status != "paused":
                return False

            self.mode = "normal"
            self.status = "running"
            log_event("Bot", "Bot resumed", "INFO")
            return True

    def enter_maintenance(self):
        """Enter maintenance mode"""
        with self.lock:
            self.mode = "maintenance"
            self.status = "maintenance"
            log_event("Bot", "Bot entered maintenance mode", "WARNING")

            # In maintenance mode, bot should reject all user commands
            return True

    def exit_maintenance(self):
        """Exit maintenance mode"""
        with self.lock:
            if self.mode != "maintenance":
                return False

            self.mode = "normal"
            self.status = "running" if self.process and self.process.poll() is None else "offline"
            log_event("Bot", "Bot exited maintenance mode", "INFO")
            return True

    def get_status(self) -> Dict[str, any]:
        """Get current bot status"""
        with self.lock:
            uptime = self._get_uptime()

            return {
                "status": self.status,
                "mode": self.mode,
                "uptime": uptime,
                "guild": self.guild_name,
                "commands": self.command_count,
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

    def _monitor_output(self):
        """Monitor bot process output"""
        try:
            while self.process and self.process.poll() is None:
                # Read stdout
                if self.process.stdout:
                    line = self.process.stdout.readline()
                    if line:
                        # Parse for useful info (guild name, command count, etc.)
                        self._parse_output_line(line.strip())

                time.sleep(0.1)

            # Process ended
            if self.status != "offline":
                self.status = "crashed"
                log_event("Bot", "Bot process ended unexpectedly", "ERROR")

        except Exception as e:
            log_event("Bot", f"Output monitor error: {e}", "ERROR")

    def _parse_output_line(self, line: str):
        """Parse bot output for useful information"""
        # This would parse log lines from bot to extract guild name, etc.
        # For now, just basic parsing
        if "Guilds:" in line:
            # Extract guild count
            pass
        elif "Ready" in line or "READY" in line:
            self.status = "running"

    def restart(self):
        """Restart bot"""
        log_event("Bot", "Restarting bot...", "INFO")
        self.stop()
        time.sleep(2)
        return self.start()
