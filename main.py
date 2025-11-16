#!/usr/bin/env python3
"""
Auto-Store Ecosystem - GUI Controller Panel Launcher
Run: python main.py
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Ensure required directories exist
(project_root / "logs").mkdir(exist_ok=True)
(project_root / "backups").mkdir(exist_ok=True)
(project_root / "data").mkdir(exist_ok=True)

if __name__ == "__main__":
    try:
        from gui_controller.main_window import AutoStoreControllerApp
        
        # Launch GUI
        app = AutoStoreControllerApp()
        app.run()
        
    except KeyboardInterrupt:
        print("\n✅ GUI Controller Panel closed by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Fatal error launching GUI: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
