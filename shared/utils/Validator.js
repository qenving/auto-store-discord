/**
 * Validator - Input validation utilities
 */
class Validator {
  /**
   * Validate Discord ID
   */
  static isValidDiscordId(discordId) {
    return /^\d{17,19}$/.test(discordId);
  }

  /**
   * Validate amount
   */
  static isValidAmount(amount, min = 0, max = Infinity) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * Validate email
   */
  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Sanitize string
   */
  static sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
  }

  /**
   * Validate product name
   */
  static isValidProductName(name) {
    return typeof name === 'string' && name.trim().length >= 3 && name.trim().length <= 100;
  }

  /**
   * Validate price
   */
  static isValidPrice(price) {
    const num = parseFloat(price);
    return !isNaN(num) && num > 0;
  }

  /**
   * Validate quantity
   */
  static isValidQuantity(quantity) {
    const num = parseInt(quantity);
    return !isNaN(num) && num > 0 && num <= 1000;
  }
}

module.exports = Validator;
