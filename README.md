# 🤖 Auto-Store Ecosystem

**Auto-Store Ecosystem** adalah sistem manajemen toko otomatis Discord dengan fitur lengkap untuk mengelola produk digital, order, pembayaran, dan stock management. Dirancang untuk **mudah digunakan** bahkan untuk pemula.

---

## ✨ Fitur Utama

- 🤖 **Discord Bot** - Sistem toko otomatis dengan slash commands modern
- 🌐 **Web Dashboard** - Interface admin untuk manage produk & orders
- 🖥️ **Desktop App** - Aplikasi desktop (Electron) dengan GUI modern
- 💳 **Multi Payment** - Support Midtrans, Duitku, Tripay, dan manual
- 🗄️ **Multi Database** - Support MySQL & MongoDB
- 📦 **Auto Delivery** - Kirim produk otomatis via DM setelah pembayaran
- 📊 **Real-time Logs** - Monitor bot activity via Console tab
- ⚙️ **Easy Config** - Satu file konfigurasi untuk semua mode

---

## 🎯 Mode Operasi

Project ini mendukung **3 mode operasi**:

| Mode | Deskripsi | Cocok Untuk |
|------|-----------|-------------|
| **DiscordBotOnly** ✅ | Hanya jalankan bot Discord | Pemula, resource minimal |
| **WebOnly** | Hanya jalankan web dashboard | Admin panel only |
| **IntegratedMode** | Bot + Web + sinkronisasi penuh | Fitur lengkap, advanced |

**Recommended untuk pemula:** `DiscordBotOnly`

---

## 📁 Struktur Project

```
/auto-store-discord
├── /bot                      # 🤖 Discord Bot (Official v2)
│   ├── /commands             #   Slash commands
│   ├── /events               #   Discord events
│   ├── /handlers             #   Command & event loaders
│   ├── /core                 #   Extended Discord client
│   └── index.js              #   Bot entrypoint
│
├── /shared                   # 📦 Core Modules (Shared by all apps)
│   ├── /config               #   ConfigManager
│   ├── /database             #   Database providers (MySQL, MongoDB)
│   ├── /payment              #   Payment integrations
│   ├── /logger               #   Logger utility
│   ├── /api                  #   API server untuk GUI/Web
│   └── /services             #   Business logic
│
├── /gui                      # 🖥️ Desktop GUI (Electron + HTML)
│   └── /public               #   Main GUI interface
│
├── /web                      # 🌐 Web Dashboard (Next.js)
│   ├── /app                  #   Next.js 13+ app router
│   └── /components           #   React components
│
├── /scripts                  # 🛠️ CLI Tools
│   ├── cli.js                #   Interactive CLI menu
│   ├── test-config.js        #   Config validator
│   └── test-database.js      #   Database tester
│
├── /legacy                   # ⚠️ DEPRECATED - DO NOT USE
│   └── /v1-bot               #   Old bot code (reference only)
│
├── config.example.json       # ✅ Template config
├── config.json               # ⚙️ Your config (create dari template)
├── package.json              # 📦 Dependencies & scripts
│
├── README.md                 # 📖 This file
├── KONFIGURASI.md            # 📝 Config field explanations
├── CARA_SETUP.md             # 🚀 Step-by-step setup guide
└── FAQ.md                    # ❓ Troubleshooting
```

**⚠️ PENTING:** Folder `/legacy/v1-bot` berisi kode lama yang **TIDAK DIGUNAKAN LAGI**. Jangan gunakan untuk project baru!

---

## 🚀 Quick Start - Bot Only (Recommended)

### Persyaratan Sistem

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Database**: MySQL 8.0+ atau MongoDB 4.4+
- **Discord Bot**: Token dari [Discord Developer Portal](https://discord.com/developers/applications)

### Langkah Setup (5 Menit)

#### 1️⃣ Clone & Install

```bash
# Clone repository
git clone https://github.com/your-repo/auto-store-discord.git
cd auto-store-discord

# Install dependencies
npm install
```

#### 2️⃣ Create Config

```bash
# Copy config template
cp config.example.json config.json

# Edit config
nano config.json  # Atau pakai editor favorit (VS Code, Sublime, dll)
```

#### 3️⃣ Setup Database (Pilih Salah Satu)

**Option A: MySQL**

```sql
-- Buat database baru
CREATE DATABASE autostore;
```

Config:
```json
{
  "database": {
    "type": "mysql",
    "mysql": {
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "YOUR_PASSWORD",
      "database": "autostore"
    }
  }
}
```

**Option B: MongoDB**

Config:
```json
{
  "database": {
    "type": "mongodb",
    "mongodb": {
      "uri": "mongodb://localhost:27017/autostore"
    }
  }
}
```

#### 4️⃣ Setup Discord Bot

1. Buka https://discord.com/developers/applications
2. Create New Application
3. Menu **Bot** → Reset Token → Copy token
4. Menu **OAuth2** → Copy Application ID
5. Invite bot ke server:
   - OAuth2 → URL Generator
   - Scopes: `bot` + `applications.commands`
   - Permissions: `Administrator` (untuk testing)
   - Copy & buka URL

Config:
```json
{
  "discord": {
    "token": "PASTE_BOT_TOKEN_DISINI",
    "clientId": "PASTE_APPLICATION_ID_DISINI",
    "guildId": "PASTE_SERVER_ID_DISINI",
    "ownerId": "PASTE_USER_ID_ANDA"
  }
}
```

**Cara dapat Server ID & User ID:**
- Settings → Advanced → Developer Mode → ON
- Right-click server → Copy ID
- Right-click profile Anda → Copy ID

#### 5️⃣ Validasi & Test

```bash
# Validate config
npm run test:config

# Test database connection
npm run test:database

# Run bot
npm run bot
```

✅ **Done!** Bot sekarang online dan slash commands otomatis ter-register.

---

## 💻 Commands Reference

### NPM Scripts

```bash
# ═══════════════════════════════════════════════
# DEVELOPMENT
# ═══════════════════════════════════════════════

npm start              # Start desktop app (Electron)
npm run dev            # Start desktop app (dev mode)

npm run bot            # Start Discord bot only
npm run bot:dev        # Start bot with auto-reload

npm run gui            # Start GUI server only
npm run gui:dev        # Start GUI with auto-reload

npm run web            # Start web dashboard (dev)
npm run web:build      # Build web for production
npm run web:start      # Start web (production)

# ═══════════════════════════════════════════════
# CLI TOOLS
# ═══════════════════════════════════════════════

npm run cli            # Show CLI help menu
npm run test:config    # Validate config.json
npm run test:database  # Test database connection
npm run health         # Health check (all services)
npm run init           # Initialize new project

# ═══════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════

npm run build          # Build desktop app (current OS)
npm run build:win      # Build for Windows (.exe)
npm run build:mac      # Build for macOS (.dmg)
npm run build:linux    # Build for Linux (AppImage)

# ═══════════════════════════════════════════════
# MAINTENANCE
# ═══════════════════════════════════════════════

npm run install:all    # Install all dependencies (root + web)
```

---

## ⚙️ Mode Operasi Lengkap

### 1. Discord Bot Only (Recommended)

**Kelebihan:**
- Setup paling mudah
- Resource minimal (RAM & CPU rendah)
- Cocok untuk pemula

**Yang Diperlukan:**
- Discord bot token ✅
- Database (MySQL/MongoDB) ✅
- Payment provider (opsional)

**Cara Jalankan:**
```json
{
  "mode": "DiscordBotOnly"
}
```

```bash
npm run bot
```

---

### 2. Desktop App (Electron GUI)

**Kelebihan:**
- GUI untuk manage config
- Monitor logs real-time
- All-in-one application

**Cara Jalankan:**
```bash
npm start
```

**Atau build installer:**
```bash
npm run build:win    # Windows installer
npm run build:mac    # macOS installer
npm run build:linux  # Linux AppImage
```

**File installer ada di:** `dist/`

---

### 3. Integrated Mode (Bot + Web)

**Kelebihan:**
- Fitur lengkap (bot + web dashboard)
- Sinkronisasi data real-time
- Manage via Discord atau web

**Yang Diperlukan:**
- Semua requirements dari mode lain
- Website config (JWT secret, admin password)
- OAuth config (untuk login Discord)

**Config:**
```json
{
  "mode": "IntegratedMode",
  "website": {
    "url": "http://localhost:3000",
    "port": 3000,
    "jwtSecret": "RANDOM_STRING_MIN_32_CHARS",
    "adminSecretKey": "STRONG_ADMIN_PASSWORD"
  },
  "oauth": {
    "clientId": "SAME_AS_discord.clientId",
    "clientSecret": "FROM_DISCORD_DEVELOPER_PORTAL",
    "redirectUri": "http://localhost:3000/api/auth/callback"
  }
}
```

```bash
npm start
# Atau
npm run gui
```

---

## 🔧 Troubleshooting

### ❌ Error "config.json not found"

```bash
cp config.example.json config.json
```

### ❌ MySQL connection failed

1. Check MySQL service running
2. Check username/password di config
3. Create database: `CREATE DATABASE autostore;`

### ❌ Slash commands tidak muncul

1. Restart bot (commands auto-register)
2. Pastikan bot punya permissions `applications.commands`
3. Check `guildId` benar

### ❌ Bot crash / tidak stabil

Gunakan PM2:
```bash
npm install -g pm2
pm2 start bot/index.js --name "autostore-bot"
pm2 monit
```

**Troubleshooting lengkap:** Baca [FAQ.md](FAQ.md)

---

## 📚 Dokumentasi Lengkap

| File | Deskripsi |
|------|-----------|
| **README.md** | Overview & Quick Start (file ini) |
| **[KONFIGURASI.md](KONFIGURASI.md)** | Penjelasan lengkap setiap field config.json |
| **[CARA_SETUP.md](CARA_SETUP.md)** | Step-by-step setup Discord bot, database, payment |
| **[FAQ.md](FAQ.md)** | Troubleshooting & common errors |
| **[legacy/README-LEGACY.md](legacy/README-LEGACY.md)** | Penjelasan folder legacy (deprecated) |

---

## 🛠️ Development

### Project Structure Philosophy

- **`/bot`** - Discord bot (slash commands, events, handlers)
- **`/shared`** - Core modules shared by all apps (config, database, payment, logger)
- **`/gui`** - Simple Electron GUI (HTML + CSS + JS, no frameworks)
- **`/web`** - Advanced web dashboard (Next.js + React + TypeScript)
- **`/scripts`** - CLI tools untuk testing & maintenance
- **`/legacy`** - Old code (deprecated, for reference only)

### Configuration Philosophy

**ONE config file to rule them all:** `config.json`

- Single source of truth untuk semua mode
- Validated on startup dengan friendly error messages
- Template tersedia di `config.example.json`

### Code Style

- Bahasa Indonesia untuk user-facing messages (logs, errors, docs)
- English untuk code comments & internal functions
- Friendly error messages dengan solusi konkret
- No magic numbers - semua values ada di config

---

## 🚢 Deployment

### VPS / Cloud Server

```bash
# 1. Clone & install
git clone <repo-url>
cd auto-store-discord
npm install

# 2. Setup config
cp config.example.json config.json
nano config.json

# 3. Run with PM2
npm install -g pm2
pm2 start bot/index.js --name "autostore-bot"
pm2 startup
pm2 save

# 4. Monitor
pm2 monit
pm2 logs
```

### Docker (Coming Soon)

```bash
docker-compose up -d
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - lihat [LICENSE](LICENSE) untuk detail.

---

## 📞 Support

- **GitHub Issues:** [Report Bug](https://github.com/your-repo/auto-store-discord/issues)
- **Dokumentasi:** Baca file `.md` di root project
- **CLI Help:** `npm run cli`

---

## 🎉 Credits

Developed with ❤️ by Auto-Store Team

**Tech Stack:**
- Discord.js v14
- Electron 28
- Next.js 14
- Express
- MySQL2 / Mongoose
- Midtrans / Duitku / Tripay

---

**Terakhir diupdate:** 2025-11-15
**Versi:** 2.0.0

**Happy coding! 🚀**
