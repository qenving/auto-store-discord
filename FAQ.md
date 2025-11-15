# ❓ FAQ - Troubleshooting & Common Errors

## 📌 Daftar Isi

1. [Setup & Installation](#setup--installation)
2. [Configuration Errors](#configuration-errors)
3. [Database Issues](#database-issues)
4. [Discord Bot Issues](#discord-bot-issues)
5. [Payment Gateway Issues](#payment-gateway-issues)
6. [Desktop App Issues](#desktop-app-issues)
7. [Performance & Others](#performance--others)

---

## 🔧 Setup & Installation

### Q: Error "config.json not found"

**Jawaban:**
```bash
# Copy config template
cp config.example.json config.json

# Edit config.json
nano config.json  # atau pakai editor favorit Anda
```

**Penjelasan:** File `config.json` tidak di-commit ke git untuk keamanan. Anda harus copy dari template `config.example.json`.

---

### Q: npm install gagal atau ada error

**Solusi 1 - Clear cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solusi 2 - Update Node.js:**
```bash
node --version  # Harus >= 18.0.0
```

Download Node.js terbaru dari: https://nodejs.org/

---

### Q: Saya bingung folder mana yang harus digunakan?

**Jawaban:**

✅ **GUNAKAN FOLDER INI:**
- `/bot` - Discord bot (official v2)
- `/shared` - Core modules
- `/gui` - Desktop GUI
- `/web` - Web dashboard
- `/scripts` - CLI tools

❌ **JANGAN GUNAKAN:**
- `/legacy/v1-bot` - Kode lama (deprecated)
- `/desktop` - Experimental (use `/gui` instead)

---

## ⚙️ Configuration Errors

### Q: Error "Invalid mode"

**Penyebab:** Field `mode` di `config.json` salah

**Solusi:**
```json
{
  "mode": "DiscordBotOnly"  // Pilihan: DiscordBotOnly, WebOnly, IntegratedMode
}
```

**Validasi config:**
```bash
npm run test:config
```

---

### Q: Error "Discord bot token not specified"

**Solusi:**

1. Buka https://discord.com/developers/applications
2. Pilih application Anda (atau buat baru)
3. Menu **Bot** → **Reset Token** → Copy token
4. Paste ke `config.json`:

```json
{
  "discord": {
    "token": "MTIzNDU2Nzg5MDEyMzQ1Njc4.GaBcDe...."  // PASTE DI SINI
  }
}
```

⚠️ **JANGAN SHARE TOKEN KE SIAPAPUN!**

---

### Q: Error "Database type not specified"

**Solusi:**
```json
{
  "database": {
    "type": "mysql"  // Pilihan: "mysql" atau "mongodb"
  }
}
```

Baca **KONFIGURASI.md** untuk detail lengkap.

---

## 🗄️ Database Issues

### Q: MySQL connection failed / ECONNREFUSED

**Penyebab:** MySQL service tidak running atau credentials salah

**Solusi 1 - Cek MySQL service:**

**Windows:**
- Buka Services → Cari "MySQL80" → Klik Start

**Linux:**
```bash
sudo systemctl status mysql
sudo systemctl start mysql
```

**macOS:**
```bash
brew services list
brew services start mysql
```

**Solusi 2 - Test connection manual:**
```bash
mysql -u root -p
# Masukkan password
```

**Solusi 3 - Create database:**
```sql
CREATE DATABASE autostore;
SHOW DATABASES;  -- Pastikan 'autostore' ada
```

**Solusi 4 - Check config:**
```json
{
  "database": {
    "type": "mysql",
    "mysql": {
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "YOUR_MYSQL_PASSWORD",  // PENTING!
      "database": "autostore"
    }
  }
}
```

---

### Q: MongoDB connection failed

**Untuk MongoDB Local:**

```bash
# Check if mongod is running
sudo systemctl status mongod  # Linux
brew services list  # macOS

# Start mongod
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

**Config untuk MongoDB local:**
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

**Untuk MongoDB Atlas (Cloud):**

1. Buka https://cloud.mongodb.com
2. Database → Connect → Drivers
3. Copy connection string
4. Ganti `<password>` dengan password database Anda
5. Pastikan **Network Access** allow 0.0.0.0/0

```json
{
  "database": {
    "type": "mongodb",
    "mongodb": {
      "uri": "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?appName=Cluster0"
    }
  }
}
```

---

### Q: Error "Tables not found" atau "Collection not found"

**Jawaban:** Tables/collections dibuat otomatis saat pertama kali bot dijalankan.

**Solusi:**
```bash
# Test database connection dulu
npm run test:database

# Jika OK, start bot (akan auto-create tables)
npm run bot
```

---

## 🤖 Discord Bot Issues

### Q: Slash commands tidak muncul di Discord

**Penyebab:** Commands belum di-register atau permissions salah

**Solusi:**

1. **Restart bot** (commands auto-register saat startup):
```bash
npm run bot
```

2. **Check logs** untuk error saat register commands

3. **Pastikan bot punya permissions:**
   - Bot → Privileged Gateway Intents:
     - ✅ Server Members Intent
     - ✅ Message Content Intent (jika diperlukan)

4. **Re-invite bot dengan scope yang benar:**
   - OAuth2 → URL Generator
   - Scopes: `bot` + `applications.commands`
   - Permissions: Administrator (untuk testing)

---

### Q: Bot online tapi tidak merespon command

**Checklist:**

1. **Pastikan guildId benar:**
```json
{
  "discord": {
    "guildId": "YOUR_SERVER_ID"  // Right-click server → Copy ID
  }
}
```

2. **Aktifkan Developer Mode:**
   - User Settings → Advanced → Developer Mode → ON

3. **Check bot permissions di server:**
   - Server Settings → Roles → Bot Role → Permissions

4. **Lihat console untuk error logs**

---

### Q: Bot crash dengan error "Invalid token"

**Solusi:**

1. **Reset token:**
   - Discord Developer Portal → Bot → Reset Token
   - Copy token baru → Update `config.json`

2. **Pastikan tidak ada spasi/enter di token:**
```json
{
  "discord": {
    "token": "MTIzNDU2.xxxxx.yyyyy"  // Satu baris, no spasi
  }
}
```

3. **Restart bot:**
```bash
npm run bot
```

---

### Q: Error "Missing Access" atau "Missing Permissions"

**Penyebab:** Bot tidak punya permissions yang cukup

**Solusi:**

1. **Check role hierarchy:**
   - Role bot harus di atas role user yang menggunakan command

2. **Give Administrator permission** (untuk testing):
   - Server Settings → Roles → Bot Role → Administrator

3. **Channel permissions:**
   - Pastikan bot bisa read/send messages di channel

---

## 💳 Payment Gateway Issues

### Q: Payment callback tidak berfungsi

**Penyebab:** Callback URL tidak bisa diakses dari internet

**Solusi untuk Development:**

1. **Gunakan ngrok atau localtunnel:**
```bash
# Install ngrok
npm install -g ngrok

# Expose port 3001 (API server)
ngrok http 3001
```

2. **Update callback URL di payment provider:**
```
Midtrans: https://your-ngrok-url.ngrok.io/api/payment/callback
```

3. **Update config.json:**
```json
{
  "payment": {
    "midtrans": {
      "callbackUrl": "https://your-ngrok-url.ngrok.io/api/payment/callback"
    }
  }
}
```

**Untuk Production:**
- Deploy ke VPS/Cloud dengan public IP
- Gunakan domain + SSL certificate

---

### Q: Midtrans error "Merchant not found"

**Solusi:**

1. **Check serverKey & clientKey:**
   - Dashboard Midtrans → Settings → Access Keys

2. **Pastikan environment match:**
```json
{
  "payment": {
    "midtrans": {
      "isProduction": false  // false = sandbox, true = production
    }
  }
}
```

**Sandbox keys:**
- Server Key: `SB-Mid-server-...`
- Client Key: `SB-Mid-client-...`

**Production keys:**
- Server Key: `Mid-server-...`
- Client Key: `Mid-client-...`

---

## 🖥️ Desktop App Issues

### Q: Desktop app tidak bisa dibuka

**Solusi:**

1. **Check logs:**
```bash
npm start
# Lihat error di console
```

2. **Build ulang:**
```bash
rm -rf dist node_modules
npm install
npm run build:win  # atau :mac / :linux
```

3. **Jalankan tanpa build:**
```bash
npm start  # Run Electron directly
```

---

### Q: GUI tidak load / blank screen

**Penyebab:** Backend tidak running atau port conflict

**Solusi:**

1. **Check backend logs** di console

2. **Check port 3000 & 3001** tidak dipakai aplikasi lain:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3000
lsof -i :3001
```

3. **Kill process yang pakai port:**
```bash
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

---

## ⚡ Performance & Others

### Q: Bot lambat / high memory usage

**Solusi:**

1. **Disable unused features:**
```json
{
  "features": {
    "autoDelivery": true,
    "autoExpireInvoice": false,  // Disable jika tidak perlu
    "maintenance": false
  }
}
```

2. **Optimize database:**
   - Add indexes untuk queries yang sering dipakai
   - Cleanup old data

3. **Use production mode:**
```bash
NODE_ENV=production npm run bot
```

---

### Q: Bagaimana cara update project ke versi terbaru?

**Solusi:**

1. **Backup config:**
```bash
cp config.json config.json.backup
```

2. **Pull latest changes:**
```bash
git stash  # Save local changes
git pull origin main
git stash pop  # Restore local changes
```

3. **Update dependencies:**
```bash
npm install
```

4. **Merge config changes:**
   - Compare `config.example.json` dengan `config.json`
   - Add new fields yang diperlukan

5. **Test:**
```bash
npm run test:config
npm run test:database
npm run bot
```

---

### Q: Bot tiba-tiba mati / crash

**Solusi:**

1. **Gunakan process manager (PM2):**
```bash
npm install -g pm2

# Start with PM2
pm2 start bot/index.js --name "autostore-bot"

# Auto-restart on crash
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs autostore-bot
```

2. **Check logs untuk error:**
```bash
# PM2 logs
pm2 logs

# Manual logs (jika ada)
cat logs/bot.log
```

---

### Q: Dimana saya bisa minta bantuan?

**Resources:**

1. **Dokumentasi:**
   - `README.md` - Overview & Quick Start
   - `KONFIGURASI.md` - Config field explanations
   - `CARA_SETUP.md` - Step-by-step setup

2. **CLI Tools:**
```bash
npm run cli              # Help menu
npm run test:config      # Validate config
npm run test:database    # Test database
npm run health           # Health check
```

3. **GitHub Issues:**
   - Report bugs
   - Request features
   - Ask questions

---

## 🆘 Still Having Issues?

### Langkah Debugging:

1. **Run health check:**
```bash
npm run health
```

2. **Validate config:**
```bash
npm run test:config
```

3. **Test database:**
```bash
npm run test:database
```

4. **Check logs dengan detail:**
```bash
npm run bot  # Lihat console output
```

5. **Buat issue di GitHub** dengan informasi:
   - Operating System (Windows/Linux/macOS)
   - Node.js version (`node --version`)
   - Error message lengkap (copy-paste dari console)
   - Config yang digunakan (sensor secrets!)
   - Steps to reproduce error

---

**Terakhir diupdate:** 2025-11-15
**Versi:** 2.0.0
