# ⚠️ FOLDER LEGACY - JANGAN GUNAKAN UNTUK PROJECT BARU!

## 📌 Penjelasan

Folder `legacy/` ini berisi **kode lama (versi 1)** dari Auto-Store Discord Bot yang sudah **TIDAK DIGUNAKAN LAGI**.

### ❌ JANGAN:
- ❌ Gunakan kode di folder ini untuk project baru
- ❌ Edit atau modifikasi file di sini
- ❌ Jalankan bot dari folder ini
- ❌ Bingung antara folder ini dengan folder `/bot` yang official

### ℹ️ Kenapa folder ini masih ada?

Folder ini disimpan **HANYA untuk referensi** bagi developer yang ingin:
- Melihat implementasi lama
- Migrate fitur tertentu ke versi baru
- Memahami perubahan arsitektur

---

## ✅ GUNAKAN INI SEBAGAI GANTINYA:

### **Untuk Discord Bot:**
```bash
📁 /bot/           ← Official Discord Bot v2
```
Entrypoint: `bot/index.js`
Command: `npm run bot`

### **Untuk Web Dashboard:**
```bash
📁 /web/           ← Official Web Dashboard
```
Entrypoint: `web/`
Command: `npm run web`

### **Untuk Desktop App:**
```bash
📁 /gui/           ← Official Desktop GUI
```
Entrypoint: `index.js` atau `electron-main.js`
Command: `npm start`

### **Untuk Shared Core Modules:**
```bash
📁 /shared/        ← Shared libraries (ConfigManager, Database, Payment, Logger)
```

---

## 📚 Dokumentasi Official

Baca dokumentasi lengkap di:
- **README.md** - Panduan utama & Quick Start
- **KONFIGURASI.md** - Penjelasan config.json
- **CARA_SETUP.md** - Step-by-step setup
- **FAQ.md** - Troubleshooting & common errors

---

## 🗂️ Isi Folder Legacy

### `/legacy/v1-bot` (dulunya `/src`)
**Kode bot Discord versi 1** dengan struktur:
- `v1-bot/index.js` - Bot lama
- `v1-bot/config/` - Config lama (JANGAN PAKAI!)
- `v1-bot/slashCommands/` - Commands lama
- `v1-bot/events/` - Events lama
- `v1-bot/Schema/` - MongoDB schemas lama
- `v1-bot/handlers/` - Handlers lama

**Status:** DEPRECATED ❌

---

## 📞 Bantuan

Jika Anda user baru dan bingung:
1. **ABAIKAN folder `legacy/` ini sepenuhnya**
2. Baca **README.md** di root project
3. Ikuti **CARA_SETUP.md** untuk setup project
4. Gunakan folder **`/bot`**, **`/web`**, **`/gui`**, dan **`/shared`**

---

**Terakhir diupdate:** 2024-11-15
**Alasan refactor:** Memisahkan legacy code agar tidak membingungkan user baru
