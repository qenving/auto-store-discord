const IOrderRepository = require('../interfaces/IOrderRepository');
const { Order, User } = require('./schemas');
const logger = require('../../logger/Logger');

class MongoDBOrderRepository extends IOrderRepository {
  async create(orderData) {
    try {
      const order = new Order({
        discordId: orderData.discordId,
        productId: orderData.productId,
        productName: orderData.productName,
        quantity: orderData.quantity,
        totalPrice: orderData.totalPrice,
        status: orderData.status || 'pending',
        deliveryData: orderData.deliveryData
      });

      await order.save();

      // Update user total orders
      await User.updateOne(
        { discordId: orderData.discordId },
        { $inc: { totalOrders: 1 } }
      );

      logger.order('Order created', { id: order._id, discordId: orderData.discordId });
      return this.mapToOrder(order.toObject());
    } catch (error) {
      logger.error('Failed to create order', error, { orderData });
      throw error;
    }
  }

  async findById(orderId) {
    try {
      const order = await Order.findById(orderId).lean();
      return order ? this.mapToOrder(order) : null;
    } catch (error) {
      logger.error('Failed to find order', error, { orderId });
      throw error;
    }
  }

  async findByUser(discordId, options = {}) {
    try {
      const query = { discordId };
      if (options.status) query.status = options.status;

      let queryBuilder = Order.find(query).sort({ createdAt: -1 });

      if (options.limit) queryBuilder = queryBuilder.limit(options.limit);

      const orders = await queryBuilder.lean();
      return orders.map(o => this.mapToOrder(o));
    } catch (error) {
      logger.error('Failed to find orders by user', error, { discordId });
      throw error;
    }
  }

  async updateStatus(orderId, status) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status } },
        { new: true }
      ).lean();

      logger.order('Order status updated', { orderId, status });
      return order ? this.mapToOrder(order) : null;
    } catch (error) {
      logger.error('Failed to update order status', error, { orderId, status });
      throw error;
    }
  }

  async findAll(filters = {}, limit = 100, offset = 0) {
    try {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.discordId) query.discordId = filters.discordId;
      if (filters.productId) query.productId = filters.productId;

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return orders.map(o => this.mapToOrder(o));
    } catch (error) {
      logger.error('Failed to find all orders', error);
      throw error;
    }
  }

  async getStats(dateRange = {}) {
    try {
      const match = {};
      if (dateRange.from || dateRange.to) {
        match.createdAt = {};
        if (dateRange.from) match.createdAt.$gte = new Date(dateRange.from);
        if (dateRange.to) match.createdAt.$lte = new Date(dateRange.to);
      }

      const results = await Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' }
          }
        }
      ]);

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
        stats[row._id] = row.count;
        if (row._id === 'success') {
          stats.revenue = row.totalRevenue;
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
      return await Order.countDocuments({ status });
    } catch (error) {
      logger.error('Failed to count orders by status', error, { status });
      throw error;
    }
  }

  async getRevenue(dateRange = {}) {
    try {
      const match = { status: 'success' };
      if (dateRange.from || dateRange.to) {
        match.createdAt = {};
        if (dateRange.from) match.createdAt.$gte = new Date(dateRange.from);
        if (dateRange.to) match.createdAt.$lte = new Date(dateRange.to);
      }

      const results = await Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      return results.map(row => ({
        date: row._id,
        orders: row.orders,
        revenue: row.revenue
      }));
    } catch (error) {
      logger.error('Failed to get revenue', error);
      throw error;
    }
  }

  mapToOrder(doc) {
    return {
      id: doc._id.toString(),
      discordId: doc.discordId,
      productId: doc.productId.toString(),
      productName: doc.productName,
      quantity: doc.quantity,
      totalPrice: doc.totalPrice,
      status: doc.status,
      deliveryData: doc.deliveryData,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

module.exports = MongoDBOrderRepository;
