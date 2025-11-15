const express = require('express');
const path = require('path');
const configManager = require('./shared/config/ConfigManager');
const databaseProvider = require('./shared/database/provider/DatabaseProvider');
const paymentManager = require('./shared/payment/PaymentManager');
const invoiceScheduler = require('./shared/services/InvoiceScheduler');
const ApiServer = require('./shared/api/ApiServer');
const logger = require('./shared/logger/Logger');

/**
 * Main Application Entry Point with Web GUI
 */
class Application {
  constructor() {
    this.mode = null;
    this.botInstance = null;
    this.guiServer = null;
    this.apiServer = null;
  }

  /**
   * Start the application
   */
  async start() {
    try {
      logger.info('='.repeat(60));
      logger.info('AUTO-STORE ECOSYSTEM - STARTING');
      logger.info('='.repeat(60));

      // Load configuration
      logger.info('Loading configuration...');
      configManager.load();
      this.mode = configManager.getMode();

      logger.info(`Mode: ${this.mode}`);

      // Start GUI Server
      logger.info('Starting Web GUI Server...');
      await this.startGUIServer();

      // Start API Server
      logger.info('Starting API Server...');
      await this.startAPIServer();

      // Validate configuration
      try {
        configManager.validate();

        // Initialize core services
        await this.initializeCoreServices();

        // Start components based on mode
        if (configManager.isBotEnabled()) {
          await this.startBot();
        }

        // Start invoice scheduler
        invoiceScheduler.start();

        logger.info('='.repeat(60));
        logger.info('APPLICATION STARTED SUCCESSFULLY');
        logger.info(`Mode: ${this.mode}`);
        logger.info(`Database: ${databaseProvider.getDatabaseType()}`);
        logger.info(`Payment: ${paymentManager.getProvider()}`);
        logger.info('='.repeat(60));

      } catch (validationError) {
        logger.warn('Configuration validation failed - GUI running for setup');
        logger.warn(validationError.message);
      }

      logger.info('');
      logger.info('🌐 Web GUI: http://localhost:3000');
      logger.info('📡 API Server: http://localhost:3001');
      logger.info('');

      // Only auto-open browser if not running in Electron
      if (!process.versions.electron) {
        logger.info('Opening browser...');
        setTimeout(() => {
          const open = require('open');
          open('http://localhost:3000').catch(() => {
            logger.info('Could not auto-open browser. Please open http://localhost:3000 manually');
          });
        }, 1500);
      } else {
        logger.info('Running in Electron - GUI loaded in app window');
      }

      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start application', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Initialize core services
   */
  async initializeCoreServices() {
    // Initialize database
    logger.info('Initializing database...');
    await databaseProvider.initialize();

    const dbTest = await databaseProvider.testConnection();
    if (!dbTest.success) {
      throw new Error('Database connection test failed');
    }

    // Initialize payment
    logger.info('Initializing payment service...');
    paymentManager.initialize();

    // Inject repositories into API server
    if (this.apiServer) {
      this.apiServer.setRepositories({
        userRepo: databaseProvider.getUserRepository(),
        productRepo: databaseProvider.getProductRepository(),
        stockRepo: databaseProvider.getStockRepository(),
        orderRepo: databaseProvider.getOrderRepository(),
        paymentRepo: databaseProvider.getPaymentRepository()
      });
    }
  }

  /**
   * Start GUI Server
   */
  async startGUIServer() {
    this.guiServer = express();

    // Serve static files
    this.guiServer.use(express.static(path.join(__dirname, 'gui/public')));
    this.guiServer.use(express.json());

    // Bot control endpoints
    this.guiServer.post('/api/bot/start', async (req, res) => {
      try {
        if (this.botInstance) {
          return res.json({ success: false, message: 'Bot is already running' });
        }
        await this.startBot();
        res.json({ success: true, message: 'Bot started successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    this.guiServer.post('/api/bot/stop', async (req, res) => {
      try {
        if (!this.botInstance) {
          return res.json({ success: false, message: 'Bot is not running' });
        }
        await this.stopBot();
        res.json({ success: true, message: 'Bot stopped successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    this.guiServer.get('/api/bot/status', (req, res) => {
      res.json({
        running: this.botInstance !== null,
        uptime: process.uptime(),
        mode: this.mode
      });
    });

    return new Promise((resolve) => {
      this.guiServer.listen(3000, () => {
        logger.info('Web GUI running on http://localhost:3000');
        resolve();
      });
    });
  }

  /**
   * Start API Server
   */
  async startAPIServer() {
    this.apiServer = new ApiServer(3001);
    await this.apiServer.start();
  }

  /**
   * Start Discord bot
   */
  async startBot() {
    logger.info('Starting Discord bot...');
    const BotApplication = require('./bot/index.js');
    this.botInstance = BotApplication;
    logger.info('Discord bot started');
  }

  /**
   * Stop Discord bot
   */
  async stopBot() {
    if (this.botInstance) {
      await this.botInstance.shutdown();
      this.botInstance = null;
      logger.info('Discord bot stopped');
    }
  }

  /**
   * Shutdown application
   */
  async shutdown() {
    logger.info('Shutting down application...');

    try {
      await this.stopBot();

      invoiceScheduler.stop();

      if (this.apiServer) {
        await this.apiServer.stop();
      }

      if (this.guiServer) {
        this.guiServer.close();
      }

      await databaseProvider.disconnect();

      logger.info('Application shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal');
      await this.shutdown();
      process.exit(0);
    });

    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled promise rejection', error);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      this.shutdown();
      process.exit(1);
    });
  }
}

// Create and start application
const app = new Application();
app.start();

module.exports = app;
