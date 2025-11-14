# 📝 CARA SETUP AUTO-STORE (STEP BY STEP)

## ⚡ SUPER SIMPLE - IKUTI LANGKAH INI SAJA!

---

## 🎯 LANGKAH 1: INSTALL NODE.JS

Download dan install Node.js dari: https://nodejs.org/
- Pilih versi LTS (Long Term Support)
- Versi minimal: 18.0.0

Cek instalasi:
```bash
node --version
npm --version
```

---

## 🎯 LANGKAH 2: DOWNLOAD PROJECT

```bash
git clone <url-repository>
cd auto-store-discord
npm install
```

---

## 🎯 LANGKAH 3: BUAT BOT DISCORD

### 3.1 - Buka Discord Developer Portal
https://discord.com/developers/applications

### 3.2 - Buat Application Baru
1. Klik **"New Application"**
2. Kasih nama (contoh: "Auto Store Bot")
3. Klik **"Create"**

### 3.3 - Buat Bot
1. Klik tab **"Bot"** di sidebar kiri
2. Klik **"Add Bot"**
3. Klik **"Yes, do it!"**

### 3.4 - Copy Token Bot
1. Di halaman Bot, klik **"Reset Token"**
2. **COPY TOKEN INI** - simpan di notepad sementara
3. ⚠️ **JANGAN SHARE TOKEN KE SIAPAPUN!**

### 3.5 - Aktifkan Intents
Di halaman Bot, scroll ke bawah ke "Privileged Gateway Intents":
- ✅ Centang **"Server Members Intent"**
- ✅ Centang **"Message Content Intent"**
- Klik **"Save Changes"**

### 3.6 - Copy Application ID
1. Klik tab **"General Information"** di sidebar
2. Copy **"APPLICATION ID"** - simpan di notepad

### 3.7 - Copy Client Secret (untuk website - OPSIONAL)
1. Klik tab **"OAuth2"** di sidebar
2. Klik **"Reset Secret"**
3. **COPY SECRET INI** - simpan di notepad

### 3.8 - Invite Bot ke Server
1. Klik tab **"OAuth2"** → **"URL Generator"**
2. Centang scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Centang permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Use Slash Commands
4. Copy URL di bawah
5. Buka URL di browser
6. Pilih server dan invite bot

### 3.9 - Dapatkan Server ID & User ID
1. Buka Discord
2. Klik Settings → Advanced → **Aktifkan "Developer Mode"**
3. Klik kanan server Anda → **"Copy Server ID"** - simpan di notepad
4. Klik kanan profil Anda → **"Copy User ID"** - simpan di notepad

---

## 🎯 LANGKAH 4: SETUP DATABASE

### PILIHAN A: Pakai MySQL (Recommended)

#### Install MySQL:
**Windows:**
1. Download: https://dev.mysql.com/downloads/installer/
2. Install dan set password root

**Linux/Ubuntu:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### Buat Database:
```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE autostore;
EXIT;
```

✅ **SELESAI!** Tables akan otomatis dibuat saat bot pertama kali jalan.

---

### PILIHAN B: Pakai MongoDB (Alternative)

#### Install MongoDB:
**Windows:** Download dari https://www.mongodb.com/try/download/community

**Linux/Ubuntu:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

✅ **SELESAI!** Collections akan otomatis dibuat.

---

## 🎯 LANGKAH 5: SETUP PAYMENT PROVIDER

### PILIHAN A: Midtrans (Paling Mudah - Recommended)

1. Daftar di: https://midtrans.com
2. Login ke Dashboard
3. Klik **Settings** → **Access Keys**
4. **COPY** kedua key ini:
   - Server Key
   - Client Key

### PILIHAN B: Duitku

1. Daftar di: https://duitku.com
2. Login ke Dashboard
3. Klik **Settings** → **API**
4. **COPY**:
   - Merchant Code
   - API Key

### PILIHAN C: Tripay

1. Daftar di: https://tripay.co.id
2. Login ke Dashboard
3. Klik **Settings** → **API Key**
4. **COPY**:
   - Merchant Code
   - API Key
   - Private Key

---

## 🎯 LANGKAH 6: SETUP CONFIG.JSON

### 6.1 - Copy File Example
```bash
cp config.example.json config.json
```

### 6.2 - Edit config.json
Buka file `config.json` dengan text editor (Notepad, VSCode, dll)

### 6.3 - ISI KONFIGURASI

#### A. MODE
```json
"mode": "DiscordBotOnly"
```
Pilihan:
- `DiscordBotOnly` - Hanya bot Discord (paling simple)
- `WebOnly` - Hanya website
- `IntegratedMode` - Bot + Website

#### B. DATABASE
Jika pakai **MySQL**:
```json
"database": {
  "type": "mysql",
  "mysql": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "password_mysql_anda",
    "database": "autostore"
  }
}
```

Jika pakai **MongoDB**:
```json
"database": {
  "type": "mongodb",
  "mongodb": {
    "uri": "mongodb://localhost:27017/autostore"
  }
}
```

#### C. DISCORD BOT (WAJIB!)
```json
"discord": {
  "token": "PASTE_TOKEN_DARI_LANGKAH_3.4",
  "clientId": "PASTE_APPLICATION_ID_DARI_LANGKAH_3.6",
  "guildId": "PASTE_SERVER_ID_DARI_LANGKAH_3.9",
  "ownerId": "PASTE_USER_ID_ANDA_DARI_LANGKAH_3.9"
}
```

#### D. PAYMENT
Jika pakai **Midtrans**:
```json
"payment": {
  "provider": "midtrans",
  "midtrans": {
    "serverKey": "PASTE_SERVER_KEY_DARI_LANGKAH_5",
    "clientKey": "PASTE_CLIENT_KEY_DARI_LANGKAH_5",
    "isProduction": false
  }
}
```

Jika pakai **Duitku**:
```json
"payment": {
  "provider": "duitku",
  "duitku": {
    "merchantCode": "PASTE_MERCHANT_CODE",
    "apiKey": "PASTE_API_KEY",
    "callbackUrl": "https://domain-anda.com/api/payment/callback"
  }
}
```

Jika pakai **Tripay**:
```json
"payment": {
  "provider": "tripay",
  "tripay": {
    "merchantCode": "PASTE_MERCHANT_CODE",
    "apiKey": "PASTE_API_KEY",
    "privateKey": "PASTE_PRIVATE_KEY",
    "callbackUrl": "https://domain-anda.com/api/payment/callback"
  }
}
```

---

## 🎯 LANGKAH 7: JALANKAN BOT!

```bash
npm run bot
```

Jika berhasil, akan muncul:
```
[INFO] Discord bot ready! Logged in as YourBot#1234
[INFO] BOT STARTED SUCCESSFULLY
```

---

## 🎯 LANGKAH 8: TEST BOT

Di server Discord, ketik:
```
/balance check
```

Jika muncul embed dengan balance Anda, **BERHASIL!** ✅

---

## 📋 RINGKASAN FILE KONFIGURASI

### ✅ YANG PERLU ANDA EDIT:
**HANYA 1 FILE:** `config.json`

### ❌ JANGAN EDIT FILE INI:
- `config.example.json` - Ini template saja
- `.env.example` - Ini template saja
- File di folder `src/config/` - File lama, abaikan

---

## ❓ TROUBLESHOOTING

### Error: "Invalid token"
- Pastikan token Discord sudah benar
- Token ada di Discord Developer Portal → Bot → Reset Token

### Error: "Database connection failed"
- Cek MySQL/MongoDB sudah jalan
- Test: `mysql -u root -p` atau `mongosh`
- Pastikan password benar di config.json

### Error: "Cannot find module"
- Jalankan: `npm install`

### Bot tidak merespon slash commands
- Tunggu 5-10 menit (slash commands butuh waktu registrasi)
- Kick dan invite ulang bot
- Pastikan bot punya permission "Use Application Commands"

---

## 🎉 SELESAI!

Bot Auto-Store Anda sekarang sudah jalan!

### Command yang tersedia:
- `/balance check` - Cek saldo
- `/shop` - Lihat produk
- `/deposit <jumlah>` - Deposit saldo
- `/buy <product_id>` - Beli produk

### Admin commands:
- `/balance add <user> <jumlah>` - Tambah saldo user
- `/balance remove <user> <jumlah>` - Kurangi saldo user
- `/product add` - Tambah produk
- `/product list` - Lihat semua produk

---

## 📞 Butuh Bantuan?

Buka file `logs/system.log` untuk lihat error.

Jika masih bingung, screenshot error dan tanyakan!
