"""
Utility Functions
Helper functions for GUI controller
"""

import shutil
from pathlib import Path
from datetime import datetime


def log_event(module: str, message: str, level: str = "INFO"):
    """Log event to GUI log file"""
    log_file = Path("logs/gui.log")
    log_file.parent.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] [{level}] [{module}] {message}\n"

    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(log_line)
    except:
        pass  # Silently fail if can't write to log


def create_backup(file_path: str) -> Path:
    """Create backup of a file"""
    source = Path(file_path)

    if not source.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    # Create backup directory
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)

    # Create backup with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"{source.stem}_{timestamp}{source.suffix}"
    backup_path = backup_dir / backup_name

    # Copy file
    shutil.copy2(source, backup_path)

    log_event("Backup", f"Created backup: {backup_path}", "INFO")
    return backup_path


def format_bytes(bytes_value: int) -> str:
    """Format bytes to human-readable string"""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def format_uptime(seconds: int) -> str:
    """Format seconds to uptime string"""
    days, remainder = divmod(seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)

    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    else:
        return f"{minutes}m {seconds}s"
