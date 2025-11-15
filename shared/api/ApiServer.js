const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const configManager = require('../config/ConfigManager');
const logger = require('../logger/Logger');

class ApiServer {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.server = null;

    // Repositories (akan di-inject dari luar)
    this.userRepo = null;
    this.productRepo = null;
    this.stockRepo = null;
    this.orderRepo = null;
    this.paymentRepo = null;

    this.setupMiddleware();
    this.setupRoutes();
  }

  // Inject repositories
  setRepositories(repos) {
    this.userRepo = repos.userRepo;
    this.productRepo = repos.productRepo;
    this.stockRepo = repos.stockRepo;
    this.orderRepo = repos.orderRepo;
    this.paymentRepo = repos.paymentRepo;
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`API Request: ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // ============================================
    // CONFIG ROUTES
    // ============================================
    this.app.get('/api/config', this.getConfig.bind(this));
    this.app.post('/api/config', this.updateConfig.bind(this));
    this.app.post('/api/config/test-database', this.testDatabase.bind(this));
    this.app.post('/api/config/test-payment', this.testPayment.bind(this));
    this.app.get('/api/config/export', this.exportConfig.bind(this));
    this.app.post('/api/config/import', this.importConfig.bind(this));

    // ============================================
    // PRODUCT ROUTES
    // ============================================
    this.app.get('/api/products', this.getProducts.bind(this));
    this.app.get('/api/products/:id', this.getProduct.bind(this));
    this.app.post('/api/products', this.createProduct.bind(this));
    this.app.put('/api/products/:id', this.updateProduct.bind(this));
    this.app.delete('/api/products/:id', this.deleteProduct.bind(this));

    // ============================================
    // STOCK ROUTES
    // ============================================
    this.app.get('/api/stock/:productId', this.getStock.bind(this));
    this.app.post('/api/stock/:productId', this.addStock.bind(this));
    this.app.post('/api/stock/:productId/bulk', this.addBulkStock.bind(this));
    this.app.delete('/api/stock/:productId', this.clearStock.bind(this));

    // ============================================
    // ORDER ROUTES
    // ============================================
    this.app.get('/api/orders', this.getOrders.bind(this));
    this.app.get('/api/orders/:id', this.getOrder.bind(this));
    this.app.get('/api/orders/user/:discordId', this.getUserOrders.bind(this));

    // ============================================
    // USER ROUTES
    // ============================================
    this.app.get('/api/users', this.getUsers.bind(this));
    this.app.get('/api/users/:discordId', this.getUser.bind(this));
    this.app.post('/api/users/:discordId/balance', this.updateUserBalance.bind(this));

    // ============================================
    // STATS ROUTES
    // ============================================
    this.app.get('/api/stats/dashboard', this.getDashboardStats.bind(this));
    this.app.get('/api/stats/revenue', this.getRevenueStats.bind(this));

    // ============================================
    // BOT CONTROL ROUTES
    // ============================================
    this.app.post('/api/bot/restart', this.restartBot.bind(this));
    this.app.post('/api/bot/shutdown', this.shutdownBot.bind(this));
    this.app.get('/api/bot/status', this.getBotStatus.bind(this));

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  // ============================================
  // CONFIG HANDLERS
  // ============================================

  async getConfig(req, res) {
    try {
      const config = configManager.getConfig();
      res.json(config);
    } catch (error) {
      logger.error('Error getting config:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateConfig(req, res) {
    try {
      const configPath = path.join(__dirname, '../../config.json');
      const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const newConfig = req.body;

      // Validate
      const validation = this.validateConfig(newConfig);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Preserve comment fields
      const merged = this.preserveComments(currentConfig, newConfig);

      // Write
      fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
      configManager.reload();

      res.json({ success: true, message: 'Config updated successfully' });
    } catch (error) {
      logger.error('Error updating config:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async testDatabase(req, res) {
    try {
      const { type, config } = req.body;

      if (type === 'mysql') {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          database: config.database
        });
        await connection.ping();
        await connection.end();

        res.json({ success: true, message: 'MySQL connection successful!' });
      } else if (type === 'mongodb') {
        const mongoose = require('mongoose');
        await mongoose.connect(config.uri, { serverSelectionTimeoutMS: 5000 });
        await mongoose.disconnect();

        res.json({ success: true, message: 'MongoDB connection successful!' });
      } else {
        res.status(400).json({ error: 'Invalid database type' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async testPayment(req, res) {
    try {
      const { provider, config } = req.body;
      const axios = require('axios');

      if (provider === 'midtrans') {
        const baseUrl = config.isProduction
          ? 'https://api.midtrans.com'
          : 'https://api.sandbox.midtrans.com';

        const auth = Buffer.from(config.serverKey + ':').toString('base64');
        const response = await axios.get(`${baseUrl}/v2/transactions/test-123`, {
          headers: { 'Authorization': `Basic ${auth}` }
        });

        // Even 404 means auth is valid
        res.json({ success: true, message: 'Midtrans credentials are valid!' });
      } else {
        res.json({ success: true, message: `${provider} credentials look valid (full test not implemented)` });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        res.json({ success: true, message: 'Credentials are valid!' });
      } else if (error.response?.status === 401) {
        res.status(500).json({ success: false, error: 'Invalid credentials (401)' });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  async exportConfig(req, res) {
    try {
      const configPath = path.join(__dirname, '../../config.json');
      const config = fs.readFileSync(configPath, 'utf-8');

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="config-backup.json"');
      res.send(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async importConfig(req, res) {
    try {
      const newConfig = req.body;

      // Validate
      const validation = this.validateConfig(newConfig);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const configPath = path.join(__dirname, '../../config.json');
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
      configManager.reload();

      res.json({ success: true, message: 'Config imported successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // PRODUCT HANDLERS
  // ============================================

  async getProducts(req, res) {
    try {
      const products = await this.productRepo.getAll();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProduct(req, res) {
    try {
      const product = await this.productRepo.getById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProduct(req, res) {
    try {
      const { name, description, price } = req.body;

      if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      const productId = await this.productRepo.create(name, description, price);
      res.json({ success: true, productId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { name, description, price, isActive } = req.body;
      await this.productRepo.update(req.params.id, { name, description, price, isActive });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      await this.productRepo.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // STOCK HANDLERS
  // ============================================

  async getStock(req, res) {
    try {
      const stock = await this.stockRepo.getByProductId(req.params.productId);
      res.json(stock);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addStock(req, res) {
    try {
      const { data } = req.body;
      await this.stockRepo.add(req.params.productId, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addBulkStock(req, res) {
    try {
      const { items } = req.body; // Array of stock data

      for (const item of items) {
        await this.stockRepo.add(req.params.productId, item);
      }

      res.json({ success: true, count: items.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async clearStock(req, res) {
    try {
      await this.stockRepo.clearByProductId(req.params.productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // ORDER HANDLERS
  // ============================================

  async getOrders(req, res) {
    try {
      const { status, limit = 100 } = req.query;
      const orders = status
        ? await this.orderRepo.getByStatus(status, parseInt(limit))
        : await this.orderRepo.getRecent(parseInt(limit));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrder(req, res) {
    try {
      const order = await this.orderRepo.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserOrders(req, res) {
    try {
      const { status, limit = 50 } = req.query;
      const orders = await this.orderRepo.getByUser(req.params.discordId, status, parseInt(limit));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // USER HANDLERS
  // ============================================

  async getUsers(req, res) {
    try {
      const { limit = 100 } = req.query;
      const users = await this.userRepo.getAll(parseInt(limit));
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUser(req, res) {
    try {
      const user = await this.userRepo.getByDiscordId(req.params.discordId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUserBalance(req, res) {
    try {
      const { amount, reason } = req.body;
      await this.userRepo.addBalance(req.params.discordId, amount, reason);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // STATS HANDLERS
  // ============================================

  async getDashboardStats(req, res) {
    try {
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        recentOrders
      ] = await Promise.all([
        this.userRepo.getAll(1).then(u => u.length),
        this.productRepo.getAll().then(p => p.length),
        this.orderRepo.getRecent(1).then(o => o.length),
        this.orderRepo.getRecent(10)
      ]);

      const stats = {
        totalUsers,
        totalProducts,
        totalOrders,
        recentOrders
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRevenueStats(req, res) {
    try {
      const { period = '7d' } = req.query;

      let days = 7;
      if (period === '30d') days = 30;
      if (period === '1y') days = 365;

      const dateRange = {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const revenue = await this.orderRepo.getRevenue(dateRange);
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // BOT CONTROL HANDLERS
  // ============================================

  async restartBot(req, res) {
    try {
      res.json({ success: true, message: 'Bot is restarting...' });
      setTimeout(() => process.exit(0), 1000);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async shutdownBot(req, res) {
    try {
      res.json({ success: true, message: 'Bot is shutting down...' });
      setTimeout(() => process.exit(1), 1000);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBotStatus(req, res) {
    try {
      const status = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        mode: configManager.getConfig().mode,
        maintenance: configManager.getConfig().features?.maintenance || false
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  validateConfig(config) {
    const validModes = ['DiscordBotOnly', 'WebOnly', 'IntegratedMode'];
    if (!validModes.includes(config.mode)) {
      return { valid: false, error: 'Invalid mode' };
    }

    const validDatabases = ['mysql', 'mongodb'];
    if (!validDatabases.includes(config.database?.type)) {
      return { valid: false, error: 'Invalid database type' };
    }

    return { valid: true };
  }

  preserveComments(oldConfig, newConfig) {
    const result = { ...newConfig };

    for (const key in oldConfig) {
      if (key.startsWith('_')) {
        result[key] = oldConfig[key];
      }
    }

    return result;
  }

  // ============================================
  // SERVER CONTROL
  // ============================================

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        logger.info(`API Server running on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        logger.error('API Server error:', error);
        reject(error);
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('API Server stopped');
          resolve();
        });
      });
    }
  }
}

module.exports = ApiServer;
