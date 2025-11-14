const IStockRepository = require('../interfaces/IStockRepository');
const mysqlConnection = require('./MySQLConnection');
const logger = require('../../logger/Logger');
const { v4: uuidv4 } = require('uuid');

class MySQLStockRepository extends IStockRepository {
  async addStock(productId, data) {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO stock (id, product_id, data, is_used)
        VALUES (?, ?, ?, false)
      `;

      await mysqlConnection.query(sql, [id, productId, data]);
      logger.info('Stock added', { productId, stockId: id });

      return { id, productId, data, isUsed: false };
    } catch (error) {
      logger.error('Failed to add stock', error, { productId });
      throw error;
    }
  }

  async addBulkStock(productId, dataArray) {
    const connection = await mysqlConnection.getConnection();
    try {
      await connection.beginTransaction();

      let count = 0;
      for (const data of dataArray) {
        if (data && data.trim()) {
          const id = uuidv4();
          await connection.execute(
            'INSERT INTO stock (id, product_id, data, is_used) VALUES (?, ?, ?, false)',
            [id, productId, data.trim()]
          );
          count++;
        }
      }

      await connection.commit();
      logger.info('Bulk stock added', { productId, count });

      return count;
    } catch (error) {
      await connection.rollback();
      logger.error('Failed to add bulk stock', error, { productId });
      throw error;
    } finally {
      connection.release();
    }
  }

  async getAvailableCount(productId) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM stock WHERE product_id = ? AND is_used = false';
      const results = await mysqlConnection.query(sql, [productId]);
      return results[0].count;
    } catch (error) {
      logger.error('Failed to get available stock count', error, { productId });
      throw error;
    }
  }

  async getOneStock(productId) {
    const connection = await mysqlConnection.getConnection();
    try {
      await connection.beginTransaction();

      // Get one available stock with row lock
      const [results] = await connection.execute(
        'SELECT * FROM stock WHERE product_id = ? AND is_used = false ORDER BY created_at ASC LIMIT 1 FOR UPDATE',
        [productId]
      );

      if (results.length === 0) {
        await connection.rollback();
        return null;
      }

      const stock = results[0];
      await connection.commit();

      return this.mapToStock(stock);
    } catch (error) {
      await connection.rollback();
      logger.error('Failed to get one stock', error, { productId });
      throw error;
    } finally {
      connection.release();
    }
  }

  async markAsUsed(stockId, orderId) {
    try {
      const sql = `
        UPDATE stock
        SET is_used = true, used_at = CURRENT_TIMESTAMP, order_id = ?
        WHERE id = ?
      `;

      await mysqlConnection.query(sql, [orderId, stockId]);
      logger.info('Stock marked as used', { stockId, orderId });

      const results = await mysqlConnection.query('SELECT * FROM stock WHERE id = ?', [stockId]);
      return results.length > 0 ? this.mapToStock(results[0]) : null;
    } catch (error) {
      logger.error('Failed to mark stock as used', error, { stockId, orderId });
      throw error;
    }
  }

  async findByProduct(productId, onlyAvailable = true) {
    try {
      let sql = 'SELECT * FROM stock WHERE product_id = ?';
      const params = [productId];

      if (onlyAvailable) {
        sql += ' AND is_used = false';
      }

      sql += ' ORDER BY created_at DESC';

      const results = await mysqlConnection.query(sql, params);
      return results.map(row => this.mapToStock(row));
    } catch (error) {
      logger.error('Failed to find stock by product', error, { productId });
      throw error;
    }
  }

  async delete(stockId) {
    try {
      const sql = 'DELETE FROM stock WHERE id = ? AND is_used = false';
      const result = await mysqlConnection.query(sql, [stockId]);
      logger.info('Stock deleted', { stockId });
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Failed to delete stock', error, { stockId });
      throw error;
    }
  }

  async clearProductStock(productId) {
    try {
      const sql = 'DELETE FROM stock WHERE product_id = ? AND is_used = false';
      const result = await mysqlConnection.query(sql, [productId]);
      logger.info('Product stock cleared', { productId, count: result.affectedRows });
      return result.affectedRows;
    } catch (error) {
      logger.error('Failed to clear product stock', error, { productId });
      throw error;
    }
  }

  mapToStock(row) {
    return {
      id: row.id,
      productId: row.product_id,
      data: row.data,
      isUsed: Boolean(row.is_used),
      usedBy: row.used_by,
      usedAt: row.used_at,
      orderId: row.order_id,
      createdAt: row.created_at
    };
  }
}

module.exports = MySQLStockRepository;
