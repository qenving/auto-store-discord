const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const Formatter = require('../../../shared/utils/Formatter');
const logger = require('../../../shared/logger/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Manage product stock (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add single stock item')
        .addStringOption(option =>
          option.setName('product_id').setDescription('Product ID').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('data').setDescription('Stock data/code').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('bulk')
        .setDescription('Add bulk stock from text (one per line)')
        .addStringOption(option =>
          option.setName('product_id').setDescription('Product ID').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('stock_data').setDescription('Stock items separated by | (pipe)').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View stock for a product')
        .addStringOption(option =>
          option.setName('product_id').setDescription('Product ID').setRequired(true)
        )
        .addBooleanOption(option =>
          option.setName('show_used').setDescription('Show used stock too?').setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear all available stock for a product')
        .addStringOption(option =>
          option.setName('product_id').setDescription('Product ID').setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      await this.addStock(interaction);
    } else if (subcommand === 'bulk') {
      await this.bulkStock(interaction);
    } else if (subcommand === 'view') {
      await this.viewStock(interaction);
    } else if (subcommand === 'clear') {
      await this.clearStock(interaction);
    }
  },

  async addStock(interaction) {
    try {
      await interaction.deferReply();

      const productId = interaction.options.getString('product_id');
      const data = interaction.options.getString('data');

      const productRepo = databaseProvider.getProductRepository();
      const stockRepo = databaseProvider.getStockRepository();

      const product = await productRepo.findById(productId);
      if (!product) {
        return interaction.editReply({ content: '❌ Product not found!' });
      }

      await stockRepo.addStock(productId, data);

      const availableCount = await stockRepo.getAvailableCount(productId);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Stock Added')
        .addFields(
          { name: 'Product', value: product.name, inline: true },
          { name: 'Available Stock', value: availableCount.toString(), inline: true }
        )
        .setFooter({ text: `Added by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.admin('Stock added', interaction.user.id, { productId, productName: product.name });
    } catch (error) {
      logger.error('Error adding stock', error);
      await interaction.editReply({ content: '❌ Failed to add stock.' });
    }
  },

  async bulkStock(interaction) {
    try {
      await interaction.deferReply();

      const productId = interaction.options.getString('product_id');
      const stockData = interaction.options.getString('stock_data');

      const productRepo = databaseProvider.getProductRepository();
      const stockRepo = databaseProvider.getStockRepository();

      const product = await productRepo.findById(productId);
      if (!product) {
        return interaction.editReply({ content: '❌ Product not found!' });
      }

      // Split by pipe
      const stockItems = stockData.split('|').map(item => item.trim()).filter(item => item);

      if (stockItems.length === 0) {
        return interaction.editReply({ content: '❌ No valid stock items provided!' });
      }

      const count = await stockRepo.addBulkStock(productId, stockItems);
      const availableCount = await stockRepo.getAvailableCount(productId);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Bulk Stock Added')
        .addFields(
          { name: 'Product', value: product.name, inline: true },
          { name: 'Items Added', value: count.toString(), inline: true },
          { name: 'Total Available', value: availableCount.toString(), inline: true }
        )
        .setFooter({ text: `Added by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.admin('Bulk stock added', interaction.user.id, {
        productId,
        productName: product.name,
        count
      });
    } catch (error) {
      logger.error('Error adding bulk stock', error);
      await interaction.editReply({ content: '❌ Failed to add bulk stock.' });
    }
  },

  async viewStock(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const productId = interaction.options.getString('product_id');
      const showUsed = interaction.options.getBoolean('show_used') || false;

      const productRepo = databaseProvider.getProductRepository();
      const stockRepo = databaseProvider.getStockRepository();

      const product = await productRepo.findById(productId);
      if (!product) {
        return interaction.editReply({ content: '❌ Product not found!' });
      }

      const stocks = await stockRepo.findByProduct(productId, !showUsed);

      if (stocks.length === 0) {
        return interaction.editReply({
          content: `📦 No ${showUsed ? '' : 'available '}stock found for **${product.name}**`
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`📦 Stock for ${product.name}`)
        .setDescription(`Showing ${stocks.length} item(s)`)
        .setTimestamp();

      const stockList = stocks.slice(0, 10).map((stock, index) => {
        const status = stock.isUsed ? '❌ Used' : '✅ Available';
        return `${index + 1}. ${status}\n   \`${stock.data.substring(0, 50)}${stock.data.length > 50 ? '...' : ''}\``;
      }).join('\n\n');

      embed.addFields({
        name: 'Stock Items',
        value: stockList || 'No items',
        inline: false
      });

      if (stocks.length > 10) {
        embed.setFooter({ text: `Showing first 10 of ${stocks.length} items` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error viewing stock', error);
      await interaction.editReply({ content: '❌ Failed to view stock.' });
    }
  },

  async clearStock(interaction) {
    try {
      await interaction.deferReply();

      const productId = interaction.options.getString('product_id');

      const productRepo = databaseProvider.getProductRepository();
      const stockRepo = databaseProvider.getStockRepository();

      const product = await productRepo.findById(productId);
      if (!product) {
        return interaction.editReply({ content: '❌ Product not found!' });
      }

      const count = await stockRepo.clearProductStock(productId);

      await interaction.editReply({
        content: `✅ Cleared **${count}** stock item(s) from **${product.name}**`
      });

      logger.admin('Stock cleared', interaction.user.id, {
        productId,
        productName: product.name,
        count
      });
    } catch (error) {
      logger.error('Error clearing stock', error);
      await interaction.editReply({ content: '❌ Failed to clear stock.' });
    }
  }
};
