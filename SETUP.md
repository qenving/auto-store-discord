# 📚 SETUP GUIDE - AUTO-STORE ECOSYSTEM

Complete step-by-step setup guide for Auto-Store system.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Discord Bot Setup](#discord-bot-setup)
4. [Database Setup](#database-setup)
5. [Payment Provider Setup](#payment-provider-setup)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Database**: MySQL 8.0+ OR MongoDB 4.4+
- **OS**: Linux, Windows, or macOS

### Accounts Needed
- Discord Developer Account
- Payment Provider Account (choose one):
  - Midtrans (recommended for Indonesia)
  - Duitku
  - Tripay

---

## 2. Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-repo/auto-store-discord.git
cd auto-store-discord
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- discord.js
- mysql2 / mongoose
- axios
- uuid
- node-cron
- And more...

---

## 3. Discord Bot Setup

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application (e.g., "Auto-Store Bot")
4. Click "Create"

### Step 2: Create Bot User

1. Go to "Bot" tab
2. Click "Add Bot"
3. Click "Yes, do it!"
4. **Copy the Token** (you'll need this later)

### Step 3: Enable Required Intents

1. Still in "Bot" tab, scroll to "Privileged Gateway Intents"
2. Enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent (if needed)

### Step 4: Configure OAuth2

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Use Slash Commands
4. Copy the generated URL and open it to invite the bot

### Step 5: Get IDs

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your server → Copy ID (this is `guildId`)
3. Right-click your profile → Copy ID (this is your `ownerId`)
4. Copy the Application ID from "General Information" (this is `clientId`)

---

## 4. Database Setup

Choose ONE database system:

### Option A: MySQL

**Installation:**

Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

Windows: Download from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)

**Create Database:**
```bash
mysql -u root -p
```

```sql
CREATE DATABASE autostore;
CREATE USER 'autostore_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON autostore.* TO 'autostore_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Note:** Tables will be created automatically on first run!

### Option B: MongoDB

**Installation:**

Ubuntu:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

Windows: Download from [MongoDB Downloads](https://www.mongodb.com/try/download/community)

**No database creation needed** - MongoDB will auto-create!

---

## 5. Payment Provider Setup

Choose ONE payment provider:

### Option A: Midtrans (Recommended)

1. Sign up at [Midtrans](https://midtrans.com)
2. Go to Settings → Access Keys
3. Copy:
   - **Server Key**
   - **Client Key**
4. For testing, use Sandbox mode

### Option B: Duitku

1. Sign up at [Duitku](https://duitku.com)
2. Go to Dashboard → API Settings
3. Copy:
   - **Merchant Code**
   - **API Key**
4. Set callback URL: `https://yourdomain.com/api/payment/callback`

### Option C: Tripay

1. Sign up at [Tripay](https://tripay.co.id)
2. Go to Settings → API Key
3. Copy:
   - **Merchant Code**
   - **API Key**
   - **Private Key**
4. Set callback URL

---

## 6. Configuration

### Step 1: Create config.json

```bash
cp config.example.json config.json
nano config.json
```

Fill in your details:

```json
{
  "mode": "IntegratedMode",
  "database": {
    "type": "mysql",
    "mysql": {
      "host": "localhost",
      "port": 3306,
      "user": "autostore_user",
      "password": "your_password",
      "database": "autostore"
    }
  },
  "discord": {
    "token": "YOUR_BOT_TOKEN",
    "clientId": "YOUR_CLIENT_ID",
    "guildId": "YOUR_GUILD_ID",
    "ownerId": "YOUR_DISCORD_ID"
  },
  "payment": {
    "provider": "midtrans",
    "midtrans": {
      "serverKey": "YOUR_SERVER_KEY",
      "clientKey": "YOUR_CLIENT_KEY",
      "isProduction": false
    }
  }
}
```

### Step 2: Create .env (Optional)

```bash
cp .env.example .env
nano .env
```

Environment variables can override config.json.

---

## 7. Running the Application

### Development Mode

```bash
# Run bot only
npm run bot

# Run with auto-reload
npm run dev
```

### Production Mode

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start index.js --name "auto-store"

# View logs
pm2 logs auto-store

# Restart
pm2 restart auto-store

# Stop
pm2 stop auto-store
```

---

## 8. Troubleshooting

### Bot won't start

**Error: "Invalid token"**
- Check your Discord bot token in config.json
- Make sure there are no extra spaces

**Error: "Database connection failed"**
- Check database credentials
- Make sure MySQL/MongoDB is running
- Test connection: `mysql -u root -p` or `mongosh`

**Error: "Cannot find module"**
- Run `npm install` again
- Check Node.js version: `node --version`

### Commands not showing

1. Make sure bot has `applications.commands` scope
2. Wait a few minutes (global commands take time)
3. Use guild commands for instant registration
4. Check bot permissions in Discord

### Payment not working

**QRIS not generating:**
- Check payment provider credentials
- Make sure you're using sandbox keys for testing
- Check provider dashboard for errors

**Callback not received:**
- Use ngrok for local testing: `ngrok http 3000`
- Update callback URL in provider dashboard
- Check firewall settings

### Database errors

**MySQL: "Access denied"**
```bash
# Reset MySQL password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
```

**MongoDB: "Connection refused"**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

---

## 📞 Need Help?

- Check logs in `/logs` directory
- Read error messages carefully
- Open an issue on GitHub
- Join our Discord support server

---

## ✅ Checklist

Before going live, make sure:

- [ ] Bot token is secure (never share it!)
- [ ] Database is backed up regularly
- [ ] Payment provider is set to production mode
- [ ] Callback URL is HTTPS
- [ ] All sensitive data is in .env (not config.json)
- [ ] Logs directory has write permissions
- [ ] Bot has required Discord permissions
- [ ] Server has enough resources (RAM, CPU)

---

**Setup Complete! 🎉**

Your Auto-Store system is now ready to use!
