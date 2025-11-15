const API_BASE_URL = 'http://localhost:3001/api';

class API {
  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============================================
  // CONFIG
  // ============================================

  static async getConfig() {
    return this.request('/config');
  }

  static async updateConfig(config) {
    return this.request('/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  static async testDatabase(type, config) {
    return this.request('/config/test-database', {
      method: 'POST',
      body: JSON.stringify({ type, config })
    });
  }

  static async testPayment(provider, config) {
    return this.request('/config/test-payment', {
      method: 'POST',
      body: JSON.stringify({ provider, config })
    });
  }

  static async exportConfig() {
    const response = await fetch(`${API_BASE_URL}/config/export`);
    const blob = await response.blob();
    return blob;
  }

  static async importConfig(config) {
    return this.request('/config/import', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  // ============================================
  // PRODUCTS
  // ============================================

  static async getProducts() {
    return this.request('/products');
  }

  static async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  static async createProduct(data) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // ============================================
  // STOCK
  // ============================================

  static async getStock(productId) {
    return this.request(`/stock/${productId}`);
  }

  static async addStock(productId, data) {
    return this.request(`/stock/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ data })
    });
  }

  static async addBulkStock(productId, items) {
    return this.request(`/stock/${productId}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  }

  static async clearStock(productId) {
    return this.request(`/stock/${productId}`, {
      method: 'DELETE'
    });
  }

  // ============================================
  // ORDERS
  // ============================================

  static async getOrders(status = null, limit = 100) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    return this.request(`/orders?${params}`);
  }

  static async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  static async getUserOrders(discordId, status = null, limit = 50) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    return this.request(`/orders/user/${discordId}?${params}`);
  }

  // ============================================
  // USERS
  // ============================================

  static async getUsers(limit = 100) {
    return this.request(`/users?limit=${limit}`);
  }

  static async getUser(discordId) {
    return this.request(`/users/${discordId}`);
  }

  static async updateUserBalance(discordId, amount, reason) {
    return this.request(`/users/${discordId}/balance`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason })
    });
  }

  // ============================================
  // STATS
  // ============================================

  static async getDashboardStats() {
    return this.request('/stats/dashboard');
  }

  static async getRevenueStats(period = '7d') {
    return this.request(`/stats/revenue?period=${period}`);
  }

  // ============================================
  // BOT CONTROL
  // ============================================

  static async getBotStatus() {
    return this.request('/bot/status');
  }

  static async restartBot() {
    return this.request('/bot/restart', { method: 'POST' });
  }

  static async shutdownBot() {
    return this.request('/bot/shutdown', { method: 'POST' });
  }
}

// Export for use in other scripts
window.API = API;
