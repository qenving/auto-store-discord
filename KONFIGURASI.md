# ⚙️ SISTEM KONFIGURASI - PENJELASAN LENGKAP

## 🎯 SIMPLE: HANYA 1 FILE!

Untuk menghindari kebingungan, sistem Auto-Store **HANYA menggunakan 1 file konfigurasi**:

```
📁 auto-store-discord/
  └─ config.json  ← EDIT FILE INI SAJA!
```

---

## ❌ FILE YANG JANGAN DIEDIT

### 1. `config.example.json`
- Ini adalah **TEMPLATE** saja
- Jangan edit file ini
- Gunanya untuk copy jadi `config.json`

### 2. `.env` dan `.env.example`
- File ini **TIDAK DIPAKAI** dalam sistem ini
- Sudah dihapus untuk menghindari kebingungan
- Semua konfigurasi ada di `config.json`

### 3. `src/config/config.json`
- Ini file **LAMA** dari sistem versi sebelumnya
- **ABAIKAN** file ini
- Sistem baru tidak menggunakan file ini

---

## ✅ CARA SETUP KONFIGURASI

### LANGKAH 1: Copy Template

```bash
cp config.example.json config.json
```

### LANGKAH 2: Edit config.json

Buka `config.json` dengan text editor favorit Anda (Notepad, VSCode, Sublime, dll)

---

## 📝 PENJELASAN SETIAP BAGIAN

### 🔹 1. MODE OPERASI

```json
"mode": "DiscordBotOnly"
```

**Pilihan:**
- `DiscordBotOnly` - **RECOMMENDED untuk pemula!**
  - Hanya jalankan Discord bot
  - Paling simple, tidak perlu website
  - Cocok untuk auto-store sederhana

- `WebOnly` - Hanya website (tanpa bot)
  - Jarang dipakai
  - Untuk testing website saja

- `IntegratedMode` - Bot + Website terintegrasi
  - Fitur paling lengkap
  - Butuh setup lebih kompleks
  - Untuk production dengan dashboard admin

**MULAI DENGAN:** `DiscordBotOnly`

---

### 🔹 2. DATABASE

```json
"database": {
  "type": "mysql"
}
```

**Pilih salah satu:** `mysql` atau `mongodb`

#### Jika pakai MySQL:

```json
"database": {
  "type": "mysql",
  "mysql": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "password_anda",
    "database": "autostore"
  }
}
```

**Cara install MySQL:**
- Windows: Download dari https://dev.mysql.com/downloads/installer/
- Linux: `sudo apt install mysql-server`

**Buat database:**
```bash
mysql -u root -p
CREATE DATABASE autostore;
```

Tables akan **auto-create** saat bot pertama kali jalan!

#### Jika pakai MongoDB:

```json
"database": {
  "type": "mongodb",
  "mongodb": {
    "uri": "mongodb://localhost:27017/autostore"
  }
}
```

**Cara install MongoDB:**
- Windows: Download dari https://www.mongodb.com/try/download/community
- Linux: Lihat panduan di CARA_SETUP.md

Collections akan **auto-create** saat bot pertama kali jalan!

---

### 🔹 3. DISCORD BOT (WAJIB!)

```json
"discord": {
  "token": "PASTE_TOKEN_ANDA",
  "clientId": "PASTE_CLIENT_ID",
  "guildId": "PASTE_SERVER_ID",
  "ownerId": "PASTE_USER_ID_ANDA"
}
```

**Cara mendapatkan:**

1. **Token & Client ID:**
   - Buka https://discord.com/developers/applications
   - Buat application baru
   - Tab "Bot" → Reset Token → Copy
   - Tab "General Information" → Copy Application ID

2. **Guild ID (Server ID):**
   - Buka Discord
   - Settings → Advanced → Enable "Developer Mode"
   - Klik kanan server Anda → Copy Server ID

3. **Owner ID (User ID Anda):**
   - Klik kanan profil Anda di Discord → Copy User ID

**Channels (Opsional):**
```json
"channels": {
  "testimoni": "ID_CHANNEL_TESTIMONI",
  "orderLog": "ID_CHANNEL_LOG_ORDER",
  "paymentLog": "ID_CHANNEL_LOG_PAYMENT",
  "adminLog": "ID_CHANNEL_LOG_ADMIN"
}
```

Bisa dikosongkan jika tidak perlu. Hanya untuk logging.

---

### 🔹 4. PAYMENT GATEWAY

```json
"payment": {
  "provider": "midtrans"
}
```

**Pilih salah satu:** `midtrans`, `duitku`, atau `tripay`

#### Option A: Midtrans (RECOMMENDED!)

```json
"payment": {
  "provider": "midtrans",
  "midtrans": {
    "serverKey": "SB-Mid-server-xxx",
    "clientKey": "SB-Mid-client-xxx",
    "isProduction": false
  }
}
```

**Cara daftar:**
1. Daftar di https://midtrans.com
2. Login → Settings → Access Keys
3. Copy Server Key & Client Key
4. `isProduction: false` untuk testing, `true` untuk production

#### Option B: Duitku

```json
"payment": {
  "provider": "duitku",
  "duitku": {
    "merchantCode": "D1234",
    "apiKey": "xxx",
    "callbackUrl": "https://domain-anda.com/api/payment/callback"
  }
}
```

#### Option C: Tripay

```json
"payment": {
  "provider": "tripay",
  "tripay": {
    "merchantCode": "T1234",
    "apiKey": "xxx",
    "privateKey": "xxx",
    "callbackUrl": "https://domain-anda.com/api/payment/callback"
  }
}
```

---

### 🔹 5. FITUR-FITUR

```json
"features": {
  "autoDelivery": true,
  "autoExpireInvoice": true,
  "testimoniIntegration": false,
  "maintenance": false
}
```

**Penjelasan:**
- `autoDelivery`: Otomatis kirim produk via DM setelah pembelian
- `autoExpireInvoice`: Otomatis cancel invoice yang expired
- `testimoniIntegration`: Integrasi testimoni (untuk IntegratedMode)
- `maintenance`: Mode maintenance (bot tidak terima command)

---

### 🔹 6. LIMITS

```json
"limits": {
  "maxPendingOrders": 5,
  "minDeposit": 10000,
  "maxDeposit": 10000000
}
```

**Penjelasan:**
- `maxPendingOrders`: Maksimal pending order per user
- `minDeposit`: Minimal deposit (dalam Rupiah)
- `maxDeposit`: Maksimal deposit (dalam Rupiah)

---

## 🎯 CONTOH KONFIGURASI LENGKAP

### Untuk Pemula (Bot Only + MySQL + Midtrans):

```json
{
  "mode": "DiscordBotOnly",

  "database": {
    "type": "mysql",
    "mysql": {
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "passwordsaya123",
      "database": "autostore"
    }
  },

  "discord": {
    "token": "YOUR_DISCORD_BOT_TOKEN_HERE",
    "clientId": "YOUR_APPLICATION_ID_HERE",
    "guildId": "YOUR_SERVER_ID_HERE",
    "ownerId": "YOUR_USER_ID_HERE",
    "channels": {
      "testimoni": "",
      "orderLog": "",
      "paymentLog": "",
      "adminLog": ""
    }
  },

  "payment": {
    "provider": "midtrans",
    "autoExpireMinutes": 15,
    "midtrans": {
      "serverKey": "YOUR_MIDTRANS_SERVER_KEY",
      "clientKey": "YOUR_MIDTRANS_CLIENT_KEY",
      "isProduction": false
    }
  },

  "features": {
    "autoDelivery": true,
    "autoExpireInvoice": true,
    "testimoniIntegration": false,
    "maintenance": false
  },

  "limits": {
    "maxPendingOrders": 5,
    "minDeposit": 10000,
    "maxDeposit": 10000000
  }
}
```

---

## ❓ FAQ

### Q: Harus isi semua bagian di config.json?
**A:** TIDAK! Jika Anda pakai mode `DiscordBotOnly`, cukup isi:
- mode
- database
- discord
- payment
- features
- limits

Bagian `website` dan `oauth` bisa diabaikan.

### Q: File .env dipakai gak?
**A:** TIDAK! Sistem ini tidak pakai .env. Semua konfigurasi di `config.json`.

### Q: src/config/config.json itu apa?
**A:** File LAMA dari sistem sebelumnya. ABAIKAN saja. Sistem baru tidak pakai file itu.

### Q: Gimana cara aman simpan config.json?
**A:**
1. Jangan commit `config.json` ke git (sudah ada di .gitignore)
2. Copy `config.example.json` untuk template
3. `config.json` hanya ada di server Anda

### Q: Token Discord saya ketahuan orang gimana?
**A:**
1. LANGSUNG reset token di Discord Developer Portal
2. Update `config.json` dengan token baru
3. Restart bot

---

## 🔒 KEAMANAN

### JANGAN PERNAH:
❌ Commit `config.json` ke GitHub
❌ Share token Discord ke siapapun
❌ Share API key payment ke siapapun
❌ Upload screenshot yang ada token/key

### LAKUKAN:
✅ Simpan `config.json` hanya di server
✅ Backup `config.json` di tempat aman
✅ Ganti password database secara berkala
✅ Gunakan password yang kuat

---

## 🎉 SELESAI!

Sekarang Anda sudah paham sistem konfigurasi Auto-Store!

**Ringkasan:**
- ✅ Hanya edit `config.json`
- ✅ Abaikan file lain
- ✅ Ikuti panduan di `CARA_SETUP.md`

**Next step:**
Lihat file `CARA_SETUP.md` untuk panduan lengkap setup dari awal sampai bot jalan!
