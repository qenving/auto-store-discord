"""
Config Editor Module
JSON configuration editor with validation
"""

import json
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
from pathlib import Path
from typing import Tuple, List

from .utils import log_event, create_backup


class ConfigEditor(ttk.Frame):
    """Configuration editor widget"""

    def __init__(self, parent):
        super().__init__(parent)

        self.config_path = Path("config.json")
        self.config_data = {}

        self._setup_ui()
        self.load_config()

    def _setup_ui(self):
        """Setup UI components"""
        # Info label
        info_label = ttk.Label(
            self,
            text="Edit config.json (JSON format). Changes require restart to take effect.",
            font=("Arial", 9, "italic")
        )
        info_label.pack(anchor="w", pady=(0, 10))

        # Text editor with scrollbar
        self.text_editor = scrolledtext.ScrolledText(
            self,
            width=80,
            height=25,
            font=("Courier New", 10),
            wrap=tk.WORD,
            undo=True,
            maxundo=-1
        )
        self.text_editor.pack(fill=tk.BOTH, expand=True)

        # Syntax highlighting (basic)
        self._configure_syntax_highlighting()

    def _configure_syntax_highlighting(self):
        """Configure basic JSON syntax highlighting"""
        self.text_editor.tag_configure("string", foreground="#CE9178")
        self.text_editor.tag_configure("number", foreground="#B5CEA8")
        self.text_editor.tag_configure("keyword", foreground="#569CD6")
        self.text_editor.tag_configure("comment", foreground="#6A9955")

    def load_config(self):
        """Load configuration from file"""
        try:
            if not self.config_path.exists():
                # Try to load from example
                example_path = Path("config.example.json")
                if example_path.exists():
                    with open(example_path, "r", encoding="utf-8") as f:
                        self.config_data = json.load(f)
                    log_event("Config", "Loaded from config.example.json", "INFO")
                else:
                    self.config_data = self._get_default_config()
                    log_event("Config", "Created default config", "INFO")
            else:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    self.config_data = json.load(f)
                log_event("Config", "Config loaded successfully", "INFO")

            # Display in editor
            self._display_config()

        except json.JSONDecodeError as e:
            log_event("Config", f"JSON decode error: {e}", "ERROR")
            messagebox.showerror("Config Error", f"Invalid JSON in config file:\n{e}")
        except Exception as e:
            log_event("Config", f"Load error: {e}", "ERROR")
            messagebox.showerror("Load Error", f"Failed to load config:\n{e}")

    def save_config(self):
        """Save configuration to file"""
        try:
            # Get text from editor
            config_text = self.text_editor.get("1.0", tk.END).strip()

            # Parse JSON
            config_data = json.loads(config_text)

            # Create backup
            if self.config_path.exists():
                create_backup(str(self.config_path))

            # Save to file
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(config_data, f, indent=2, ensure_ascii=False)

            self.config_data = config_data
            log_event("Config", "Config saved successfully", "SUCCESS")
            return True

        except json.JSONDecodeError as e:
            log_event("Config", f"Invalid JSON: {e}", "ERROR")
            messagebox.showerror("Invalid JSON", f"Cannot save - invalid JSON:\n{e}")
            return False
        except Exception as e:
            log_event("Config", f"Save error: {e}", "ERROR")
            messagebox.showerror("Save Error", f"Failed to save config:\n{e}")
            return False

    def validate_config(self) -> Tuple[bool, List[str]]:
        """Validate configuration"""
        errors = []

        try:
            # Get text from editor
            config_text = self.text_editor.get("1.0", tk.END).strip()

            # Parse JSON
            config_data = json.loads(config_text)

            # Check required fields
            required_fields = ["mode", "discord", "database"]
            for field in required_fields:
                if field not in config_data:
                    errors.append(f"Missing required field: {field}")

            # Validate discord section
            if "discord" in config_data:
                discord_fields = ["token", "clientId", "guildId", "ownerId"]
                for field in discord_fields:
                    if field not in config_data["discord"]:
                        errors.append(f"Missing discord.{field}")
                    elif "PASTE" in str(config_data["discord"][field]):
                        errors.append(f"discord.{field} not configured (still has PASTE placeholder)")

            # Validate database section
            if "database" in config_data:
                if "type" not in config_data["database"]:
                    errors.append("Missing database.type")
                else:
                    db_type = config_data["database"]["type"]
                    if db_type == "mysql":
                        if "mysql" not in config_data["database"]:
                            errors.append("database.type is mysql but mysql config missing")
                    elif db_type == "mongodb":
                        if "mongodb" not in config_data["database"]:
                            errors.append("database.type is mongodb but mongodb config missing")
                    elif db_type == "local_json":
                        # Local JSON is optional, auto-creates
                        pass
                    else:
                        errors.append(f"Invalid database.type: {db_type}")

            # Validate mode
            if "mode" in config_data:
                valid_modes = ["DiscordBotOnly", "WebOnly", "IntegratedMode"]
                if config_data["mode"] not in valid_modes:
                    errors.append(f"Invalid mode: {config_data['mode']}")

            return len(errors) == 0, errors

        except json.JSONDecodeError as e:
            errors.append(f"Invalid JSON: {e}")
            return False, errors
        except Exception as e:
            errors.append(f"Validation error: {e}")
            return False, errors

    def _display_config(self):
        """Display configuration in editor"""
        # Clear editor
        self.text_editor.delete("1.0", tk.END)

        # Format JSON with indentation
        config_text = json.dumps(self.config_data, indent=2, ensure_ascii=False)

        # Insert text
        self.text_editor.insert("1.0", config_text)

        # Apply basic syntax highlighting
        self._apply_basic_highlighting()

    def _apply_basic_highlighting(self):
        """Apply basic syntax highlighting to JSON"""
        content = self.text_editor.get("1.0", tk.END)

        # Remove existing tags
        for tag in ["string", "number", "keyword", "comment"]:
            self.text_editor.tag_remove(tag, "1.0", tk.END)

        # Highlight strings (simple regex-like approach)
        lines = content.split("\n")
        for i, line in enumerate(lines):
            line_num = i + 1

            # Find strings in quotes
            in_string = False
            start_idx = 0
            for j, char in enumerate(line):
                if char == '"':
                    if in_string:
                        # End of string
                        self.text_editor.tag_add(
                            "string",
                            f"{line_num}.{start_idx}",
                            f"{line_num}.{j+1}"
                        )
                        in_string = False
                    else:
                        # Start of string
                        start_idx = j
                        in_string = True

            # Highlight keywords
            for keyword in ["true", "false", "null"]:
                if keyword in line:
                    idx = line.find(keyword)
                    while idx != -1:
                        self.text_editor.tag_add(
                            "keyword",
                            f"{line_num}.{idx}",
                            f"{line_num}.{idx + len(keyword)}"
                        )
                        idx = line.find(keyword, idx + 1)

    def _get_default_config(self) -> dict:
        """Get default configuration"""
        return {
            "mode": "DiscordBotOnly",
            "database": {
                "type": "local_json",
                "localJson": {
                    "path": "data"
                }
            },
            "discord": {
                "token": "PASTE_YOUR_BOT_TOKEN_HERE",
                "clientId": "PASTE_YOUR_CLIENT_ID_HERE",
                "guildId": "PASTE_YOUR_GUILD_ID_HERE",
                "ownerId": "PASTE_YOUR_OWNER_ID_HERE",
                "channels": {
                    "testimoni": "",
                    "orderLog": "",
                    "paymentLog": "",
                    "adminLog": ""
                }
            },
            "payment": {
                "midtrans": None,
                "duitku": None,
                "tripay": None
            },
            "website": {
                "url": "http://localhost:3001",
                "port": 3001
            }
        }
