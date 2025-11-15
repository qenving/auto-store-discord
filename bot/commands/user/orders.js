const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const Formatter = require('../../../shared/utils/Formatter');
const logger = require('../../../shared/logger/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('orders')
    .setDescription('View your order history')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Success', value: 'success' },
          { name: 'Pending', value: 'pending' },
          { name: 'Failed', value: 'failed' },
          { name: 'Cancelled', value: 'cancelled' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Number of orders to show (default: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const statusFilter = interaction.options.getString('status') || 'all';
      const limit = interaction.options.getInteger('limit') || 10;

      const orderRepo = databaseProvider.getOrderRepository();

      const options = { limit };
      if (statusFilter !== 'all') {
        options.status = statusFilter;
      }

      const orders = await orderRepo.findByUser(interaction.user.id, options);

      if (orders.length === 0) {
        return interaction.editReply({
          content: '📦 You have no orders yet!\n\nUse `/shop` to browse products and `/buy` to make a purchase.'
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📦 Your Order History')
        .setDescription(`Showing ${orders.length} order(s)`)
        .setFooter({ text: `User ID: ${interaction.user.id}` })
        .setTimestamp();

      for (const order of orders) {
        const statusEmoji = {
          'success': '✅',
          'pending': '⏳',
          'failed': '❌',
          'cancelled': '🚫'
        }[order.status] || '❓';

        embed.addFields({
          name: `${statusEmoji} ${order.productName}`,
          value: `**Order ID:** \`${Formatter.formatOrderId(order.id)}\`\n**Quantity:** ${order.quantity}\n**Total:** ${Formatter.formatCurrency(order.totalPrice)}\n**Status:** ${Formatter.formatStatus(order.status)}\n**Date:** ${Formatter.formatDate(order.createdAt)}`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error fetching orders', error);
      await interaction.editReply({
        content: '❌ Failed to fetch your orders. Please try again later.'
      });
    }
  }
};
