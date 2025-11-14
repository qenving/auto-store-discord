const mongoose = require('mongoose');
const logger = require('../../logger/Logger');

/**
 * MongoDBConnection - Manages MongoDB connection
 */
class MongoDBConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect(config) {
    try {
      await mongoose.connect(config.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });

      this.connection = mongoose.connection;
      this.isConnected = true;

      this.connection.on('error', (error) => {
        logger.error('MongoDB connection error', error);
      });

      this.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      logger.info('MongoDB connected successfully', { uri: config.uri.replace(/\/\/.*@/, '//***@') });

      return true;
    } catch (error) {
      logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.connection) {
        return false;
      }
      return this.connection.readyState === 1;
    } catch (error) {
      logger.error('MongoDB health check failed', error);
      return false;
    }
  }

  /**
   * Get connection
   */
  getConnection() {
    return this.connection;
  }
}

// Singleton instance
const mongoDBConnection = new MongoDBConnection();

module.exports = mongoDBConnection;
