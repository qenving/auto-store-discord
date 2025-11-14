const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const Formatter = require('../../../shared/utils/Formatter');
const logger = require('../../../shared/logger/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse available products'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const productRepo = databaseProvider.getProductRepository();
      const products = await productRepo.findAll({ isActive: true });

      if (products.length === 0) {
        return interaction.editReply({ content: '❌ No products available at the moment.' });
      }

      const stockRepo = databaseProvider.getStockRepository();

      // Get stock count for each product
      const productsWithStock = await Promise.all(
        products.map(async (product) => {
          const stockCount = await stockRepo.getAvailableCount(product.id);
          return { ...product, stockCount };
        })
      );

      // Group by category
      const categories = {};
      for (const product of productsWithStock) {
        if (!categories[product.category]) {
          categories[product.category] = [];
        }
        categories[product.category].push(product);
      }

      const embeds = [];
      let currentPage = 0;

      for (const [category, categoryProducts] of Object.entries(categories)) {
        const embed = new EmbedBuilder()
          .setColor('#0099FF')
          .setTitle(`🛒 Shop - ${category}`)
          .setDescription('Browse and purchase products')
          .setTimestamp();

        for (const product of categoryProducts) {
          const stockStatus = product.stockCount > 0
            ? `✅ **${product.stockCount}** in stock`
            : '❌ Out of stock';

          embed.addFields({
            name: `${product.name}`,
            value: `**Price:** ${Formatter.formatCurrency(product.price)}\n**Stock:** ${stockStatus}\n**ID:** \`${product.id}\`\n${product.description || 'No description'}`,
            inline: false
          });
        }

        embed.setFooter({ text: `Category ${Object.keys(categories).indexOf(category) + 1} of ${Object.keys(categories).length}` });
        embeds.push(embed);
      }

      if (embeds.length === 0) {
        return interaction.editReply({ content: '❌ No products available.' });
      }

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('shop_refresh')
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({
        embeds: [embeds[currentPage]],
        components: [buttons]
      });
    } catch (error) {
      logger.error('Error displaying shop', error);
      await interaction.editReply({ content: 'Failed to load shop. Please try again.' });
    }
  }
};
