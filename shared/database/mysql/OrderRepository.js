const IOrderRepository = require('../interfaces/IOrderRepository');
const mysqlConnection = require('./MySQLConnection');
const logger = require('../../logger/Logger');
const { v4: uuidv4 } = require('uuid');

class MySQLOrderRepository extends IOrderRepository {
  async create(orderData) {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO orders (id, discord_id, product_id, product_name, quantity, total_price, status, delivery_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await mysqlConnection.query(sql, [
        id,
        orderData.discordId,
        orderData.productId,
        orderData.productName,
        orderData.quantity,
        orderData.totalPrice,
        orderData.status || 'pending',
        orderData.deliveryData ? JSON.stringify(orderData.deliveryData) : null
      ]);

      // Update user total orders
      await mysqlConnection.query(
        'UPDATE users SET total_orders = total_orders + 1 WHERE discord_id = ?',
        [orderData.discordId]
      );

      logger.order('Order created', { id, discordId: orderData.discordId, productName: orderData.productName });
      return await this.findById(id);
    } catch (error) {
      logger.error('Failed to create order', error, { orderData });
      throw error;
    }
  }

  async findById(orderId) {
    try {
      const sql = 'SELECT * FROM orders WHERE id = ? LIMIT 1';
      const results = await mysqlConnection.query(sql, [orderId]);
      return results.length > 0 ? this.mapToOrder(results[0]) : null;
    } catch (error) {
      logger.error('Failed to find order', error, { orderId });
      throw error;
    }
  }

  async findByUser(discordId, options = {}) {
    try {
      let sql = 'SELECT * FROM orders WHERE discord_id = ?';
      const params = [discordId];

      if (options.status) {
        sql += ' AND status = ?';
        params.push(options.status);
      }

      sql += ' ORDER BY created_at DESC';

      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      const results = await mysqlConnection.query(sql, params);
      return results.map(row => this.mapToOrder(row));
    } catch (error) {
      logger.error('Failed to find orders by user', error, { discordId });
      throw error;
    }
  }

  async updateStatus(orderId, status) {
    try {
      const sql = 'UPDATE orders SET status = ? WHERE id = ?';
      await mysqlConnection.query(sql, [status, orderId]);
      logger.order('Order status updated', { orderId, status });
      return await this.findById(orderId);
    } catch (error) {
      logger.error('Failed to update order status', error, { orderId, status });
      throw error;
    }
  }

  async findAll(filters = {}, limit = 100, offset = 0) {
    try {
      let sql = 'SELECT * FROM orders WHERE 1=1';
      const params = [];

      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.discordId) {
        sql += ' AND discord_id = ?';
        params.push(filters.discordId);
      }

      if (filters.productId) {
        sql += ' AND product_id = ?';
        params.push(filters.productId);
      }

      if (filters.dateFrom) {
        sql += ' AND created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        sql += ' AND created_at <= ?';
        params.push(filters.dateTo);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const results = await mysqlConnection.query(sql, params);
      return results.map(row => this.mapToOrder(row));
    } catch (error) {
      logger.error('Failed to find all orders', error);
      throw error;
    }
  }

  async getStats(dateRange = {}) {
    try {
      let sql = `
        SELECT
          status,
          COUNT(*) as count,
          SUM(total_price) as total_revenue
        FROM orders
        WHERE 1=1
      `;
      const params = [];

      if (dateRange.from) {
        sql += ' AND created_at >= ?';
        params.push(dateRange.from);
      }

      if (dateRange.to) {
        sql += ' AND created_at <= ?';
        params.push(dateRange.to);
      }

      sql += ' GROUP BY status';

      const results = await mysqlConnection.query(sql, params);

      const stats = {
        total: 0,
        success: 0,
        pending: 0,
        failed: 0,
        cancelled: 0,
        revenue: 0
      };

      results.forEach(row => {
        stats.total += row.count;
        stats[row.status] = row.count;
        if (row.status === 'success') {
          stats.revenue = parseFloat(row.total_revenue) || 0;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get order stats', error);
      throw error;
    }
  }

  async countByStatus(status) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM orders WHERE status = ?';
      const results = await mysqlConnection.query(sql, [status]);
      return results[0].count;
    } catch (error) {
      logger.error('Failed to count orders by status', error, { status });
      throw error;
    }
  }

  async getRevenue(dateRange = {}) {
    try {
      let sql = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as orders,
          SUM(total_price) as revenue
        FROM orders
        WHERE status = 'success'
      `;
      const params = [];

      if (dateRange.from) {
        sql += ' AND created_at >= ?';
        params.push(dateRange.from);
      }

      if (dateRange.to) {
        sql += ' AND created_at <= ?';
        params.push(dateRange.to);
      }

      sql += ' GROUP BY DATE(created_at) ORDER BY date DESC';

      const results = await mysqlConnection.query(sql, params);

      return results.map(row => ({
        date: row.date,
        orders: row.orders,
        revenue: parseFloat(row.revenue)
      }));
    } catch (error) {
      logger.error('Failed to get revenue', error);
      throw error;
    }
  }

  mapToOrder(row) {
    let deliveryData = null;
    if (row.delivery_data) {
      try {
        deliveryData = JSON.parse(row.delivery_data);
      } catch (e) {
        deliveryData = row.delivery_data;
      }
    }

    return {
      id: row.id,
      discordId: row.discord_id,
      productId: row.product_id,
      productName: row.product_name,
      quantity: row.quantity,
      totalPrice: parseFloat(row.total_price),
      status: row.status,
      deliveryData,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = MySQLOrderRepository;
