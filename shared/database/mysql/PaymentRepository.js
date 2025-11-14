const IPaymentRepository = require('../interfaces/IPaymentRepository');
const mysqlConnection = require('./MySQLConnection');
const logger = require('../../logger/Logger');
const { v4: uuidv4 } = require('uuid');

class MySQLPaymentRepository extends IPaymentRepository {
  async create(paymentData) {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO payments (id, discord_id, invoice_id, amount, status, provider, qr_url, payment_url, expired_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await mysqlConnection.query(sql, [
        id,
        paymentData.discordId,
        paymentData.invoiceId,
        paymentData.amount,
        paymentData.status || 'pending',
        paymentData.provider,
        paymentData.qrUrl || null,
        paymentData.paymentUrl || null,
        paymentData.expiredAt,
        paymentData.metadata ? JSON.stringify(paymentData.metadata) : null
      ]);

      logger.payment('Payment created', { id, invoiceId: paymentData.invoiceId, amount: paymentData.amount });
      return await this.findById(id);
    } catch (error) {
      logger.error('Failed to create payment', error, { paymentData });
      throw error;
    }
  }

  async findById(paymentId) {
    try {
      const sql = 'SELECT * FROM payments WHERE id = ? LIMIT 1';
      const results = await mysqlConnection.query(sql, [paymentId]);
      return results.length > 0 ? this.mapToPayment(results[0]) : null;
    } catch (error) {
      logger.error('Failed to find payment', error, { paymentId });
      throw error;
    }
  }

  async findByInvoiceId(invoiceId) {
    try {
      const sql = 'SELECT * FROM payments WHERE invoice_id = ? LIMIT 1';
      const results = await mysqlConnection.query(sql, [invoiceId]);
      return results.length > 0 ? this.mapToPayment(results[0]) : null;
    } catch (error) {
      logger.error('Failed to find payment by invoice', error, { invoiceId });
      throw error;
    }
  }

  async findByUser(discordId, options = {}) {
    try {
      let sql = 'SELECT * FROM payments WHERE discord_id = ?';
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
      return results.map(row => this.mapToPayment(row));
    } catch (error) {
      logger.error('Failed to find payments by user', error, { discordId });
      throw error;
    }
  }

  async updateStatus(paymentId, status, metadata = {}) {
    try {
      const updates = ['status = ?'];
      const params = [status];

      if (status === 'success') {
        updates.push('paid_at = CURRENT_TIMESTAMP');
      }

      if (Object.keys(metadata).length > 0) {
        updates.push('metadata = ?');
        params.push(JSON.stringify(metadata));
      }

      params.push(paymentId);

      const sql = `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`;
      await mysqlConnection.query(sql, params);

      logger.payment('Payment status updated', { paymentId, status });
      return await this.findById(paymentId);
    } catch (error) {
      logger.error('Failed to update payment status', error, { paymentId, status });
      throw error;
    }
  }

  async getPending() {
    try {
      const sql = 'SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC';
      const results = await mysqlConnection.query(sql, ['pending']);
      return results.map(row => this.mapToPayment(row));
    } catch (error) {
      logger.error('Failed to get pending payments', error);
      throw error;
    }
  }

  async getExpired(expiryMinutes = 15) {
    try {
      const sql = `
        SELECT * FROM payments
        WHERE status = 'pending'
        AND expired_at < NOW()
        ORDER BY created_at DESC
      `;
      const results = await mysqlConnection.query(sql);
      return results.map(row => this.mapToPayment(row));
    } catch (error) {
      logger.error('Failed to get expired payments', error);
      throw error;
    }
  }

  async markAsExpired(paymentId) {
    try {
      const sql = 'UPDATE payments SET status = ? WHERE id = ?';
      await mysqlConnection.query(sql, ['expired', paymentId]);
      logger.payment('Payment marked as expired', { paymentId });
      return await this.findById(paymentId);
    } catch (error) {
      logger.error('Failed to mark payment as expired', error, { paymentId });
      throw error;
    }
  }

  async getStats(dateRange = {}) {
    try {
      let sql = `
        SELECT
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM payments
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
        expired: 0,
        totalAmount: 0
      };

      results.forEach(row => {
        stats.total += row.count;
        stats[row.status] = row.count;
        if (row.status === 'success') {
          stats.totalAmount = parseFloat(row.total_amount) || 0;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get payment stats', error);
      throw error;
    }
  }

  mapToPayment(row) {
    let metadata = null;
    if (row.metadata) {
      try {
        metadata = JSON.parse(row.metadata);
      } catch (e) {
        metadata = row.metadata;
      }
    }

    return {
      id: row.id,
      discordId: row.discord_id,
      invoiceId: row.invoice_id,
      amount: parseFloat(row.amount),
      status: row.status,
      provider: row.provider,
      qrUrl: row.qr_url,
      paymentUrl: row.payment_url,
      expiredAt: row.expired_at,
      paidAt: row.paid_at,
      metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = MySQLPaymentRepository;
