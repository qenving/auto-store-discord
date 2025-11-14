const configManager = require('../config/ConfigManager');
const logger = require('../logger/Logger');

const MidtransService = require('./MidtransService');
const DuitkuService = require('./DuitkuService');
const TripayService = require('./TripayService');

/**
 * PaymentManager - Factory for payment services
 */
class PaymentManager {
  constructor() {
    this.service = null;
    this.provider = null;
  }

  /**
   * Initialize payment service based on config
   */
  initialize() {
    try {
      const paymentConfig = configManager.getPaymentConfig();
      this.provider = paymentConfig.provider;

      logger.info(`Initializing payment provider: ${this.provider}`);

      switch (this.provider) {
        case 'midtrans':
          this.service = new MidtransService(paymentConfig.midtrans);
          break;

        case 'duitku':
          this.service = new DuitkuService(paymentConfig.duitku);
          break;

        case 'tripay':
          this.service = new TripayService(paymentConfig.tripay);
          break;

        default:
          throw new Error(`Unsupported payment provider: ${this.provider}`);
      }

      logger.info('Payment service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize payment service', error);
      throw error;
    }
  }

  /**
   * Get payment service
   */
  getService() {
    if (!this.service) {
      throw new Error('Payment service not initialized. Call initialize() first.');
    }
    return this.service;
  }

  /**
   * Get provider name
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Create payment
   */
  async createPayment(data) {
    return await this.getService().createPayment(data);
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(invoiceId) {
    return await this.getService().checkPaymentStatus(invoiceId);
  }

  /**
   * Verify callback
   */
  verifyCallback(payload, signature) {
    return this.getService().verifyCallback(payload, signature);
  }

  /**
   * Cancel payment
   */
  async cancelPayment(invoiceId) {
    return await this.getService().cancelPayment(invoiceId);
  }
}

// Singleton instance
const paymentManager = new PaymentManager();

module.exports = paymentManager;
