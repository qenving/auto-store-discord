"""
Theme Manager
Dark/Light theme support
"""

import tkinter as tk
from tkinter import ttk


class ThemeManager:
    """Manages application themes"""

    def __init__(self):
        self.current_theme = "light"

        self.themes = {
            "light": {
                "bg": "#F5F5F5",
                "fg": "#000000",
                "select_bg": "#0078D7",
                "select_fg": "#FFFFFF",
                "button_bg": "#E1E1E1",
                "entry_bg": "#FFFFFF",
                "text_bg": "#FFFFFF",
                "text_fg": "#000000"
            },
            "dark": {
                "bg": "#1E1E1E",
                "fg": "#FFFFFF",
                "select_bg": "#0078D7",
                "select_fg": "#FFFFFF",
                "button_bg": "#2D2D30",
                "entry_bg": "#252526",
                "text_bg": "#1E1E1E",
                "text_fg": "#D4D4D4"
            }
        }

    def apply_theme(self, root, theme_name="light"):
        """Apply theme to tkinter root window"""
        self.current_theme = theme_name
        theme = self.themes.get(theme_name, self.themes["light"])

        # Configure root
        root.configure(bg=theme["bg"])

        # Configure ttk styles
        style = ttk.Style(root)

        # Try to use a modern theme if available
        available_themes = style.theme_names()
        if theme_name == "dark":
            if "clam" in available_themes:
                style.theme_use("clam")
        else:
            if "vista" in available_themes:
                style.theme_use("vista")
            elif "clam" in available_themes:
                style.theme_use("clam")

        # Configure specific widgets
        style.configure("TFrame", background=theme["bg"])
        style.configure("TLabel", background=theme["bg"], foreground=theme["fg"])
        style.configure("TButton", background=theme["button_bg"], foreground=theme["fg"])
        style.configure("TEntry", fieldbackground=theme["entry_bg"], foreground=theme["fg"])
        style.configure("TLabelframe", background=theme["bg"], foreground=theme["fg"])
        style.configure("TLabelframe.Label", background=theme["bg"], foreground=theme["fg"])

        # Success button style
        style.configure(
            "Success.TButton",
            background="#00C851",
            foreground="#FFFFFF",
            font=("Arial", 10, "bold")
        )

        # Danger button style
        style.configure(
            "Danger.TButton",
            background="#FF4444",
            foreground="#FFFFFF",
            font=("Arial", 10, "bold")
        )

        # Warning button style
        style.configure(
            "Warning.TButton",
            background="#FFA900",
            foreground="#FFFFFF",
            font=("Arial", 10, "bold")
        )

    def get_current_theme(self) -> str:
        """Get current theme name"""
        return self.current_theme

    def get_color(self, key: str) -> str:
        """Get color from current theme"""
        theme = self.themes.get(self.current_theme, self.themes["light"])
        return theme.get(key, "#000000")
