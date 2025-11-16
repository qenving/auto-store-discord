"""
Logs Viewer Module
Real-time logs monitoring with auto-scroll
"""

import tkinter as tk
from tkinter import scrolledtext
from pathlib import Path
from collections import deque


class LogsViewer(scrolledtext.ScrolledText):
    """Logs viewer widget with real-time updates"""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)

        self.config(
            font=("Courier New", 9),
            wrap=tk.WORD,
            state=tk.DISABLED
        )

        # Configure colors for log levels
        self.tag_configure("INFO", foreground="#0096FF")
        self.tag_configure("SUCCESS", foreground="#00D100")
        self.tag_configure("WARNING", foreground="#FFA900")
        self.tag_configure("ERROR", foreground="#FF4444")
        self.tag_configure("DEBUG", foreground="#888888")

        # Log file paths
        self.bot_log = Path("logs/bot.log")
        self.api_log = Path("logs/api.log")
        self.gui_log = Path("logs/gui.log")

        # Track last read positions
        self.last_positions = {
            "bot": 0,
            "api": 0,
            "gui": 0,
            "both": 0
        }

        # Buffer for recent lines
        self.max_lines = 1000
        self.current_lines = 0

    def refresh(self, source="both"):
        """Refresh logs from file"""
        self.clear()

        try:
            lines = self._read_log_files(source)
            self._display_lines(lines)
        except Exception as e:
            self._append_line(f"Error reading logs: {e}", "ERROR")

    def tail_logs(self, source="both", autoscroll=True):
        """Tail logs (show new lines only)"""
        try:
            new_lines = self._read_new_lines(source)

            if new_lines:
                self._display_lines(new_lines)

                if autoscroll:
                    self.see(tk.END)

        except Exception as e:
            pass  # Silently ignore tail errors

    def clear(self):
        """Clear logs display"""
        self.config(state=tk.NORMAL)
        self.delete("1.0", tk.END)
        self.current_lines = 0
        self.config(state=tk.DISABLED)

    def _read_log_files(self, source) -> list:
        """Read log files based on source"""
        lines = []

        if source in ["bot", "both"]:
            lines.extend(self._read_log_file(self.bot_log, "[BOT]"))

        if source in ["api", "both"]:
            lines.extend(self._read_log_file(self.api_log, "[API]"))

        # Sort by timestamp if possible
        return lines[-self.max_lines:]  # Keep last N lines

    def _read_log_file(self, log_path: Path, prefix: str) -> list:
        """Read a single log file"""
        if not log_path.exists():
            return []

        try:
            with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                return [(f"{prefix} {line.rstrip()}", self._detect_level(line)) for line in lines]
        except:
            return []

    def _read_new_lines(self, source) -> list:
        """Read only new lines since last read"""
        new_lines = []

        if source in ["bot", "both"]:
            new_lines.extend(self._read_new_from_file(self.bot_log, "bot", "[BOT]"))

        if source in ["api", "both"]:
            new_lines.extend(self._read_new_from_file(self.api_log, "api", "[API]"))

        return new_lines

    def _read_new_from_file(self, log_path: Path, source_key: str, prefix: str) -> list:
        """Read new lines from a specific file"""
        if not log_path.exists():
            return []

        try:
            with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                # Seek to last position
                f.seek(self.last_positions[source_key])

                # Read new lines
                new_lines = f.readlines()

                # Update position
                self.last_positions[source_key] = f.tell()

                return [(f"{prefix} {line.rstrip()}", self._detect_level(line)) for line in new_lines]
        except:
            return []

    def _detect_level(self, line: str) -> str:
        """Detect log level from line"""
        line_upper = line.upper()

        if "ERROR" in line_upper or "FATAL" in line_upper or "❌" in line:
            return "ERROR"
        elif "WARNING" in line_upper or "WARN" in line_upper or "⚠" in line:
            return "WARNING"
        elif "SUCCESS" in line_upper or "✅" in line:
            return "SUCCESS"
        elif "DEBUG" in line_upper:
            return "DEBUG"
        else:
            return "INFO"

    def _display_lines(self, lines: list):
        """Display lines in widget"""
        self.config(state=tk.NORMAL)

        for line_text, level in lines:
            # Trim old lines if needed
            if self.current_lines >= self.max_lines:
                self.delete("1.0", "2.0")
                self.current_lines -= 1

            # Insert new line with color
            self.insert(tk.END, line_text + "\n", level)
            self.current_lines += 1

        self.config(state=tk.DISABLED)

    def _append_line(self, line: str, level: str = "INFO"):
        """Append a single line"""
        self.config(state=tk.NORMAL)

        # Trim if needed
        if self.current_lines >= self.max_lines:
            self.delete("1.0", "2.0")
            self.current_lines -= 1

        self.insert(tk.END, line + "\n", level)
        self.current_lines += 1

        self.config(state=tk.DISABLED)
        self.see(tk.END)
