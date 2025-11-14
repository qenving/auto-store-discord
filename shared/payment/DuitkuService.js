const PaymentService = require('./PaymentService');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../logger/Logger');

/**
 * DuitkuService - Duitku payment integration
 */
class DuitkuService extends PaymentService {
  constructor(config) {
    super(config);
    this.provider = 'duitku';
    this.merchantCode = config.merchantCode;
    this.apiKey = config.apiKey;
    this.callbackUrl = config.callbackUrl;
    this.baseUrl = 'https://passport.duitku.com/webapi/api/merchant';
  }

  /**
   * Create payment
   */
  async createPayment(data) {
    try {
      const { discordId, username, amount, email } = data;
      const invoiceId = this.generateInvoiceId();

      const signature = crypto
        .createHash('md5')
        .update(`${this.merchantCode}${invoiceId}${amount}${this.apiKey}`)
        .digest('hex');

      const payload = {
        merchantCode: this.merchantCode,
        paymentAmount: amount,
        paymentMethod: 'SP', // QRIS
        merchantOrderId: invoiceId,
        productDetails: 'Deposit Saldo',
        email: email || `${discordId}@discord.user`,
        customerVaName: username || discordId,
        phoneNumber: '08123456789',
        callbackUrl: this.callbackUrl,
        returnUrl: this.callbackUrl,
        signature: signature,
        expiryPeriod: 15
      };

      const response = await axios.post(
        `${this.baseUrl}/v2/inquiry`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const expiredAt = this.calculateExpiry(15);

      logger.payment('Duitku payment created', {
        invoiceId,
        amount,
        discordId
      });

      return {
        invoiceId,
        qrUrl: response.data.qrString || null,
        paymentUrl: response.data.paymentUrl || null,
        expiredAt,
        provider: this.provider,
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Failed to create Duitku payment', error, {
        response: error.response?.data
      });
      throw new Error(`Duitku error: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(invoiceId) {
    try {
      const signature = crypto
        .createHash('md5')
        .update(`${this.merchantCode}${invoiceId}${this.apiKey}`)
        .digest('hex');

      const response = await axios.post(
        `${this.baseUrl}/transactionStatus`,
        {
          merchantCode: this.merchantCode,
          merchantOrderId: invoiceId,
          signature: signature
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data;
      let status = 'pending';

      if (data.statusCode === '00') {
        status = 'success';
      } else if (data.statusCode === '01') {
        status = 'pending';
      } else if (data.statusCode === '02') {
        status = 'expired';
      } else {
        status = 'failed';
      }

      return {
        status,
        paidAt: data.settlementDate ? new Date(data.settlementDate) : null,
        amount: parseFloat(data.amount),
        statusCode: data.statusCode
      };
    } catch (error) {
      logger.error('Failed to check Duitku status', error, { invoiceId });
      throw error;
    }
  }

  /**
   * Verify callback signature
   */
  verifyCallback(payload, signature) {
    try {
      const { merchantCode, amount, merchantOrderId } = payload;

      const calculatedSignature = crypto
        .createHash('md5')
        .update(`${merchantCode}${amount}${merchantOrderId}${this.apiKey}`)
        .digest('hex');

      return calculatedSignature === signature;
    } catch (error) {
      logger.error('Failed to verify Duitku callback', error);
      return false;
    }
  }

  /**
   * Cancel payment (Duitku doesn't support cancel, just mark as expired)
   */
  async cancelPayment(invoiceId) {
    logger.payment('Duitku payment cancel not supported, mark as expired', { invoiceId });
    return true;
  }
}

module.exports = DuitkuService;
