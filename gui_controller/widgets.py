"""
Custom Widgets
Specialized widgets for GUI controller
"""

import tkinter as tk
from tkinter import ttk


class StatusIndicator(tk.Canvas):
    """Animated status indicator (colored dot)"""

    def __init__(self, parent, size=16):
        super().__init__(parent, width=size, height=size, highlightthickness=0, bg=parent.cget("bg"))

        self.size = size
        self.status = "inactive"

        self.colors = {
            "success": "#00C851",  # Green
            "warning": "#FFA900",  # Orange
            "error": "#FF4444",    # Red
            "inactive": "#888888"  # Gray
        }

        self.circle = self.create_oval(2, 2, size-2, size-2, fill=self.colors["inactive"], outline="")

        # Animation state
        self.is_animating = False
        self.animation_step = 0

    def set_status(self, status: str):
        """Set status color"""
        self.status = status
        color = self.colors.get(status, self.colors["inactive"])

        self.itemconfig(self.circle, fill=color)

        # Start pulse animation for active statuses
        if status in ["success", "warning"]:
            if not self.is_animating:
                self._start_pulse()
        else:
            self.is_animating = False

    def _start_pulse(self):
        """Start pulse animation"""
        self.is_animating = True
        self._pulse()

    def _pulse(self):
        """Pulse animation step"""
        if not self.is_animating:
            return

        # Create pulsing effect by changing opacity (simplified with size)
        self.animation_step = (self.animation_step + 1) % 20

        if self.animation_step < 10:
            scale = 1.0 + (self.animation_step * 0.02)
        else:
            scale = 1.0 + ((20 - self.animation_step) * 0.02)

        # Redraw circle
        offset = (self.size * (1 - scale)) / 2
        new_size = self.size * scale

        self.coords(self.circle, offset, offset, offset + new_size - 4, offset + new_size - 4)

        # Schedule next frame
        if self.is_animating:
            self.after(50, self._pulse)


class AnimatedButton(ttk.Button):
    """Button with hover effects"""

    def __init__(self, parent, style_type="normal", **kwargs):
        # Map style type to ttk style
        style_map = {
            "success": "Success.TButton",
            "danger": "Danger.TButton",
            "warning": "Warning.TButton",
            "normal": "TButton"
        }

        style = style_map.get(style_type, "TButton")
        super().__init__(parent, style=style, **kwargs)

        # Bind hover events
        self.bind("<Enter>", self._on_enter)
        self.bind("<Leave>", self._on_leave)

        self.default_cursor = self.cget("cursor")

    def _on_enter(self, event):
        """Mouse enter event"""
        self.config(cursor="hand2")

    def _on_leave(self, event):
        """Mouse leave event"""
        self.config(cursor=self.default_cursor)


class ProgressBar(ttk.Progressbar):
    """Custom progress bar"""

    def __init__(self, parent, **kwargs):
        super().__init__(parent, mode='indeterminate', **kwargs)

    def start_animation(self):
        """Start indeterminate animation"""
        self.start(10)

    def stop_animation(self):
        """Stop animation"""
        self.stop()
