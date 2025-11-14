const ExtendedClient = require('./core/Client');
const configManager = require('../shared/config/ConfigManager');
const databaseProvider = require('../shared/database/provider/DatabaseProvider');
const paymentManager = require('../shared/payment/PaymentManager');
const logger = require('../shared/logger/Logger');
const { loadCommands, registerCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

/**
 * Main Bot Entry Point
 */
class BotApplication {
  constructor() {
    this.client = null;
    this.isRunning = false;
  }

  /**
   * Start the bot
   */
  async start() {
    try {
      logger.info('='.repeat(50));
      logger.info('AUTO-STORE DISCORD BOT - STARTING');
      logger.info('='.repeat(50));

      // Load configuration
      logger.info('Loading configuration...');
      configManager.load();

      // Check if bot should run
      if (!configManager.isBotEnabled()) {
        logger.warn('Bot is not enabled in current mode. Exiting...');
        return;
      }

      // Validate configuration
      configManager.validate();

      // Initialize database
      logger.info('Initializing database...');
      await databaseProvider.initialize();

      // Test database connection
      const dbTest = await databaseProvider.testConnection();
      if (!dbTest.success) {
        throw new Error('Database connection test failed');
      }

      // Initialize payment
      logger.info('Initializing payment service...');
      paymentManager.initialize();

      // Create Discord client
      logger.info('Creating Discord client...');
      this.client = new ExtendedClient();

      // Load events
      logger.info('Loading events...');
      loadEvents(this.client);

      // Load commands
      logger.info('Loading commands...');
      loadCommands(this.client);

      // Login to Discord
      logger.info('Logging in to Discord...');
      const discordConfig = configManager.getDiscordConfig();
      await this.client.login(discordConfig.token);

      // Wait for ready
      await new Promise((resolve) => {
        this.client.once('ready', resolve);
      });

      // Register slash commands
      logger.info('Registering slash commands...');
      const guildId = discordConfig.guildId || null;
      await registerCommands(this.client, guildId);

      logger.info('='.repeat(50));
      logger.info('BOT STARTED SUCCESSFULLY');
      logger.info('='.repeat(50));

      this.isRunning = true;

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start bot', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Shutdown the bot gracefully
   */
  async shutdown() {
    logger.info('Shutting down bot...');

    try {
      if (this.client) {
        this.client.destroy();
      }

      await databaseProvider.disconnect();

      logger.info('Bot shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }

    this.isRunning = false;
  }

  /**
   * Setup graceful shutdown handlers
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

// Create and start bot
const bot = new BotApplication();
bot.start();

module.exports = bot;
