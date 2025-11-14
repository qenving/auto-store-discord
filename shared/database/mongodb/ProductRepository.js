const IProductRepository = require('../interfaces/IProductRepository');
const { Product, Stock } = require('./schemas');
const logger = require('../../logger/Logger');

class MongoDBProductRepository extends IProductRepository {
  async findById(productId) {
    try {
      const product = await Product.findById(productId).lean();
      return product ? this.mapToProduct(product) : null;
    } catch (error) {
      logger.error('Failed to find product', error, { productId });
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      const query = {};
      if (filters.category) query.category = filters.category;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      const products = await Product.find(query).sort({ createdAt: -1 }).lean();
      return products.map(p => this.mapToProduct(p));
    } catch (error) {
      logger.error('Failed to find all products', error);
      throw error;
    }
  }

  async create(productData) {
    try {
      const product = new Product({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category || 'General',
        imageUrl: productData.imageUrl,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        minPurchase: productData.minPurchase || 1,
        maxPurchase: productData.maxPurchase || 1
      });

      await product.save();
      logger.info('Product created', { id: product._id, name: product.name });
      return this.mapToProduct(product.toObject());
    } catch (error) {
      logger.error('Failed to create product', error, { productData });
      throw error;
    }
  }

  async update(productId, updates) {
    try {
      const updateData = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.minPurchase !== undefined) updateData.minPurchase = updates.minPurchase;
      if (updates.maxPurchase !== undefined) updateData.maxPurchase = updates.maxPurchase;

      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: updateData },
        { new: true }
      ).lean();

      logger.info('Product updated', { productId });
      return product ? this.mapToProduct(product) : null;
    } catch (error) {
      logger.error('Failed to update product', error, { productId, updates });
      throw error;
    }
  }

  async delete(productId) {
    try {
      const result = await Product.deleteOne({ _id: productId });
      logger.info('Product deleted', { productId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete product', error, { productId });
      throw error;
    }
  }

  async getWithStock(productId) {
    try {
      const product = await Product.findById(productId).lean();
      if (!product) return null;

      const stockCount = await Stock.countDocuments({ productId });
      const availableStock = await Stock.countDocuments({ productId, isUsed: false });

      const result = this.mapToProduct(product);
      result.stockCount = stockCount;
      result.availableStock = availableStock;

      return result;
    } catch (error) {
      logger.error('Failed to get product with stock', error, { productId });
      throw error;
    }
  }

  async findByCategory(category) {
    try {
      const products = await Product.find({ category, isActive: true }).sort({ name: 1 }).lean();
      return products.map(p => this.mapToProduct(p));
    } catch (error) {
      logger.error('Failed to find products by category', error, { category });
      throw error;
    }
  }

  async getAllCategories() {
    try {
      const categories = await Product.distinct('category', { isActive: true });
      return categories.sort();
    } catch (error) {
      logger.error('Failed to get categories', error);
      throw error;
    }
  }

  mapToProduct(doc) {
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      price: doc.price,
      category: doc.category,
      imageUrl: doc.imageUrl,
      isActive: doc.isActive,
      minPurchase: doc.minPurchase,
      maxPurchase: doc.maxPurchase,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

module.exports = MongoDBProductRepository;
