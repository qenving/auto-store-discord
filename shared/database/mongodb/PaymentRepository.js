const IPaymentRepository = require('../interfaces/IPaymentRepository');
const { Payment } = require('./schemas');
const logger = require('../../logger/Logger');

class MongoDBPaymentRepository extends IPaymentRepository {
  async create(paymentData) {
    try {
      const payment = new Payment({
        discordId: paymentData.discordId,
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount,
        status: paymentData.status || 'pending',
        provider: paymentData.provider,
        qrUrl: paymentData.qrUrl,
        paymentUrl: paymentData.paymentUrl,
        expiredAt: paymentData.expiredAt,
        metadata: paymentData.metadata
      });

      await payment.save();
      logger.payment('Payment created', { id: payment._id, invoiceId: payment.invoiceId });
      return this.mapToPayment(payment.toObject());
    } catch (error) {
      logger.error('Failed to create payment', error, { paymentData });
      throw error;
    }
  }

  async findById(paymentId) {
    try {
      const payment = await Payment.findById(paymentId).lean();
      return payment ? this.mapToPayment(payment) : null;
    } catch (error) {
      logger.error('Failed to find payment', error, { paymentId });
      throw error;
    }
  }

  async findByInvoiceId(invoiceId) {
    try {
      const payment = await Payment.findOne({ invoiceId }).lean();
      return payment ? this.mapToPayment(payment) : null;
    } catch (error) {
      logger.error('Failed to find payment by invoice', error, { invoiceId });
      throw error;
    }
  }

  async findByUser(discordId, options = {}) {
    try {
      const query = { discordId };
      if (options.status) query.status = options.status;

      let queryBuilder = Payment.find(query).sort({ createdAt: -1 });

      if (options.limit) queryBuilder = queryBuilder.limit(options.limit);

      const payments = await queryBuilder.lean();
      return payments.map(p => this.mapToPayment(p));
    } catch (error) {
      logger.error('Failed to find payments by user', error, { discordId });
      throw error;
    }
  }

  async updateStatus(paymentId, status, metadata = {}) {
    try {
      const updates = { status };

      if (status === 'success') {
        updates.paidAt = new Date();
      }

      if (Object.keys(metadata).length > 0) {
        updates.metadata = metadata;
      }

      const payment = await Payment.findByIdAndUpdate(
        paymentId,
        { $set: updates },
        { new: true }
      ).lean();

      logger.payment('Payment status updated', { paymentId, status });
      return payment ? this.mapToPayment(payment) : null;
    } catch (error) {
      logger.error('Failed to update payment status', error, { paymentId, status });
      throw error;
    }
  }

  async getPending() {
    try {
      const payments = await Payment.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .lean();
      return payments.map(p => this.mapToPayment(p));
    } catch (error) {
      logger.error('Failed to get pending payments', error);
      throw error;
    }
  }

  async getExpired(expiryMinutes = 15) {
    try {
      const payments = await Payment.find({
        status: 'pending',
        expiredAt: { $lt: new Date() }
      })
        .sort({ createdAt: -1 })
        .lean();

      return payments.map(p => this.mapToPayment(p));
    } catch (error) {
      logger.error('Failed to get expired payments', error);
      throw error;
    }
  }

  async markAsExpired(paymentId) {
    try {
      const payment = await Payment.findByIdAndUpdate(
        paymentId,
        { $set: { status: 'expired' } },
        { new: true }
      ).lean();

      logger.payment('Payment marked as expired', { paymentId });
      return payment ? this.mapToPayment(payment) : null;
    } catch (error) {
      logger.error('Failed to mark payment as expired', error, { paymentId });
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

      const results = await Payment.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const stats = {
        total: 0,
        success: 0,
        pending: 0,
        failed: 0,
        expired: 0,
        totalAmount: 0
      };

      results.forEach(row => {
        stats.total += row.count;
        stats[row._id] = row.count;
        if (row._id === 'success') {
          stats.totalAmount = row.totalAmount;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get payment stats', error);
      throw error;
    }
  }

  mapToPayment(doc) {
    return {
      id: doc._id.toString(),
      discordId: doc.discordId,
      invoiceId: doc.invoiceId,
      amount: doc.amount,
      status: doc.status,
      provider: doc.provider,
      qrUrl: doc.qrUrl,
      paymentUrl: doc.paymentUrl,
      expiredAt: doc.expiredAt,
      paidAt: doc.paidAt,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

module.exports = MongoDBPaymentRepository;
