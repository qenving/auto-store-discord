/**
 * IOrderRepository - Interface for Order data operations
 */
class IOrderRepository {
  /**
   * Create order
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async create(orderData) {
    throw new Error('Method not implemented');
  }

  /**
   * Find order by ID
   * @param {string} orderId
   * @returns {Promise<Object|null>}
   */
  async findById(orderId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find orders by user
   * @param {string} discordId
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async findByUser(discordId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update order status
   * @param {string} orderId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateStatus(orderId, status) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all orders with filters
   * @param {Object} filters
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, limit = 100, offset = 0) {
    throw new Error('Method not implemented');
  }

  /**
   * Get order statistics
   * @param {Object} dateRange
   * @returns {Promise<Object>}
   */
  async getStats(dateRange = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Count orders by status
   * @param {string} status
   * @returns {Promise<number>}
   */
  async countByStatus(status) {
    throw new Error('Method not implemented');
  }

  /**
   * Get revenue statistics
   * @param {Object} dateRange
   * @returns {Promise<Object>}
   */
  async getRevenue(dateRange = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = IOrderRepository;
