/**
 * IStockRepository - Interface for Stock/Inventory data operations
 */
class IStockRepository {
  /**
   * Add stock item
   * @param {string} productId
   * @param {string} data - The stock data/code
   * @returns {Promise<Object>}
   */
  async addStock(productId, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Add bulk stock
   * @param {string} productId
   * @param {Array<string>} dataArray
   * @returns {Promise<number>} - Number of items added
   */
  async addBulkStock(productId, dataArray) {
    throw new Error('Method not implemented');
  }

  /**
   * Get available stock for product
   * @param {string} productId
   * @returns {Promise<number>}
   */
  async getAvailableCount(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get one stock item (for delivery)
   * @param {string} productId
   * @returns {Promise<Object|null>}
   */
  async getOneStock(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Mark stock as used
   * @param {string} stockId
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async markAsUsed(stockId, orderId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all stock items for product
   * @param {string} productId
   * @param {boolean} onlyAvailable
   * @returns {Promise<Array>}
   */
  async findByProduct(productId, onlyAvailable = true) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete stock item
   * @param {string} stockId
   * @returns {Promise<boolean>}
   */
  async delete(stockId) {
    throw new Error('Method not implemented');
  }

  /**
   * Clear all stock for product
   * @param {string} productId
   * @returns {Promise<number>} - Number deleted
   */
  async clearProductStock(productId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IStockRepository;
