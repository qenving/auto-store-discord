# 🐍 Auto-Store Ecosystem - Python Edition

> **Professional Full-Stack Python Implementation** dengan Discord.py + FastAPI + Modern Architecture

---

## ✨ Tech Stack (Python Professional Edition)

### Backend & Bot
- **Discord Bot:** discord.py 2.3+ (async, modern slash commands)
- **API Server:** FastAPI (async, auto-docs, type hints)
- **Database ORM:** SQLAlchemy 2.0 (async) + Motor (MongoDB async)
- **Validation:** Pydantic v2 (type safety, auto-validation)
- **Logging:** Loguru (colored, structured logging)
- **Payment:** midtransclient + httpx (async HTTP)

### Frontend
- **Desktop GUI:** Eel (Python + HTML/CSS/JS, like Electron but lighter)
- **Web Dashboard:** React + Vite + TypeScript (modern SPA)

### Professional Standards
✅ **Type Hints** everywhere (full mypy compliance)
✅ **Async/Await** throughout (asyncio)
✅ **Clean Architecture** (Repository pattern, DI)
✅ **Pydantic Models** (automatic validation)
✅ **Structured Logging** (Loguru with colors)
✅ **Error Handling** (custom exceptions)
✅ **Config Management** (type-safe with Pydantic)

---

## 📁 New Project Structure (Python)

```
/auto-store-discord
├── src/                        # Python source code
│   ├── bot/                    # Discord bot (discord.py)
│   │   ├── main.py            # Bot entry point
│   │   ├── cogs/              # Command groups
│   │   └── services/          # Bot business logic
│   │
│   ├── api/                    # FastAPI backend
│   │   ├── main.py            # API entry point
│   │   ├── routers/           # API routes
│   │   └── dependencies.py    # Dependency injection
│   │
│   ├── gui/                    # Eel desktop GUI
│   │   ├── main.py            # GUI entry point
│   │   └── web/               # HTML/CSS/JS files
│   │
│   ├── core/                   # Core infrastructure
│   │   ├── config/            # Pydantic config models
│   │   ├── logging/           # Loguru setup
│   │   ├── database/          # DB engines & sessions
│   │   └── exceptions/        # Custom exceptions
│   │
│   └── shared/                 # Shared business logic
│       ├── models/            # Database models (SQLAlchemy)
│       ├── repositories/      # Data access layer
│       ├── services/          # Business services
│       └── payment/           # Payment integrations
│
├── tests/                      # Pytest tests
├── scripts/                    # Python CLI tools
├── legacy/                     # Old Node.js code (reference)
│
├── requirements.txt            # Python dependencies
├── pyproject.toml             # Python project config
└── config.json                # Main configuration (same format!)
```

---

## 🚀 Quick Start (Python Version)

### 1️⃣ Prerequisites

```bash
# Python 3.11+ required
python --version  # Should be >= 3.11

# Check pip
pip --version
```

### 2️⃣ Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3️⃣ Configuration

```bash
# Config file is SAME as Node.js version!
cp config.example.json config.json

# Edit config
nano config.json  # Or your favorite editor
```

**Config format tetap sama!** Pydantic akan handle validation.

### 4️⃣ Run Bot

```bash
# Method 1: Using Python module
python -m src.bot.main

# Method 2: Using pyproject.toml scripts (after pip install -e .)
autostore-bot

# Method 3: Direct execution
python src/bot/main.py
```

### 5️⃣ Run API Server

```bash
# Development mode with auto-reload
uvicorn src.api.main:app --reload --port 3001

# Or using scripts
autostore-api
```

### 6️⃣ Run Desktop GUI

```bash
python -m src.gui.main

# Or
autostore-gui
```

---

## 💻 Development Commands

```bash
# ═══════════════════════════════════════════════
# RUN COMMANDS
# ═══════════════════════════════════════════════

# Discord Bot
python -m src.bot.main              # Run bot
autostore-bot                       # After install

# API Server
uvicorn src.api.main:app --reload  # Development
uvicorn src.api.main:app           # Production

# Desktop GUI
python -m src.gui.main             # Run GUI
autostore-gui                      # After install

# All-in-one (coming soon)
python -m src.main                 # Run integrated mode

# ═══════════════════════════════════════════════
# TESTING & QUALITY
# ═══════════════════════════════════════════════

# Run tests
pytest

# Type checking
mypy src/

# Code formatting
black src/

# Linting
flake8 src/

# ═══════════════════════════════════════════════
# CLI TOOLS
# ═══════════════════════════════════════════════

# Config validation
python -m src.cli test-config

# Database test
python -m src.cli test-database

# Health check
python -m src.cli health
```

---

## 🔧 Configuration (Pydantic Models)

Configuration sekarang **type-safe** dengan Pydantic v2:

```python
from src.core.config import get_settings

# Get settings (cached singleton)
settings = get_settings()

# Type-safe access with autocomplete
token = settings.discord.token  # ✅ Type: str
port = settings.website.port    # ✅ Type: int
db_type = settings.database.type  # ✅ Type: DatabaseType (Enum)

# Automatic validation
# If config invalid, you get friendly Indonesian error messages!
```

**Benefits:**
- ✅ Auto-validation on load
- ✅ Type hints = autocomplete in IDE
- ✅ Friendly error messages (Indonesian)
- ✅ No typos (mypy will catch them)

---

## 📊 Architecture Highlights

### 1. **Clean Architecture (DDD-Lite)**

```python
# Clear separation of concerns:

┌─────────────────┐
│   Presentation  │  ← Discord Bot, FastAPI, GUI
│   (Interface)   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Application   │  ← Services, Use Cases
│   (Business)    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Domain        │  ← Models, Entities
│   (Core)        │
└────────┬────────┘
         │
┌────────▼────────┐
│   Infrastructure│  ← Database, Payment APIs
│   (Technical)   │
└─────────────────┘
```

### 2. **Repository Pattern**

```python
# Clean data access layer

class UserRepository:
    async def get_by_id(self, user_id: str) -> User | None:
        ...

    async def create(self, user: UserCreate) -> User:
        ...
```

### 3. **Dependency Injection**

```python
# FastAPI example
from fastapi import Depends

@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    user_repo: UserRepository = Depends(get_user_repository)
):
    return await user_repo.get_by_id(user_id)
```

### 4. **Async/Await Throughout**

```python
# Everything is async for better performance

async def process_order(order_id: str):
    # Database query (async)
    order = await order_repo.get_by_id(order_id)

    # Payment API call (async)
    payment = await payment_service.create_invoice(order)

    # Discord message (async)
    await send_notification(order.user_id, payment.url)
```

---

## 🎯 Migration from Node.js

### What Changed?

| Component | Node.js | Python |
|-----------|---------|--------|
| **Bot Library** | discord.js | discord.py |
| **API Framework** | Express | FastAPI |
| **Database ORM** | Sequelize/Mongoose | SQLAlchemy/Motor |
| **Validation** | Manual | Pydantic |
| **Config** | JSON parse | Pydantic Settings |
| **Logging** | Winston/console | Loguru |
| **Type System** | TypeScript (optional) | Python Type Hints (enforced) |

### What Stayed the Same?

✅ **config.json format** - Exactly the same!
✅ **Database schema** - Same tables/collections
✅ **API endpoints** - Same routes
✅ **Features** - All features preserved

---

## 📚 Documentation

| File | Description |
|------|-------------|
| **README.Python.md** | This file - Python setup |
| **README.md** | Original Node.js docs |
| **KONFIGURASI.md** | Config explanations (same for Python) |
| **CARA_SETUP.md** | Setup guide (updated for Python) |
| **FAQ.md** | Troubleshooting |

---

## 🔥 Why Python?

### Advantages over Node.js for this project:

1. **Type Safety Out of the Box**
   - Python 3.11+ has excellent type hints
   - mypy enforces types (no runtime surprises)
   - Pydantic = runtime validation + types

2. **Better for Data Processing**
   - If you want analytics: pandas, numpy
   - If you want ML/AI: scikit-learn, tensorflow
   - Better decimal handling for money

3. **Simpler Async**
   - asyncio is built-in (no promises hell)
   - async/await syntax is cleaner
   - Better error traces

4. **Professional Discord Bots**
   - discord.py is more mature for bots
   - Better documentation
   - Larger bot community

5. **FastAPI > Express**
   - Auto-generated API docs
   - Built-in validation
   - Better performance (Uvicorn)
   - Type hints = autocomplete

---

## 🚀 Next Steps

This is **Phase 1** of Python conversion. Complete components:

✅ Project structure
✅ Pydantic config models
✅ Logging system (Loguru)
✅ Custom exceptions
✅ Discord bot skeleton

**Coming in Phase 2:**
- 📦 Database layer (SQLAlchemy + Motor)
- 🤖 Discord bot commands (slash commands)
- 🌐 FastAPI backend (full API)
- 💳 Payment integrations
- 🖥️ Eel desktop GUI
- 🧪 Tests

---

## 💡 Pro Tips

1. **Use virtual environment ALWAYS**
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install in editable mode for development**
   ```bash
   pip install -e .
   ```

3. **Use type hints everywhere**
   ```python
   def get_user(user_id: str) -> User | None:
       ...
   ```

4. **Let Pydantic validate for you**
   ```python
   # Don't do manual validation
   # Let Pydantic models do it automatically
   ```

5. **Use async/await consistently**
   ```python
   # If function does I/O, make it async
   async def fetch_data(): ...
   ```

---

**Version:** 3.0.0 (Python Edition)
**Last Updated:** 2025-11-15
**Status:** Phase 1 Complete ✅

**Happy coding with Python! 🐍🚀**
