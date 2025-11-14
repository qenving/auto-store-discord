const PaymentService = require('./PaymentService');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../logger/Logger');

/**
 * MidtransService - Midtrans payment integration
 */
class MidtransService extends PaymentService {
  constructor(config) {
    super(config);
    this.provider = 'midtrans';
    this.serverKey = config.serverKey;
    this.clientKey = config.clientKey;
    this.isProduction = config.isProduction || false;
    this.baseUrl = this.isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';
  }

  /**
   * Create payment
   */
  async createPayment(data) {
    try {
      const { discordId, username, amount, email } = data;
      const invoiceId = this.generateInvoiceId();

      const payload = {
        transaction_details: {
          order_id: invoiceId,
          gross_amount: amount
        },
        customer_details: {
          first_name: username || discordId,
          email: email || `${discordId}@discord.user`,
          phone: '08123456789'
        },
        item_details: [
          {
            id: 'DEPOSIT',
            price: amount,
            quantity: 1,
            name: 'Deposit Saldo'
          }
        ],
        payment_type: 'qris'
      };

      const auth = Buffer.from(`${this.serverKey}:`).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/v2/charge`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      const expiredAt = this.calculateExpiry(15);

      logger.payment('Midtrans payment created', {
        invoiceId,
        amount,
        discordId
      });

      return {
        invoiceId,
        qrUrl: response.data.actions?.find(a => a.name === 'generate-qr-code')?.url || null,
        paymentUrl: response.data.actions?.find(a => a.name === 'deeplink-redirect')?.url || null,
        expiredAt,
        provider: this.provider,
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Failed to create Midtrans payment', error, {
        response: error.response?.data
      });
      throw new Error(`Midtrans error: ${error.response?.data?.error_messages?.[0] || error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(invoiceId) {
    try {
      const auth = Buffer.from(`${this.serverKey}:`).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/v2/${invoiceId}/status`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      const data = response.data;
      let status = 'pending';

      if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
        status = 'success';
      } else if (data.transaction_status === 'expire' || data.transaction_status === 'cancel') {
        status = 'expired';
      } else if (data.transaction_status === 'deny' || data.transaction_status === 'failure') {
        status = 'failed';
      }

      return {
        status,
        paidAt: data.settlement_time ? new Date(data.settlement_time) : null,
        amount: parseFloat(data.gross_amount),
        transactionStatus: data.transaction_status
      };
    } catch (error) {
      logger.error('Failed to check Midtrans status', error, { invoiceId });
      throw error;
    }
  }

  /**
   * Verify callback signature
   */
  verifyCallback(payload, signature) {
    try {
      const { order_id, status_code, gross_amount } = payload;

      const signatureKey = crypto
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${this.serverKey}`)
        .digest('hex');

      return signatureKey === signature;
    } catch (error) {
      logger.error('Failed to verify Midtrans callback', error);
      return false;
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(invoiceId) {
    try {
      const auth = Buffer.from(`${this.serverKey}:`).toString('base64');

      await axios.post(
        `${this.baseUrl}/v2/${invoiceId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      logger.payment('Midtrans payment cancelled', { invoiceId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel Midtrans payment', error, { invoiceId });
      return false;
    }
  }
}

module.exports = MidtransService;
