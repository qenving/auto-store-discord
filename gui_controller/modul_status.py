"""
Status Manager Module
Persist and manage application state
"""

import json
from pathlib import Path
from typing import Optional


class StatusManager:
    """Manages application status persistence"""

    def __init__(self):
        self.status_file = Path("logs/gui_status.json")
        self.status_file.parent.mkdir(parents=True, exist_ok=True)

        self.current_mode = "offline"  # offline, running, paused, maintenance
        self.load_state()

    def get_mode(self) -> str:
        """Get current mode"""
        return self.current_mode

    def set_mode(self, mode: str):
        """Set current mode"""
        self.current_mode = mode
        self.save_state()

    def load_state(self):
        """Load state from file"""
        try:
            if self.status_file.exists():
                with open(self.status_file, "r") as f:
                    data = json.load(f)
                    self.current_mode = data.get("mode", "offline")
        except:
            pass

    def save_state(self):
        """Save state to file"""
        try:
            data = {
                "mode": self.current_mode
            }

            with open(self.status_file, "w") as f:
                json.dump(data, f, indent=2)
        except:
            pass
