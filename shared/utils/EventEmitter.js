const { EventEmitter } = require('events');

/**
 * GlobalEventEmitter - Event bus for cross-system communication
 * Used for IntegratedMode to communicate between bot and website
 */
class GlobalEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase max listeners
  }

  /**
   * Emit user deposit event
   */
  emitDeposit(data) {
    this.emit('deposit', data);
  }

  /**
   * Emit order created event
   */
  emitOrder(data) {
    this.emit('order', data);
  }

  /**
   * Emit balance change event
   */
  emitBalanceChange(data) {
    this.emit('balance:change', data);
  }

  /**
   * Emit testimoni event
   */
  emitTestimoni(data) {
    this.emit('testimoni', data);
  }

  /**
   * Emit payment status change
   */
  emitPaymentStatus(data) {
    this.emit('payment:status', data);
  }

  /**
   * Emit admin action
   */
  emitAdminAction(data) {
    this.emit('admin:action', data);
  }
}

// Singleton instance
const globalEvents = new GlobalEventEmitter();

module.exports = globalEvents;
