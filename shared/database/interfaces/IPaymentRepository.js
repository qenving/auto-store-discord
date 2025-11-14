/**
 * IPaymentRepository - Interface for Payment/Deposit data operations
 */
class IPaymentRepository {
  /**
   * Create payment/deposit record
   * @param {Object} paymentData
   * @returns {Promise<Object>}
   */
  async create(paymentData) {
    throw new Error('Method not implemented');
  }

  /**
   * Find payment by ID
   * @param {string} paymentId
   * @returns {Promise<Object|null>}
   */
  async findById(paymentId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find payment by invoice/order ID
   * @param {string} invoiceId
   * @returns {Promise<Object|null>}
   */
  async findByInvoiceId(invoiceId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find payments by user
   * @param {string} discordId
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async findByUser(discordId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update payment status
   * @param {string} paymentId
   * @param {string} status
   * @param {Object} metadata
   * @returns {Promise<Object>}
   */
  async updateStatus(paymentId, status, metadata = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all pending payments
   * @returns {Promise<Array>}
   */
  async getPending() {
    throw new Error('Method not implemented');
  }

  /**
   * Get expired payments (to auto-cancel)
   * @param {number} expiryMinutes
   * @returns {Promise<Array>}
   */
  async getExpired(expiryMinutes = 15) {
    throw new Error('Method not implemented');
  }

  /**
   * Mark payment as expired
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async markAsExpired(paymentId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get payment statistics
   * @param {Object} dateRange
   * @returns {Promise<Object>}
   */
  async getStats(dateRange = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = IPaymentRepository;
