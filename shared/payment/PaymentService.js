/**
 * PaymentService - Abstract base class for payment providers
 * All payment providers must extend this class
 */
class PaymentService {
  constructor(config) {
    this.config = config;
    this.provider = '';
  }

  /**
   * Create payment/deposit request
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} - { invoiceId, qrUrl, paymentUrl, expiredAt }
   */
  async createPayment(data) {
    throw new Error('createPayment() must be implemented');
  }

  /**
   * Check payment status
   * @param {string} invoiceId
   * @returns {Promise<Object>} - { status, paidAt, amount }
   */
  async checkPaymentStatus(invoiceId) {
    throw new Error('checkPaymentStatus() must be implemented');
  }

  /**
   * Verify callback signature
   * @param {Object} payload - Callback payload
   * @param {string} signature - Signature from provider
   * @returns {boolean}
   */
  verifyCallback(payload, signature) {
    throw new Error('verifyCallback() must be implemented');
  }

  /**
   * Cancel payment
   * @param {string} invoiceId
   * @returns {Promise<boolean>}
   */
  async cancelPayment(invoiceId) {
    throw new Error('cancelPayment() must be implemented');
  }

  /**
   * Get provider name
   */
  getProviderName() {
    return this.provider;
  }

  /**
   * Generate unique invoice ID
   */
  generateInvoiceId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Calculate expiry time
   * @param {number} minutes
   * @returns {Date}
   */
  calculateExpiry(minutes = 15) {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
  }
}

module.exports = PaymentService;
