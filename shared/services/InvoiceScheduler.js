const cron = require('node-cron');
const databaseProvider = require('../database/provider/DatabaseProvider');
const paymentManager = require('../payment/PaymentManager');
const configManager = require('../config/ConfigManager');
const logger = require('../logger/Logger');
const globalEvents = require('../utils/EventEmitter');

/**
 * InvoiceScheduler - Auto-cancel expired invoices
 * Runs every minute to check and expire pending payments
 */
class InvoiceScheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Invoice scheduler is already running');
      return;
    }

    const features = configManager.getFeatures();

    if (!features.autoExpireInvoice) {
      logger.info('Auto-expire invoice feature is disabled');
      return;
    }

    // Run every minute
    this.task = cron.schedule('*/1 * * * *', async () => {
      await this.checkExpiredInvoices();
    });

    this.isRunning = true;
    logger.info('Invoice scheduler started - checking every minute');

    // Run immediately on start
    this.checkExpiredInvoices();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.isRunning = false;
      logger.info('Invoice scheduler stopped');
    }
  }

  /**
   * Check and expire invoices
   */
  async checkExpiredInvoices() {
    try {
      const paymentRepo = databaseProvider.getPaymentRepository();
      const paymentConfig = configManager.getPaymentConfig();
      const expiryMinutes = paymentConfig.autoExpireMinutes || 15;

      // Get expired payments
      const expiredPayments = await paymentRepo.getExpired(expiryMinutes);

      if (expiredPayments.length === 0) {
        logger.debug('No expired invoices found');
        return;
      }

      logger.info(`Found ${expiredPayments.length} expired invoices`);

      for (const payment of expiredPayments) {
        try {
          // Check actual status from payment provider
          const status = await paymentManager.checkPaymentStatus(payment.invoiceId);

          if (status.status === 'success') {
            // Payment was actually paid! Update it
            logger.payment('Late payment detected', {
              invoiceId: payment.invoiceId,
              amount: payment.amount
            });

            await this.processSuccessfulPayment(payment, status);
          } else {
            // Mark as expired
            await paymentRepo.markAsExpired(payment.id);

            logger.payment('Invoice expired', {
              invoiceId: payment.invoiceId,
              discordId: payment.discordId,
              amount: payment.amount
            });

            // Emit event
            globalEvents.emitPaymentStatus({
              invoiceId: payment.invoiceId,
              discordId: payment.discordId,
              status: 'expired',
              amount: payment.amount
            });

            // Try to cancel on provider side
            try {
              await paymentManager.cancelPayment(payment.invoiceId);
            } catch (e) {
              // Some providers don't support cancel
            }
          }
        } catch (error) {
          logger.error('Error processing expired invoice', error, {
            invoiceId: payment.invoiceId
          });
        }
      }

      logger.info(`Processed ${expiredPayments.length} expired invoices`);
    } catch (error) {
      logger.error('Error in invoice scheduler', error);
    }
  }

  /**
   * Process successful payment (late detection)
   */
  async processSuccessfulPayment(payment, status) {
    const paymentRepo = databaseProvider.getPaymentRepository();
    const userRepo = databaseProvider.getUserRepository();

    try {
      // Update payment status
      await paymentRepo.updateStatus(payment.id, 'success', {
        paidAt: status.paidAt || new Date(),
        detectedAt: new Date()
      });

      // Add balance to user
      const user = await userRepo.findByDiscordId(payment.discordId);

      if (user) {
        await userRepo.addBalance(payment.discordId, payment.amount, `Deposit - ${payment.invoiceId}`);

        logger.payment('Balance added from late payment', {
          discordId: payment.discordId,
          amount: payment.amount,
          invoiceId: payment.invoiceId
        });

        // Emit event
        globalEvents.emitDeposit({
          discordId: payment.discordId,
          amount: payment.amount,
          invoiceId: payment.invoiceId,
          balanceAfter: user.balance + payment.amount
        });
      }
    } catch (error) {
      logger.error('Error processing successful payment', error, {
        invoiceId: payment.invoiceId
      });
    }
  }
}

// Singleton instance
const invoiceScheduler = new InvoiceScheduler();

module.exports = invoiceScheduler;
