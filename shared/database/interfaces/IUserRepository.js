/**
 * IUserRepository - Interface for User data operations
 * All database implementations must follow this contract
 */
class IUserRepository {
  /**
   * Find user by Discord ID
   * @param {string} discordId
   * @returns {Promise<Object|null>}
   */
  async findByDiscordId(discordId) {
    throw new Error('Method not implemented');
  }

  /**
   * Create new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update user
   * @param {string} discordId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(discordId, updates) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user balance
   * @param {string} discordId
   * @returns {Promise<number>}
   */
  async getBalance(discordId) {
    throw new Error('Method not implemented');
  }

  /**
   * Add balance
   * @param {string} discordId
   * @param {number} amount
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async addBalance(discordId, amount, reason = 'manual') {
    throw new Error('Method not implemented');
  }

  /**
   * Subtract balance
   * @param {string} discordId
   * @param {number} amount
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async subtractBalance(discordId, amount, reason = 'purchase') {
    throw new Error('Method not implemented');
  }

  /**
   * Get all users (with pagination)
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  async findAll(limit = 100, offset = 0) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user count
   * @returns {Promise<number>}
   */
  async count() {
    throw new Error('Method not implemented');
  }

  /**
   * Delete user
   * @param {string} discordId
   * @returns {Promise<boolean>}
   */
  async delete(discordId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
