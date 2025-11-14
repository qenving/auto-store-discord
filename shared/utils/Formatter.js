/**
 * Formatter - Formatting utilities
 */
class Formatter {
  /**
   * Format currency (Indonesian Rupiah)
   */
  static formatCurrency(amount) {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
  }

  /**
   * Format date
   */
  static formatDate(date) {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format status badge
   */
  static formatStatus(status) {
    const statusMap = {
      'pending': '⏳ Pending',
      'success': '✅ Success',
      'failed': '❌ Failed',
      'cancelled': '🚫 Cancelled',
      'expired': '⌛ Expired'
    };

    return statusMap[status] || status;
  }

  /**
   * Truncate text
   */
  static truncate(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format order ID
   */
  static formatOrderId(orderId) {
    return orderId.substring(0, 8).toUpperCase();
  }

  /**
   * Format time ago
   */
  static timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = {
      tahun: 31536000,
      bulan: 2592000,
      minggu: 604800,
      hari: 86400,
      jam: 3600,
      menit: 60,
      detik: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit} lalu`;
      }
    }

    return 'Baru saja';
  }
}

module.exports = Formatter;
