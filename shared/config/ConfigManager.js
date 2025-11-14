const fs = require('fs');
const path = require('path');

/**
 * ConfigManager - Centralized configuration management
 * Supports 3 modes: DiscordBotOnly, WebOnly, IntegratedMode
 */
class ConfigManager {
  constructor() {
    this.config = null;
    this.mode = null;
    this.isLoaded = false;
  }

  /**
   * Load configuration from file and environment
   */
  load() {
    try {
      // Load from config.json
      const configPath = path.join(process.cwd(), 'config.json');

      if (!fs.existsSync(configPath)) {
        throw new Error('config.json not found! Please copy config.example.json to config.json');
      }

      this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Override with environment variables if present
      this.config.mode = process.env.MODE || this.config.mode || 'IntegratedMode';

      // Validate mode
      const validModes = ['DiscordBotOnly', 'WebOnly', 'IntegratedMode'];
      if (!validModes.includes(this.config.mode)) {
        throw new Error(`Invalid mode: ${this.config.mode}. Must be one of: ${validModes.join(', ')}`);
      }

      this.mode = this.config.mode;
      this.isLoaded = true;

      console.log(`[ConfigManager] Loaded successfully in ${this.mode} mode`);

      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Failed to load configuration:', error.message);
      throw error;
    }
  }

  /**
   * Get full configuration
   */
  getConfig() {
    if (!this.isLoaded) {
      this.load();
    }
    return this.config;
  }

  /**
   * Get current mode
   */
  getMode() {
    if (!this.isLoaded) {
      this.load();
    }
    return this.mode;
  }

  /**
   * Check if Discord bot should be enabled
   */
  isBotEnabled() {
    return this.mode === 'DiscordBotOnly' || this.mode === 'IntegratedMode';
  }

  /**
   * Check if website should be enabled
   */
  isWebEnabled() {
    return this.mode === 'WebOnly' || this.mode === 'IntegratedMode';
  }

  /**
   * Check if integrated features should be enabled
   */
  isIntegrated() {
    return this.mode === 'IntegratedMode';
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return this.getConfig().database;
  }

  /**
   * Get Discord configuration
   */
  getDiscordConfig() {
    if (!this.isBotEnabled()) {
      throw new Error('Discord bot is not enabled in current mode');
    }
    return this.getConfig().discord;
  }

  /**
   * Get website configuration
   */
  getWebsiteConfig() {
    if (!this.isWebEnabled()) {
      throw new Error('Website is not enabled in current mode');
    }
    return this.getConfig().website;
  }

  /**
   * Get payment configuration
   */
  getPaymentConfig() {
    return this.getConfig().payment;
  }

  /**
   * Get OAuth configuration
   */
  getOAuthConfig() {
    if (!this.isWebEnabled()) {
      throw new Error('OAuth is only available in Web modes');
    }
    return this.getConfig().oauth;
  }

  /**
   * Check if maintenance mode is active
   */
  isMaintenanceMode() {
    return this.getConfig().features?.maintenance || false;
  }

  /**
   * Get feature flags
   */
  getFeatures() {
    return this.getConfig().features || {};
  }

  /**
   * Get limits configuration
   */
  getLimits() {
    return this.getConfig().limits || {};
  }

  /**
   * Validate configuration completeness
   */
  validate() {
    const config = this.getConfig();
    const errors = [];

    // Validate database config
    if (!config.database || !config.database.type) {
      errors.push('Database type not specified');
    }

    if (config.database.type === 'mysql') {
      const mysql = config.database.mysql;
      if (!mysql.host || !mysql.user || !mysql.database) {
        errors.push('MySQL configuration incomplete');
      }
    }

    if (config.database.type === 'mongodb') {
      if (!config.database.mongodb?.uri) {
        errors.push('MongoDB URI not specified');
      }
    }

    // Validate Discord config (if bot enabled)
    if (this.isBotEnabled()) {
      if (!config.discord?.token) {
        errors.push('Discord bot token not specified');
      }
      if (!config.discord?.clientId) {
        errors.push('Discord client ID not specified');
      }
    }

    // Validate website config (if web enabled)
    if (this.isWebEnabled()) {
      if (!config.website?.jwtSecret || config.website.jwtSecret === 'CHANGE_THIS_TO_RANDOM_SECRET') {
        errors.push('Website JWT secret not properly configured');
      }
      if (!config.website?.adminSecretKey || config.website.adminSecretKey === 'CHANGE_THIS_ADMIN_SECRET') {
        errors.push('Admin secret key not properly configured');
      }
    }

    // Validate payment config
    const paymentProvider = config.payment?.provider;
    if (!paymentProvider) {
      errors.push('Payment provider not specified');
    } else {
      if (paymentProvider === 'midtrans' && !config.payment.midtrans?.serverKey) {
        errors.push('Midtrans server key not configured');
      }
      if (paymentProvider === 'duitku' && !config.payment.duitku?.apiKey) {
        errors.push('Duitku API key not configured');
      }
      if (paymentProvider === 'tripay' && !config.payment.tripay?.apiKey) {
        errors.push('Tripay API key not configured');
      }
    }

    if (errors.length > 0) {
      console.warn('[ConfigManager] Configuration warnings:');
      errors.forEach(err => console.warn(`  - ${err}`));
      return false;
    }

    console.log('[ConfigManager] Configuration validated successfully');
    return true;
  }
}

// Singleton instance
const configManager = new ConfigManager();

module.exports = configManager;
