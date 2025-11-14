const configManager = require('./shared/config/ConfigManager');
const databaseProvider = require('./shared/database/provider/DatabaseProvider');
const paymentManager = require('./shared/payment/PaymentManager');
const invoiceScheduler = require('./shared/services/InvoiceScheduler');
const logger = require('./shared/logger/Logger');

/**
 * Main Application Entry Point
 * Handles initialization based on mode (BotOnly, WebOnly, IntegratedMode)
 */
class Application {
  constructor() {
    this.mode = null;
    this.botInstance = null;
    this.webInstance = null;
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

      // Validate configuration
      configManager.validate();

      // Initialize core services
      await this.initializeCoreServices();

      // Start components based on mode
      if (configManager.isBotEnabled()) {
        await this.startBot();
      }

      if (configManager.isWebEnabled()) {
        await this.startWeb();
      }

      // Start invoice scheduler
      invoiceScheduler.start();

      logger.info('='.repeat(60));
      logger.info('APPLICATION STARTED SUCCESSFULLY');
      logger.info(`Mode: ${this.mode}`);
      logger.info(`Database: ${databaseProvider.getDatabaseType()}`);
      logger.info(`Payment: ${paymentManager.getProvider()}`);
      logger.info('='.repeat(60));

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
  }

  /**
   * Start Discord bot
   */
  async startBot() {
    logger.info('Starting Discord bot...');
    const BotApplication = require('./bot/index.js');
    // Bot will auto-start when required
    logger.info('Discord bot started');
  }

  /**
   * Start web server
   */
  async startWeb() {
    logger.info('Starting web server...');
    // Note: In production, you would use Next.js build
    // For now, this is a placeholder
    logger.info('Web server would start here (Next.js)');
    logger.info('Run: cd web && npm run dev');
  }

  /**
   * Shutdown application
   */
  async shutdown() {
    logger.info('Shutting down application...');

    try {
      invoiceScheduler.stop();
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
