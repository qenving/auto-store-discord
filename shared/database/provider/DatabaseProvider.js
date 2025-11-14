const configManager = require('../../config/ConfigManager');
const logger = require('../../logger/Logger');

// MySQL
const mysqlConnection = require('../mysql/MySQLConnection');
const MySQLUserRepository = require('../mysql/UserRepository');
const MySQLProductRepository = require('../mysql/ProductRepository');
const MySQLStockRepository = require('../mysql/StockRepository');
const MySQLOrderRepository = require('../mysql/OrderRepository');
const MySQLPaymentRepository = require('../mysql/PaymentRepository');

// MongoDB
const mongoDBConnection = require('../mongodb/MongoDBConnection');
const MongoDBUserRepository = require('../mongodb/UserRepository');
const MongoDBProductRepository = require('../mongodb/ProductRepository');
const MongoDBStockRepository = require('../mongodb/StockRepository');
const MongoDBOrderRepository = require('../mongodb/OrderRepository');
const MongoDBPaymentRepository = require('../mongodb/PaymentRepository');

/**
 * DatabaseProvider - Factory for database operations
 * Automatically switches between MySQL and MongoDB based on configuration
 */
class DatabaseProvider {
  constructor() {
    this.type = null;
    this.connection = null;
    this.repositories = {
      user: null,
      product: null,
      stock: null,
      order: null,
      payment: null
    };
    this.isInitialized = false;
  }

  /**
   * Initialize database connection and repositories
   */
  async initialize() {
    try {
      const dbConfig = configManager.getDatabaseConfig();
      this.type = dbConfig.type;

      logger.info(`Initializing database: ${this.type}`);

      if (this.type === 'mysql') {
        await this.initializeMySQL(dbConfig.mysql);
      } else if (this.type === 'mongodb') {
        await this.initializeMongoDB(dbConfig.mongodb);
      } else {
        throw new Error(`Unsupported database type: ${this.type}`);
      }

      this.isInitialized = true;
      logger.info('Database initialized successfully');

      return true;
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  /**
   * Initialize MySQL
   */
  async initializeMySQL(config) {
    await mysqlConnection.connect(config);
    this.connection = mysqlConnection;

    this.repositories.user = new MySQLUserRepository();
    this.repositories.product = new MySQLProductRepository();
    this.repositories.stock = new MySQLStockRepository();
    this.repositories.order = new MySQLOrderRepository();
    this.repositories.payment = new MySQLPaymentRepository();

    logger.info('MySQL repositories initialized');
  }

  /**
   * Initialize MongoDB
   */
  async initializeMongoDB(config) {
    await mongoDBConnection.connect(config);
    this.connection = mongoDBConnection;

    this.repositories.user = new MongoDBUserRepository();
    this.repositories.product = new MongoDBProductRepository();
    this.repositories.stock = new MongoDBStockRepository();
    this.repositories.order = new MongoDBOrderRepository();
    this.repositories.payment = new MongoDBPaymentRepository();

    logger.info('MongoDB repositories initialized');
  }

  /**
   * Get User Repository
   */
  getUserRepository() {
    this.ensureInitialized();
    return this.repositories.user;
  }

  /**
   * Get Product Repository
   */
  getProductRepository() {
    this.ensureInitialized();
    return this.repositories.product;
  }

  /**
   * Get Stock Repository
   */
  getStockRepository() {
    this.ensureInitialized();
    return this.repositories.stock;
  }

  /**
   * Get Order Repository
   */
  getOrderRepository() {
    this.ensureInitialized();
    return this.repositories.order;
  }

  /**
   * Get Payment Repository
   */
  getPaymentRepository() {
    this.ensureInitialized();
    return this.repositories.payment;
  }

  /**
   * Get database type
   */
  getDatabaseType() {
    return this.type;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.connection) {
        return { healthy: false, error: 'No connection' };
      }

      const healthy = await this.connection.healthCheck();

      return {
        healthy,
        type: this.type,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Database health check failed', error);
      return {
        healthy: false,
        error: error.message,
        type: this.type
      };
    }
  }

  /**
   * Disconnect database
   */
  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.disconnect();
        this.isInitialized = false;
        logger.info('Database disconnected');
      }
    } catch (error) {
      logger.error('Failed to disconnect database', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  /**
   * Get all repositories (for admin/debug purposes)
   */
  getAllRepositories() {
    this.ensureInitialized();
    return this.repositories;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const health = await this.healthCheck();

      if (!health.healthy) {
        throw new Error(health.error || 'Database is not healthy');
      }

      // Test basic operations
      const userRepo = this.getUserRepository();
      const count = await userRepo.count();

      logger.info('Database connection test passed', {
        type: this.type,
        userCount: count
      });

      return {
        success: true,
        type: this.type,
        userCount: count
      };
    } catch (error) {
      logger.error('Database connection test failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const databaseProvider = new DatabaseProvider();

module.exports = databaseProvider;
