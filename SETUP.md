# 🚀 AUTO-STORE MANAGER - SETUP GUIDE

## ✨ Apa ini?

**Auto-Store Manager** adalah aplikasi desktop untuk mengelola Discord auto-store bot Anda.

**Fitur:**
- ✅ GUI Desktop App (Windows/Mac/Linux)
- ✅ Manage bot configuration via GUI (tidak perlu edit file!)
- ✅ Start/Stop bot dengan 1 klik
- ✅ Real-time status monitoring
- ✅ Build jadi .exe installer

---

## 📦 Install

### 1. Install Dependencies

```bash
npm install
```

Ini akan install:
- Discord.js, MySQL, MongoDB drivers
- Express API server
- **Electron** (untuk desktop app)
- **Electron Builder** (untuk build .exe)

---

## 🖥️ Cara Pakai

### Development Mode (Langsung jalankan)

```bash
npm start
```

Akan terbuka **DESKTOP APPLICATION** dengan GUI lengkap!

**Apa yang terjadi:**
1. Electron app window terbuka (1400x900)
2. Backend server auto-start (port 3000 & 3001)
3. GUI loaded di dalam app window
4. Discord bot siap di-start via GUI

### First Time Setup

Saat app terbuka pertama kali:

1. **Klik tab "Settings"**
2. **Isi form:**
   - Discord Bot Token
   - Application/Client ID
   - Guild/Server ID
   - Owner User ID
   - Database config (MySQL host, user, password, database)
3. **Klik "Save Configuration"**
4. **Klik tombol "Start Bot"** di header
5. **DONE!** Bot jalan!

---

## 🏗️ Build Installer (.exe)

### Build untuk Windows

```bash
npm run build:win
```

Output: `dist/Auto-Store Manager Setup.exe`

### Build untuk Mac

```bash
npm run build:mac
```

Output: `dist/Auto-Store Manager.dmg`

### Build untuk Linux

```bash
npm run build:linux
```

Output: `dist/Auto-Store Manager.AppImage`

---

## 🎮 Controls

**Di dalam App:**
- **Tab Dashboard**: Overview & quick actions
- **Tab Settings**: Configure bot
- **Tab About**: Informasi aplikasi

**Header:**
- **Bot Status**: 🟢 Online / 🔴 Offline
- **Start/Stop Button**: Control bot

---

## 🎯 Quick Commands

```bash
npm start           # Jalankan app
npm run build:win   # Build .exe untuk Windows
```
