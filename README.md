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
**User Commands:**
- ✅ `/balance` - Check balance
- ✅ `/deposit` - QRIS deposit with auto-QR generation
- ✅ `/products` - Browse available products
- ✅ `/buy` - Purchase products
- ✅ `/orders` - View order history with filters
- ✅ `/help` - Get help and command list
- ✅ `/status` - Check bot status
- ✅ Auto-delivery via DM after purchase
- ✅ Cooldown system to prevent spam
- ✅ Event-driven architecture

**Admin Management:**
- 🖥️ Managed via **Desktop App** (Windows) or **Web Dashboard** (Ubuntu/Server)
- ❌ NO Discord admin commands - all admin tasks through GUI
- ✅ Product management (CRUD)
- ✅ Stock management (add, bulk, clear)
- ✅ Order viewing and filtering
- ✅ User management
- ✅ Configuration editor
- ✅ Real-time statistics

### 🖥️ Desktop App (Windows) ✅ COMPLETE
- ✅ **Electron-based** Windows desktop application
- ✅ **7 Management Pages**:
  - Dashboard (stats, recent orders, quick actions)
  - Settings (full config editor with test connections)
  - Products (CRUD operations)
  - Stock (per-product management with bulk upload)
  - Orders (view & filter)
  - Users (view & edit balances)
  - Logs (real-time bot logs viewer)
- ✅ **Bot Control**: Start/stop bot from GUI
- ✅ **Config Management**: Export/import, test connections
- ✅ **Modern UI**: Professional design with animations
- ✅ **Real-time Updates**: Live status indicators
- 📦 **Build Support**: Windows (NSIS), Mac (DMG), Linux (AppImage)

### 🌐 Web Dashboard (Ubuntu/Server) ✅ COMPLETE
- ✅ Next.js 14 with App Router
- ✅ Admin settings page with full config editor
- ✅ Tailwind CSS configured
- ✅ API routes for config management
- ✅ Test database & payment connections
- ✅ Export/import config files
- 🔄 Full dashboard UI (structure ready)
- 📝 Recommended for server deployments

### 🔌 REST API Server ✅ COMPLETE
- ✅ Express-based API server (port 3001)
- ✅ Auto-starts with bot
- ✅ Complete CRUD endpoints for all resources
- ✅ Config management (get, update, test, export, import)
- ✅ Database connection testing
- ✅ Payment gateway testing
- ✅ Dashboard statistics & analytics
- ✅ CORS enabled for local access

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

### For Windows Users (Desktop App) 🖥️

1. **Install the project**
```bash
git clone <repository-url>
cd auto-store-discord
npm install
```

2. **Install Desktop App dependencies**
```bash
cd desktop
npm install
cd ..
```

3. **Start the Desktop App**
```bash
cd desktop
npm start
```

4. **Configure via Desktop App**
- Click "Settings" in the sidebar
- Fill in your Discord bot token, database credentials, payment API keys
- Test connections using the "Test Connection" buttons
- Click "Save Configuration"

5. **Start the Bot**
- Click "Start Bot" button in the sidebar
- Monitor logs in the "Logs" page

6. **Manage your store**
- Use "Products" page to add products
- Use "Stock" page to add stock items
- Use "Orders" page to view purchases
- Use "Dashboard" for statistics

### For Ubuntu/Server (Web Dashboard) 🌐

1. **Install the project**
```bash
git clone <repository-url>
cd auto-store-discord
npm install
```

2. **Configure the system**
```bash
# Copy example config
cp config.example.json config.json

# Edit config.json manually OR use web dashboard
```

3. **Start the bot** (API server auto-starts)
```bash
npm start
```

4. **Access Web Dashboard**
```
Open browser: http://localhost:3000/admin/settings
```

5. **Configure via Web Dashboard**
- Edit all settings in the web interface
- Test database and payment connections
- Export/import config files
- Save and restart bot

### Manual Configuration (Advanced)

If you prefer manual configuration:

1. **Copy example files**
```bash
cp config.example.json config.json
```

2. **Edit config.json**
- See KONFIGURASI.md for detailed explanations
- All options are documented with examples

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
