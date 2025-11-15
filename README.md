# 🚀 AUTO-STORE ECOSYSTEM v2.0

> **Full-Stack Auto-Store System** - Discord Bot + Website + Multi-Database + QRIS Payment Integration

## ✨ Features

### 🎯 Core Features
- ✅ **3 Operation Modes**: DiscordBotOnly, WebOnly, IntegratedMode
- ✅ **Multi-Database Support**: MySQL & MongoDB with Adapter Pattern
- ✅ **QRIS Payment**: Midtrans, Duitku, Tripay integration
- ✅ **Auto-Delivery System**: Automatic product delivery via DM
- ✅ **Auto-Cancel Invoice**: Expired payments automatically cancelled
- ✅ **Professional Logging**: File-based logging system
- ✅ **Health Monitoring**: System health check & uptime tracking

### 🤖 Discord Bot Features ✅ COMPLETE
- ✅ Slash commands with cooldown system
- ✅ Balance management (check/add/remove)
- ✅ Shop browsing with categories
- ✅ QRIS deposit system with auto-QR
- ✅ Order history with filters
- ✅ Auto-delivery to DM
- ✅ Stock management (add/bulk/view/clear)
- ✅ Product management (add/edit/delete/list)
- ✅ Maintenance mode system
- ✅ System statistics & analytics
- ✅ Comprehensive help system
- ✅ Event-driven architecture

### 🌐 Website Features (Structure Ready)
- ✅ Next.js 14 with App Router
- ✅ Tailwind CSS configured
- ✅ Basic structure & pages
- 🔄 Admin dashboard (in development)
- 🔄 User dashboard with Discord OAuth2 (in development)
- 🔄 Product management UI (in development)
- 🔄 API routes (in development)
- 📝 Note: Use `DiscordBotOnly` mode for full functionality now

### 💳 Payment Features
- QRIS payment support
- Multiple provider support
- Auto-expire invoices
- Callback verification
- Payment status tracking
- Secure signature validation

## 📁 Project Structure

```
auto-store-discord/
├── shared/                 # Shared libraries
│   ├── config/            # Configuration management
│   ├── database/          # Multi-database layer
│   │   ├── interfaces/    # Repository interfaces
│   │   ├── mysql/         # MySQL implementation
│   │   ├── mongodb/       # MongoDB implementation
│   │   └── provider/      # Database provider (factory)
│   ├── payment/           # Payment services
│   ├── logger/            # Logging system
│   ├── utils/             # Utilities
│   └── services/          # Business services
├── bot/                   # Discord bot
│   ├── core/              # Bot client
│   ├── commands/          # Slash commands
│   ├── events/            # Event handlers
│   ├── handlers/          # Command & event loaders
│   └── index.js           # Bot entry point
├── web/                   # Next.js website (planned)
├── config.json            # Main configuration
├── .env                   # Environment variables
├── package.json           # Dependencies
└── index.js               # Main entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MySQL 8.0+ OR MongoDB 4.4+
- Discord Bot Token
- Payment Provider Account (Midtrans/Duitku/Tripay)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd auto-store-discord
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure the system**
```bash
# Copy example files
cp config.example.json config.json
cp .env.example .env

# Edit config.json and .env with your settings
```

4. **Setup database**

For MySQL:
```bash
# Import the schema (tables will auto-create)
# Just make sure your database exists
mysql -u root -p -e "CREATE DATABASE autostore"
```

For MongoDB:
```bash
# No setup needed, collections auto-create
```

5. **Run the application**

For IntegratedMode (Bot + Web):
```bash
npm start
```

For Bot Only:
```bash
npm run bot
```

For Web Only:
```bash
npm run web
```

## ⚙️ Configuration

### Mode Selection

Edit `config.json`:
```json
{
  "mode": "IntegratedMode"
}
```

Available modes:
- `DiscordBotOnly` - Only Discord bot runs
- `WebOnly` - Only website runs
- `IntegratedMode` - Both bot and website with full integration

### Database Configuration

**MySQL:**
```json
{
  "database": {
    "type": "mysql",
    "mysql": {
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "your_password",
      "database": "autostore"
    }
  }
}
```

**MongoDB:**
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

### Payment Configuration

**Midtrans:**
```json
{
  "payment": {
    "provider": "midtrans",
    "midtrans": {
      "serverKey": "your_server_key",
      "clientKey": "your_client_key",
      "isProduction": false
    }
  }
}
```

**Duitku:**
```json
{
  "payment": {
    "provider": "duitku",
    "duitku": {
      "merchantCode": "your_merchant_code",
      "apiKey": "your_api_key",
      "callbackUrl": "https://yourdomain.com/api/payment/callback"
    }
  }
}
```

**Tripay:**
```json
{
  "payment": {
    "provider": "tripay",
    "tripay": {
      "merchantCode": "your_merchant_code",
      "apiKey": "your_api_key",
      "privateKey": "your_private_key",
      "callbackUrl": "https://yourdomain.com/api/payment/callback"
    }
  }
}
```

## 🎮 Discord Bot Commands (COMPLETE)

### User Commands
- `/balance check` - Check your balance
- `/shop` - Browse available products with categories
- `/buy <product_id> [quantity]` - Purchase products with auto-delivery
- `/deposit <amount>` - Deposit balance via QRIS (with QR code)
- `/orders [status] [limit]` - View order history with filters
- `/help` - Show all available commands
- `/status` - Check bot status, uptime, and stats

### Admin Commands - Product Management
- `/product add` - Add new product with details
- `/product edit` - Edit existing product
- `/product delete` - Delete product
- `/product list` - List all products with stock count

### Admin Commands - Stock Management
- `/stock add <product_id> <data>` - Add single stock item
- `/stock bulk <product_id> <data>` - Bulk add stock (pipe-separated)
- `/stock view <product_id>` - View product stock items
- `/stock clear <product_id>` - Clear all available stock

### Admin Commands - Balance
- `/balance add <user> <amount>` - Add balance to user
- `/balance remove <user> <amount>` - Remove balance from user

### System Commands (Owner/Admin)
- `/maintenance on/off/status` - Toggle maintenance mode
- `/stats [period]` - View system statistics (today/week/month/all)
  - Shows: users, orders, revenue, deposits, top products

## 🛠️ Architecture

### Adapter Pattern (Database)
The system uses adapter pattern for database operations:
```
Interface → Provider → MySQL/MongoDB Implementation
```

This allows seamless switching between MySQL and MongoDB without changing application code.

### Strategy Pattern (Payment)
Payment providers use strategy pattern:
```
PaymentManager → Service (Midtrans/Duitku/Tripay)
```

### Event-Driven (Integration)
IntegratedMode uses event emitters for bot-website communication:
```
Event → GlobalEventEmitter → Listeners (Bot & Web)
```

## 📊 Logging

Logs are stored in `/logs` directory:
- `error.log` - Error logs
- `payment.log` - Payment transactions
- `system.log` - System operations
- `admin.log` - Admin actions
- `orders.log` - Order history
- `database.log` - Database operations

## 🔒 Security Features

- ✅ Input validation on all user inputs
- ✅ SQL injection prevention (parameterized queries)
- ✅ Payment callback signature verification
- ✅ Admin permission checks
- ✅ Rate limiting on commands
- ✅ Secure configuration management
- ✅ Transaction support for critical operations

## 🚦 Health Check

The system includes health monitoring:
```javascript
// Check database health
await databaseProvider.healthCheck();

// Check bot stats
const stats = client.getStats();
```

## 📝 License

MIT License - See LICENSE file for details

## 👥 Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: See `/docs` folder

## 🎯 Roadmap

- [x] Core system with multi-database
- [x] QRIS payment integration
- [x] Discord bot with slash commands
- [x] Auto-cancel invoice system
- [ ] Next.js website
- [ ] Admin dashboard
- [ ] User dashboard
- [ ] Real-time notifications
- [ ] Analytics & reporting
- [ ] API documentation

---

**Built with ❤️ by Auto-Store Team**
