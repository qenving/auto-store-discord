# 🚀 DEPLOYMENT GUIDE

Complete guide for deploying Auto-Store Ecosystem to production.

## 📋 Table of Contents

1. [Server Requirements](#server-requirements)
2. [Server Setup (VPS/Cloud)](#server-setup)
3. [Nginx Configuration](#nginx-configuration)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [PM2 Process Manager](#pm2-process-manager)
6. [Database Optimization](#database-optimization)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Backups](#monitoring--backups)

---

## 1. Server Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ or Debian 11+
- **Bandwidth**: 100GB/month

### Recommended for Production
- **CPU**: 4 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Bandwidth**: Unlimited

### Recommended VPS Providers
- DigitalOcean ($12/month - 2GB RAM)
- Vultr ($12/month - 2GB RAM)
- Linode ($12/month - 2GB RAM)
- AWS Lightsail ($10/month - 2GB RAM)

---

## 2. Server Setup

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Create Application User

```bash
# Create user
sudo adduser autostore --disabled-password --gecos ""

# Add to sudo group (optional)
sudo usermod -aG sudo autostore

# Switch to user
sudo su - autostore
```

### Step 4: Clone and Setup Application

```bash
# Clone repository
cd ~
git clone https://github.com/your-repo/auto-store-discord.git
cd auto-store-discord

# Install dependencies
npm install --production

# Copy and configure
cp config.example.json config.json
nano config.json
```

---

## 3. Nginx Configuration

### Step 1: Install Nginx

```bash
sudo apt install -y nginx
```

### Step 2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/autostore
```

**For Website (Next.js):**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # For Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Payment callback endpoint
    location /api/payment/callback {
        proxy_pass http://localhost:3000/api/payment/callback;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for payment callbacks
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/autostore_access.log;
    error_log /var/log/nginx/autostore_error.log;

    # File size limit
    client_max_body_size 10M;
}
```

### Step 3: Enable Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/autostore /etc/nginx/sites-enabled/

# Remove default
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 4. SSL Certificate Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### Nginx will auto-update to:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 5. PM2 Process Manager

### Step 1: Install PM2

```bash
sudo npm install -g pm2
```

### Step 2: Create Ecosystem File

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'autostore-bot',
    script: './index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### Step 3: Start Application

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Or start directly
pm2 start index.js --name "autostore"

# View status
pm2 status

# View logs
pm2 logs autostore

# Monitor
pm2 monit
```

### Step 4: Setup Startup Script

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

### PM2 Useful Commands

```bash
# Restart
pm2 restart autostore

# Stop
pm2 stop autostore

# Delete
pm2 delete autostore

# View detailed info
pm2 info autostore

# Clear logs
pm2 flush
```

---

## 6. Database Optimization

### MySQL Optimization

```bash
sudo nano /etc/mysql/my.cnf
```

```ini
[mysqld]
# Performance
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection
max_connections = 200
wait_timeout = 28800
interactive_timeout = 28800

# Query cache
query_cache_type = 1
query_cache_size = 64M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

```bash
sudo systemctl restart mysql
```

### MongoDB Optimization

```bash
sudo nano /etc/mongod.conf
```

```yaml
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1

net:
  port: 27017
  bindIp: 127.0.0.1

security:
  authorization: enabled
```

```bash
sudo systemctl restart mongod
```

---

## 7. Security Hardening

### Step 1: Firewall Setup

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 2: Fail2Ban (Prevent Brute Force)

```bash
# Install
sudo apt install -y fail2ban

# Copy config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Start service
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Step 3: Secure Permissions

```bash
# Secure config files
chmod 600 config.json
chmod 600 .env

# Secure logs directory
chmod 755 logs/
```

### Step 4: Environment Variables

**Never commit sensitive data!**

```bash
# Use .env for production
nano .env
```

```env
DISCORD_TOKEN=your_token_here
MYSQL_PASSWORD=your_password_here
PAYMENT_SERVER_KEY=your_key_here
```

---

## 8. Monitoring & Backups

### Monitoring with PM2 Plus (Optional)

```bash
# Link to PM2 Plus
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# Enable monitoring
pm2 install pm2-server-monit
```

### Database Backups

**MySQL Backup Script:**

```bash
nano ~/backup-mysql.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/autostore/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="autostore"
DB_USER="root"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/autostore_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: autostore_$DATE.sql.gz"
```

```bash
chmod +x ~/backup-mysql.sh
```

**MongoDB Backup Script:**

```bash
nano ~/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/autostore/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --db=autostore --out=$BACKUP_DIR/mongo_$DATE

tar -czf $BACKUP_DIR/mongo_$DATE.tar.gz -C $BACKUP_DIR mongo_$DATE
rm -rf $BACKUP_DIR/mongo_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongo_$DATE.tar.gz"
```

```bash
chmod +x ~/backup-mongodb.sh
```

**Setup Cron Job:**

```bash
crontab -e
```

```cron
# Backup database daily at 2 AM
0 2 * * * /home/autostore/backup-mysql.sh >> /home/autostore/logs/backup.log 2>&1
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] Server is updated and secured
- [ ] Nginx is configured with SSL
- [ ] PM2 is running the application
- [ ] Database is optimized
- [ ] Firewall is enabled
- [ ] Backups are automated
- [ ] Logs are being collected
- [ ] Payment callback URL is HTTPS
- [ ] All secrets are in environment variables
- [ ] Discord bot has proper permissions
- [ ] Payment provider is in production mode
- [ ] Domain DNS is configured
- [ ] Monitoring is set up

---

## 🎉 Deployment Complete!

Your Auto-Store system is now live in production!

### Post-Deployment

1. **Monitor logs regularly:**
   ```bash
   pm2 logs
   tail -f logs/system.log
   ```

2. **Check system health:**
   ```bash
   pm2 monit
   htop
   ```

3. **Update regularly:**
   ```bash
   git pull
   npm install
   pm2 restart autostore
   ```

---

**Need help? Open an issue on GitHub!**
