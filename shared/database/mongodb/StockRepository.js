const IStockRepository = require('../interfaces/IStockRepository');
const { Stock } = require('./schemas');
const logger = require('../../logger/Logger');

class MongoDBStockRepository extends IStockRepository {
  async addStock(productId, data) {
    try {
      const stock = new Stock({ productId, data, isUsed: false });
      await stock.save();
      logger.info('Stock added', { productId, stockId: stock._id });
      return this.mapToStock(stock.toObject());
    } catch (error) {
      logger.error('Failed to add stock', error, { productId });
      throw error;
    }
  }

  async addBulkStock(productId, dataArray) {
    try {
      const stockItems = dataArray
        .filter(data => data && data.trim())
        .map(data => ({ productId, data: data.trim(), isUsed: false }));

      const result = await Stock.insertMany(stockItems);
      logger.info('Bulk stock added', { productId, count: result.length });
      return result.length;
    } catch (error) {
      logger.error('Failed to add bulk stock', error, { productId });
      throw error;
    }
  }

  async getAvailableCount(productId) {
    try {
      return await Stock.countDocuments({ productId, isUsed: false });
    } catch (error) {
      logger.error('Failed to get available stock count', error, { productId });
      throw error;
    }
  }

  async getOneStock(productId) {
    const session = await Stock.startSession();
    try {
      let stock = null;

      await session.withTransaction(async () => {
        stock = await Stock.findOne({ productId, isUsed: false })
          .sort({ createdAt: 1 })
          .session(session);
      });

      return stock ? this.mapToStock(stock.toObject()) : null;
    } catch (error) {
      logger.error('Failed to get one stock', error, { productId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  async markAsUsed(stockId, orderId) {
    try {
      const stock = await Stock.findByIdAndUpdate(
        stockId,
        { $set: { isUsed: true, usedAt: new Date(), orderId } },
        { new: true }
      ).lean();

      logger.info('Stock marked as used', { stockId, orderId });
      return stock ? this.mapToStock(stock) : null;
    } catch (error) {
      logger.error('Failed to mark stock as used', error, { stockId, orderId });
      throw error;
    }
  }

  async findByProduct(productId, onlyAvailable = true) {
    try {
      const query = { productId };
      if (onlyAvailable) query.isUsed = false;

      const stocks = await Stock.find(query).sort({ createdAt: -1 }).lean();
      return stocks.map(s => this.mapToStock(s));
    } catch (error) {
      logger.error('Failed to find stock by product', error, { productId });
      throw error;
    }
  }

  async delete(stockId) {
    try {
      const result = await Stock.deleteOne({ _id: stockId, isUsed: false });
      logger.info('Stock deleted', { stockId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete stock', error, { stockId });
      throw error;
    }
  }

  async clearProductStock(productId) {
    try {
      const result = await Stock.deleteMany({ productId, isUsed: false });
      logger.info('Product stock cleared', { productId, count: result.deletedCount });
      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to clear product stock', error, { productId });
      throw error;
    }
  }

  mapToStock(doc) {
    return {
      id: doc._id.toString(),
      productId: doc.productId.toString(),
      data: doc.data,
      isUsed: doc.isUsed,
      usedBy: doc.usedBy,
      usedAt: doc.usedAt,
      orderId: doc.orderId ? doc.orderId.toString() : null,
      createdAt: doc.createdAt
    };
  }
}

module.exports = MongoDBStockRepository;
