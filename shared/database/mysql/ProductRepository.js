const IProductRepository = require('../interfaces/IProductRepository');
const mysqlConnection = require('./MySQLConnection');
const logger = require('../../logger/Logger');
const { v4: uuidv4 } = require('uuid');

class MySQLProductRepository extends IProductRepository {
  async findById(productId) {
    try {
      const sql = 'SELECT * FROM products WHERE id = ? LIMIT 1';
      const results = await mysqlConnection.query(sql, [productId]);
      return results.length > 0 ? this.mapToProduct(results[0]) : null;
    } catch (error) {
      logger.error('Failed to find product', error, { productId });
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      let sql = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (filters.category) {
        sql += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.isActive !== undefined) {
        sql += ' AND is_active = ?';
        params.push(filters.isActive);
      }

      sql += ' ORDER BY created_at DESC';

      const results = await mysqlConnection.query(sql, params);
      return results.map(row => this.mapToProduct(row));
    } catch (error) {
      logger.error('Failed to find all products', error);
      throw error;
    }
  }

  async create(productData) {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO products (id, name, description, price, category, image_url, is_active, min_purchase, max_purchase)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await mysqlConnection.query(sql, [
        id,
        productData.name,
        productData.description || null,
        productData.price,
        productData.category || 'General',
        productData.imageUrl || null,
        productData.isActive !== undefined ? productData.isActive : true,
        productData.minPurchase || 1,
        productData.maxPurchase || 1
      ]);

      logger.info('Product created', { id, name: productData.name });
      return await this.findById(id);
    } catch (error) {
      logger.error('Failed to create product', error, { productData });
      throw error;
    }
  }

  async update(productId, updates) {
    try {
      const fields = [];
      const values = [];

      const fieldMap = {
        name: 'name',
        description: 'description',
        price: 'price',
        category: 'category',
        imageUrl: 'image_url',
        isActive: 'is_active',
        minPurchase: 'min_purchase',
        maxPurchase: 'max_purchase'
      };

      for (const [key, dbField] of Object.entries(fieldMap)) {
        if (updates[key] !== undefined) {
          fields.push(`${dbField} = ?`);
          values.push(updates[key]);
        }
      }

      if (fields.length === 0) {
        return await this.findById(productId);
      }

      values.push(productId);
      const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

      await mysqlConnection.query(sql, values);
      logger.info('Product updated', { productId });
      return await this.findById(productId);
    } catch (error) {
      logger.error('Failed to update product', error, { productId, updates });
      throw error;
    }
  }

  async delete(productId) {
    try {
      const sql = 'DELETE FROM products WHERE id = ?';
      const result = await mysqlConnection.query(sql, [productId]);
      logger.info('Product deleted', { productId });
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Failed to delete product', error, { productId });
      throw error;
    }
  }

  async getWithStock(productId) {
    try {
      const sql = `
        SELECT p.*,
               COUNT(s.id) as stock_count,
               SUM(CASE WHEN s.is_used = 0 THEN 1 ELSE 0 END) as available_stock
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.id = ?
        GROUP BY p.id
      `;

      const results = await mysqlConnection.query(sql, [productId]);

      if (results.length === 0) {
        return null;
      }

      const product = this.mapToProduct(results[0]);
      product.stockCount = results[0].stock_count || 0;
      product.availableStock = results[0].available_stock || 0;

      return product;
    } catch (error) {
      logger.error('Failed to get product with stock', error, { productId });
      throw error;
    }
  }

  async findByCategory(category) {
    try {
      const sql = 'SELECT * FROM products WHERE category = ? AND is_active = true ORDER BY name';
      const results = await mysqlConnection.query(sql, [category]);
      return results.map(row => this.mapToProduct(row));
    } catch (error) {
      logger.error('Failed to find products by category', error, { category });
      throw error;
    }
  }

  async getAllCategories() {
    try {
      const sql = 'SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category';
      const results = await mysqlConnection.query(sql);
      return results.map(row => row.category);
    } catch (error) {
      logger.error('Failed to get categories', error);
      throw error;
    }
  }

  mapToProduct(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category,
      imageUrl: row.image_url,
      isActive: Boolean(row.is_active),
      minPurchase: row.min_purchase,
      maxPurchase: row.max_purchase,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = MySQLProductRepository;
