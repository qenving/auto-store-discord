const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const configManager = require('../../../shared/config/ConfigManager');
const Formatter = require('../../../shared/utils/Formatter');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check bot status and system information'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      // Get bot stats
      const stats = client.getStats();
      const uptime = client.getUptimeFormatted();

      // Get database health
      const dbHealth = await databaseProvider.healthCheck();
      const dbType = databaseProvider.getDatabaseType();

      // Get mode
      const mode = configManager.getMode();

      // Get counts
      const userRepo = databaseProvider.getUserRepository();
      const productRepo = databaseProvider.getProductRepository();
      const orderRepo = databaseProvider.getOrderRepository();

      const userCount = await userRepo.count();
      const products = await productRepo.findAll({ isActive: true });
      const productCount = products.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = await orderRepo.findAll({
        dateFrom: today,
        status: 'success'
      }, 1000, 0);

      const embed = new EmbedBuilder()
        .setColor(dbHealth.healthy ? '#00FF00' : '#FF0000')
        .setTitle('🤖 Bot Status')
        .setDescription('Current system status and statistics')
        .addFields(
          { name: '🟢 Status', value: 'Online & Operational', inline: true },
          { name: '⏱️ Uptime', value: uptime, inline: true },
          { name: '📡 Ping', value: `${stats.ping}ms`, inline: true },
          { name: '🔧 Mode', value: mode, inline: true },
          { name: '💾 Database', value: `${dbType.toUpperCase()} ${dbHealth.healthy ? '✅' : '❌'}`, inline: true },
          { name: '🌐 Servers', value: stats.guilds.toString(), inline: true },
          { name: '👥 Users', value: userCount.toString(), inline: true },
          { name: '📦 Products', value: productCount.toString(), inline: true },
          { name: '🛍️ Orders Today', value: todayOrders.length.toString(), inline: true }
        )
        .setFooter({ text: `Auto-Store Ecosystem v2.0` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: '❌ Failed to fetch bot status.'
      });
    }
  }
};
