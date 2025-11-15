const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const Formatter = require('../../../shared/utils/Formatter');
const logger = require('../../../shared/logger/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View system statistics (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('period')
        .setDescription('Time period for statistics')
        .setRequired(false)
        .addChoices(
          { name: 'Today', value: 'today' },
          { name: 'This Week', value: 'week' },
          { name: 'This Month', value: 'month' },
          { name: 'All Time', value: 'all' }
        )
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const period = interaction.options.getString('period') || 'today';

      // Calculate date range
      const dateRange = this.getDateRange(period);

      // Get repositories
      const userRepo = databaseProvider.getUserRepository();
      const productRepo = databaseProvider.getProductRepository();
      const orderRepo = databaseProvider.getOrderRepository();
      const paymentRepo = databaseProvider.getPaymentRepository();

      // Get stats
      const totalUsers = await userRepo.count();
      const products = await productRepo.findAll({ isActive: true });
      const orderStats = await orderRepo.getStats(dateRange);
      const paymentStats = await paymentRepo.getStats(dateRange);

      // Revenue data
      const revenueData = await orderRepo.getRevenue(dateRange);
      const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📊 System Statistics')
        .setDescription(`Statistics for: **${this.getPeriodLabel(period)}**`)
        .addFields(
          { name: '👥 Total Users', value: totalUsers.toString(), inline: true },
          { name: '📦 Active Products', value: products.length.toString(), inline: true },
          { name: '🛍️ Total Orders', value: orderStats.total.toString(), inline: true },
          { name: '✅ Successful Orders', value: orderStats.success.toString(), inline: true },
          { name: '⏳ Pending Orders', value: orderStats.pending.toString(), inline: true },
          { name: '❌ Failed Orders', value: orderStats.failed.toString(), inline: true },
          { name: '💰 Total Revenue', value: Formatter.formatCurrency(totalRevenue), inline: true },
          { name: '💳 Successful Deposits', value: paymentStats.success.toString(), inline: true },
          { name: '💵 Total Deposits', value: Formatter.formatCurrency(paymentStats.totalAmount), inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      // Top products (if all time)
      if (period === 'all') {
        const allOrders = await orderRepo.findAll({ status: 'success' }, 1000, 0);
        const productSales = {};

        allOrders.forEach(order => {
          if (!productSales[order.productName]) {
            productSales[order.productName] = 0;
          }
          productSales[order.productName] += order.quantity;
        });

        const topProducts = Object.entries(productSales)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, qty], index) => `${index + 1}. ${name} - ${qty} sold`)
          .join('\n');

        if (topProducts) {
          embed.addFields({
            name: '🏆 Top Products',
            value: topProducts,
            inline: false
          });
        }
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error getting stats', error);
      await interaction.editReply({ content: '❌ Failed to get statistics.' });
    }
  },

  getDateRange(period) {
    const now = new Date();
    const range = {};

    switch (period) {
      case 'today':
        range.from = new Date(now.setHours(0, 0, 0, 0));
        break;

      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        range.from = weekAgo;
        break;

      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        range.from = monthAgo;
        break;

      case 'all':
        // No date filter
        break;
    }

    return range;
  },

  getPeriodLabel(period) {
    const labels = {
      'today': 'Today',
      'week': 'Last 7 Days',
      'month': 'Last 30 Days',
      'all': 'All Time'
    };
    return labels[period] || 'Today';
  }
};
