const fs = require('fs');
const path = require('path');

/**
 * Logger - Professional logging system
 * Logs to console and files (error.log, payment.log, system.log)
 */
class Logger {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogsDir();

    this.levels = {
      ERROR: 'ERROR',
      WARN: 'WARN',
      INFO: 'INFO',
      DEBUG: 'DEBUG',
      PAYMENT: 'PAYMENT',
      SYSTEM: 'SYSTEM'
    };

    this.colors = {
      ERROR: '\x1b[31m',    // Red
      WARN: '\x1b[33m',     // Yellow
      INFO: '\x1b[36m',     // Cyan
      DEBUG: '\x1b[35m',    // Magenta
      PAYMENT: '\x1b[32m',  // Green
      SYSTEM: '\x1b[34m',   // Blue
      RESET: '\x1b[0m'
    };
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Get timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  /**
   * Write to file
   */
  writeToFile(filename, message) {
    try {
      const filepath = path.join(this.logsDir, filename);
      fs.appendFileSync(filepath, message + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Log to console with colors
   */
  logToConsole(level, message) {
    const color = this.colors[level] || this.colors.RESET;
    console.log(`${color}${message}${this.colors.RESET}`);
  }

  /**
   * Generic log method
   */
  log(level, message, meta = {}, filename = null) {
    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output
    this.logToConsole(level, formattedMessage);

    // File output
    if (filename) {
      this.writeToFile(filename, formattedMessage);
    }
  }

  /**
   * Error logging
   */
  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      ...meta,
      error: error.message,
      stack: error.stack
    } : meta;

    this.log(this.levels.ERROR, message, errorMeta, 'error.log');
  }

  /**
   * Warning logging
   */
  warn(message, meta = {}) {
    this.log(this.levels.WARN, message, meta, 'system.log');
  }

  /**
   * Info logging
   */
  info(message, meta = {}) {
    this.log(this.levels.INFO, message, meta, 'system.log');
  }

  /**
   * Debug logging
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log(this.levels.DEBUG, message, meta);
    }
  }

  /**
   * Payment logging (special category)
   */
  payment(message, meta = {}) {
    this.log(this.levels.PAYMENT, message, meta, 'payment.log');
  }

  /**
   * System logging
   */
  system(message, meta = {}) {
    this.log(this.levels.SYSTEM, message, meta, 'system.log');
  }

  /**
   * Admin action logging
   */
  admin(action, adminId, meta = {}) {
    const message = `Admin ${adminId} performed: ${action}`;
    this.log(this.levels.SYSTEM, message, meta, 'admin.log');
  }

  /**
   * Order logging
   */
  order(message, meta = {}) {
    this.log(this.levels.INFO, message, meta, 'orders.log');
  }

  /**
   * Database logging
   */
  database(message, meta = {}) {
    this.log(this.levels.SYSTEM, message, meta, 'database.log');
  }

  /**
   * Clear old logs (keep last 30 days)
   */
  clearOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      files.forEach(file => {
        const filepath = path.join(this.logsDir, file);
        const stats = fs.statSync(filepath);

        if (stats.mtimeMs < thirtyDaysAgo) {
          fs.unlinkSync(filepath);
          this.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to clear old logs', error);
    }
  }

  /**
   * Get log file content
   */
  getLogContent(filename, lines = 100) {
    try {
      const filepath = path.join(this.logsDir, filename);

      if (!fs.existsSync(filepath)) {
        return null;
      }

      const content = fs.readFileSync(filepath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());

      // Return last N lines
      return allLines.slice(-lines).join('\n');
    } catch (error) {
      this.error('Failed to read log file', error, { filename });
      return null;
    }
  }

  /**
   * List all log files
   */
  listLogFiles() {
    try {
      return fs.readdirSync(this.logsDir);
    } catch (error) {
      this.error('Failed to list log files', error);
      return [];
    }
  }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
