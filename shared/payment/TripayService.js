const PaymentService = require('./PaymentService');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../logger/Logger');

/**
 * TripayService - Tripay payment integration
 */
class TripayService extends PaymentService {
  constructor(config) {
    super(config);
    this.provider = 'tripay';
    this.merchantCode = config.merchantCode;
    this.apiKey = config.apiKey;
    this.privateKey = config.privateKey;
    this.callbackUrl = config.callbackUrl;
    this.baseUrl = 'https://tripay.co.id/api';
  }

  /**
   * Create payment
   */
  async createPayment(data) {
    try {
      const { discordId, username, amount, email } = data;
      const invoiceId = this.generateInvoiceId();

      const expiry = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes

      const signatureData = this.merchantCode + invoiceId + amount;
      const signature = crypto
        .createHmac('sha256', this.privateKey)
        .update(signatureData)
        .digest('hex');

      const payload = {
        method: 'QRIS',
        merchant_ref: invoiceId,
        amount: amount,
        customer_name: username || discordId,
        customer_email: email || `${discordId}@discord.user`,
        customer_phone: '08123456789',
        order_items: [
          {
            name: 'Deposit Saldo',
            price: amount,
            quantity: 1
          }
        ],
        callback_url: this.callbackUrl,
        return_url: this.callbackUrl,
        expired_time: expiry,
        signature: signature
      };

      const response = await axios.post(
        `${this.baseUrl}/transaction/create`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const expiredAt = this.calculateExpiry(15);

      logger.payment('Tripay payment created', {
        invoiceId,
        amount,
        discordId
      });

      return {
        invoiceId,
        qrUrl: response.data.data?.qr_url || null,
        paymentUrl: response.data.data?.checkout_url || null,
        expiredAt,
        provider: this.provider,
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Failed to create Tripay payment', error, {
        response: error.response?.data
      });
      throw new Error(`Tripay error: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(invoiceId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/detail`,
        {
          params: {
            reference: invoiceId
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const data = response.data.data;
      let status = 'pending';

      if (data.status === 'PAID') {
        status = 'success';
      } else if (data.status === 'EXPIRED' || data.status === 'FAILED') {
        status = 'expired';
      } else if (data.status === 'UNPAID') {
        status = 'pending';
      }

      return {
        status,
        paidAt: data.paid_at ? new Date(data.paid_at * 1000) : null,
        amount: parseFloat(data.amount),
        tripayStatus: data.status
      };
    } catch (error) {
      logger.error('Failed to check Tripay status', error, { invoiceId });
      throw error;
    }
  }

  /**
   * Verify callback signature
   */
  verifyCallback(payload, signature) {
    try {
      const json = JSON.stringify(payload);

      const calculatedSignature = crypto
        .createHmac('sha256', this.privateKey)
        .update(json)
        .digest('hex');

      return calculatedSignature === signature;
    } catch (error) {
      logger.error('Failed to verify Tripay callback', error);
      return false;
    }
  }

  /**
   * Cancel payment (Tripay doesn't support cancel)
   */
  async cancelPayment(invoiceId) {
    logger.payment('Tripay payment cancel not supported', { invoiceId });
    return true;
  }
}

module.exports = TripayService;
