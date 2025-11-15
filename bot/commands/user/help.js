const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction, client) {
    const isAdmin = interaction.member.permissions.has('Administrator');

    const userEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('📚 Auto-Store Bot - Help')
      .setDescription('Here are all the commands you can use:')
      .addFields(
        {
          name: '💰 Balance Commands',
          value: '`/balance check` - Check your balance\n`/balance add` - Add balance to user (Admin)\n`/balance remove` - Remove balance from user (Admin)',
          inline: false
        },
        {
          name: '🛒 Shop Commands',
          value: '`/shop` - Browse available products\n`/buy <product_id> [quantity]` - Purchase a product',
          inline: false
        },
        {
          name: '💳 Payment Commands',
          value: '`/deposit <amount>` - Deposit balance via QRIS',
          inline: false
        },
        {
          name: '📦 Order Commands',
          value: '`/orders [status] [limit]` - View your order history',
          inline: false
        },
        {
          name: 'ℹ️ Information',
          value: '`/help` - Show this help message\n`/status` - Check bot status',
          inline: false
        }
      )
      .setFooter({ text: 'Auto-Store Ecosystem v2.0' })
      .setTimestamp();

    if (isAdmin) {
      userEmbed.addFields(
        {
          name: '🔧 Admin Commands',
          value: '`/product add/edit/delete/list` - Manage products\n`/stock add/bulk/view/clear` - Manage stock\n`/admin add/remove/list` - Manage admins\n`/maintenance toggle` - Toggle maintenance mode\n`/stats` - View system statistics',
          inline: false
        }
      );
    }

    await interaction.reply({ embeds: [userEmbed], ephemeral: true });
  }
};
