/**
 * IProductRepository - Interface for Product data operations
 */
class IProductRepository {
  /**
   * Find product by ID
   * @param {string} productId
   * @returns {Promise<Object|null>}
   */
  async findById(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all products
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Create product
   * @param {Object} productData
   * @returns {Promise<Object>}
   */
  async create(productData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update product
   * @param {string} productId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(productId, updates) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete product
   * @param {string} productId
   * @returns {Promise<boolean>}
   */
  async delete(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get product with stock count
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async getWithStock(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find products by category
   * @param {string} category
   * @returns {Promise<Array>}
   */
  async findByCategory(category) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all categories
   * @returns {Promise<Array>}
   */
  async getAllCategories() {
    throw new Error('Method not implemented');
  }
}

module.exports = IProductRepository;
