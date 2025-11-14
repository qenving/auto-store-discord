const mysql = require('mysql2/promise');
const logger = require('../../logger/Logger');

/**
 * MySQLConnection - Manages MySQL connection pool
 */
class MySQLConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize connection pool
   */
  async connect(config) {
    try {
      this.pool = mysql.createPool({
        host: config.host,
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.isConnected = true;
      logger.info('MySQL connected successfully', {
        host: config.host,
        database: config.database
      });

      // Initialize tables
      await this.initializeTables();

      return true;
    } catch (error) {
      logger.error('Failed to connect to MySQL', error);
      throw error;
    }
  }

  /**
   * Get connection from pool
   */
  async getConnection() {
    if (!this.pool) {
      throw new Error('MySQL pool not initialized');
    }
    return await this.pool.getConnection();
  }

  /**
   * Execute query
   */
  async query(sql, params = []) {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.execute(sql, params);
      return results;
    } finally {
      connection.release();
    }
  }

  /**
   * Initialize database tables
   */
  async initializeTables() {
    logger.info('Initializing MySQL tables...');

    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        discriminator VARCHAR(10),
        avatar VARCHAR(255),
        balance DECIMAL(15, 2) DEFAULT 0,
        total_spent DECIMAL(15, 2) DEFAULT 0,
        total_orders INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_discord_id (discord_id),
        INDEX idx_balance (balance)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(15, 2) NOT NULL,
        category VARCHAR(100),
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        min_purchase INT DEFAULT 1,
        max_purchase INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Stock table
      `CREATE TABLE IF NOT EXISTS stock (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        data TEXT NOT NULL,
        is_used BOOLEAN DEFAULT false,
        used_by VARCHAR(255),
        used_at TIMESTAMP NULL,
        order_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_available (product_id, is_used),
        INDEX idx_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(15, 2) NOT NULL,
        status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
        delivery_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        INDEX idx_user_orders (discord_id, created_at),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Payments/Deposits table
      `CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL,
        invoice_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        status ENUM('pending', 'success', 'failed', 'expired') DEFAULT 'pending',
        provider VARCHAR(50) NOT NULL,
        qr_url TEXT,
        payment_url TEXT,
        expired_at TIMESTAMP NOT NULL,
        paid_at TIMESTAMP NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE,
        INDEX idx_invoice (invoice_id),
        INDEX idx_user_payments (discord_id, created_at),
        INDEX idx_status (status),
        INDEX idx_expired (expired_at, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Balance history table
      `CREATE TABLE IF NOT EXISTS balance_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL,
        type ENUM('add', 'subtract') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        balance_before DECIMAL(15, 2) NOT NULL,
        balance_after DECIMAL(15, 2) NOT NULL,
        reason VARCHAR(255),
        reference_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE,
        INDEX idx_user_history (discord_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Admins table
      `CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        role ENUM('owner', 'admin', 'helper') DEFAULT 'admin',
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        INDEX idx_discord_id (discord_id),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const sql of tables) {
      try {
        await this.query(sql);
      } catch (error) {
        logger.error('Failed to create table', error, { sql: sql.substring(0, 100) });
        throw error;
      }
    }

    logger.info('MySQL tables initialized successfully');
  }

  /**
   * Close connection pool
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('MySQL disconnected');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      logger.error('MySQL health check failed', error);
      return false;
    }
  }
}

// Singleton instance
const mysqlConnection = new MySQLConnection();

module.exports = mysqlConnection;
