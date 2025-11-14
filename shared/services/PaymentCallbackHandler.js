const databaseProvider = require('../database/provider/DatabaseProvider');
const paymentManager = require('../payment/PaymentManager');
const logger = require('../logger/Logger');
const globalEvents = require('../utils/EventEmitter');

/**
 * PaymentCallbackHandler - Handle payment callbacks from providers
 */
class PaymentCallbackHandler {
  /**
   * Handle callback from payment provider
   */
  async handleCallback(provider, payload, signature) {
    try {
      logger.payment('Received payment callback', {
        provider,
        payload: JSON.stringify(payload).substring(0, 200)
      });

      // Verify signature
      const isValid = paymentManager.verifyCallback(payload, signature);

      if (!isValid) {
        logger.error('Invalid callback signature', null, { provider, signature });
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      // Extract invoice ID based on provider
      const invoiceId = this.extractInvoiceId(provider, payload);

      if (!invoiceId) {
        logger.error('Could not extract invoice ID from callback', null, { provider });
        return {
          success: false,
          error: 'Invalid invoice ID'
        };
      }

      // Get payment from database
      const paymentRepo = databaseProvider.getPaymentRepository();
      const payment = await paymentRepo.findByInvoiceId(invoiceId);

      if (!payment) {
        logger.error('Payment not found', null, { invoiceId });
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      // Check if already processed
      if (payment.status !== 'pending') {
        logger.warn('Payment already processed', { invoiceId, status: payment.status });
        return {
          success: true,
          message: 'Already processed'
        };
      }

      // Determine status from payload
      const status = this.determineStatus(provider, payload);

      if (status === 'success') {
        await this.processSuccessfulPayment(payment, payload);
      } else if (status === 'failed') {
        await paymentRepo.updateStatus(payment.id, 'failed', payload);
        logger.payment('Payment failed', { invoiceId });
      } else if (status === 'expired') {
        await paymentRepo.updateStatus(payment.id, 'expired', payload);
        logger.payment('Payment expired via callback', { invoiceId });
      }

      return {
        success: true,
        status
      };
    } catch (error) {
      logger.error('Error handling payment callback', error, { provider });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(payment, payload) {
    const paymentRepo = databaseProvider.getPaymentRepository();
    const userRepo = databaseProvider.getUserRepository();

    try {
      // Update payment status
      await paymentRepo.updateStatus(payment.id, 'success', {
        ...payload,
        processedAt: new Date()
      });

      // Add balance to user
      await userRepo.addBalance(
        payment.discordId,
        payment.amount,
        `Deposit - ${payment.invoiceId}`
      );

      const user = await userRepo.findByDiscordId(payment.discordId);

      logger.payment('Payment processed successfully', {
        invoiceId: payment.invoiceId,
        discordId: payment.discordId,
        amount: payment.amount,
        newBalance: user.balance
      });

      // Emit event for integrated mode
      globalEvents.emitDeposit({
        discordId: payment.discordId,
        amount: payment.amount,
        invoiceId: payment.invoiceId,
        balanceAfter: user.balance,
        provider: payment.provider
      });

      return true;
    } catch (error) {
      logger.error('Error processing successful payment', error, {
        invoiceId: payment.invoiceId
      });
      throw error;
    }
  }

  /**
   * Extract invoice ID from payload based on provider
   */
  extractInvoiceId(provider, payload) {
    switch (provider) {
      case 'midtrans':
        return payload.order_id;

      case 'duitku':
        return payload.merchantOrderId;

      case 'tripay':
        return payload.merchant_ref;

      default:
        return null;
    }
  }

  /**
   * Determine payment status from payload
   */
  determineStatus(provider, payload) {
    switch (provider) {
      case 'midtrans':
        if (payload.transaction_status === 'settlement' || payload.transaction_status === 'capture') {
          return 'success';
        } else if (payload.transaction_status === 'expire' || payload.transaction_status === 'cancel') {
          return 'expired';
        } else if (payload.transaction_status === 'deny' || payload.transaction_status === 'failure') {
          return 'failed';
        }
        return 'pending';

      case 'duitku':
        if (payload.resultCode === '00') {
          return 'success';
        } else if (payload.resultCode === '01') {
          return 'pending';
        } else if (payload.resultCode === '02') {
          return 'expired';
        }
        return 'failed';

      case 'tripay':
        if (payload.status === 'PAID') {
          return 'success';
        } else if (payload.status === 'EXPIRED' || payload.status === 'FAILED') {
          return 'expired';
        }
        return 'pending';

      default:
        return 'pending';
    }
  }
}

// Singleton instance
const paymentCallbackHandler = new PaymentCallbackHandler();

module.exports = paymentCallbackHandler;
