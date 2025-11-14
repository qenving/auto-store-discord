const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const Formatter = require('../../../shared/utils/Formatter');
const Validator = require('../../../shared/utils/Validator');
const logger = require('../../../shared/logger/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('product')
    .setDescription('Manage products (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new product')
        .addStringOption(option =>
          option.setName('name').setDescription('Product name').setRequired(true)
        )
        .addNumberOption(option =>
          option.setName('price').setDescription('Product price').setRequired(true).setMinValue(1)
        )
        .addStringOption(option =>
          option.setName('category').setDescription('Product category').setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description').setDescription('Product description').setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit a product')
        .addStringOption(option =>
          option.setName('product_id').setDescription('Product ID').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('name').setDescription('New product name').setRequired(false)
        )
        .addNumberOption(option =>
          option.setName('price').setDescription('New price').setRequired(false).setMinValue(1)
        )
        .addBooleanOption(option =>
          option.setName('active').setDescription('Product active status').setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a product')
        .addStringOption(option =>
          option.setName('product_id').setDescription('Product ID').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all products')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      await this.addProduct(interaction);
    } else if (subcommand === 'edit') {
      await this.editProduct(interaction);
    } else if (subcommand === 'delete') {
      await this.deleteProduct(interaction);
    } else if (subcommand === 'list') {
      await this.listProducts(interaction);
    }
  },

  async addProduct(interaction) {
    try {
      await interaction.deferReply();

      const name = interaction.options.getString('name');
      const price = interaction.options.getNumber('price');
      const category = interaction.options.getString('category') || 'General';
      const description = interaction.options.getString('description') || '';

      if (!Validator.isValidProductName(name)) {
        return interaction.editReply({ content: '❌ Invalid product name!' });
      }

      if (!Validator.isValidPrice(price)) {
        return interaction.editReply({ content: '❌ Invalid price!' });
      }

      const productRepo = databaseProvider.getProductRepository();

      const product = await productRepo.create({
        name,
        price,
        category,
        description,
        isActive: true,
        minPurchase: 1,
        maxPurchase: 1
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Product Added Successfully')
        .addFields(
          { name: 'Product ID', value: `\`${product.id}\``, inline: false },
          { name: 'Name', value: product.name, inline: true },
          { name: 'Price', value: Formatter.formatCurrency(product.price), inline: true },
          { name: 'Category', value: product.category, inline: true },
          { name: 'Description', value: product.description || 'No description', inline: false }
        )
        .setFooter({ text: `Added by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.admin('Product added', interaction.user.id, {
        productId: product.id,
        name: product.name,
        price: product.price
      });
    } catch (error) {
      logger.error('Error adding product', error);
      await interaction.editReply({ content: '❌ Failed to add product.' });
    }
  },

  async editProduct(interaction) {
    try {
      await interaction.deferReply();

      const productId = interaction.options.getString('product_id');
      const name = interaction.options.getString('name');
      const price = interaction.options.getNumber('price');
      const active = interaction.options.getBoolean('active');

      const productRepo = databaseProvider.getProductRepository();

      const product = await productRepo.findById(productId);

      if (!product) {
        return interaction.editReply({ content: '❌ Product not found!' });
      }

      const updates = {};
      if (name) updates.name = name;
      if (price) updates.price = price;
      if (active !== null) updates.isActive = active;

      const updated = await productRepo.update(productId, updates);

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('✅ Product Updated')
        .addFields(
          { name: 'Product ID', value: `\`${updated.id}\``, inline: false },
          { name: 'Name', value: updated.name, inline: true },
          { name: 'Price', value: Formatter.formatCurrency(updated.price), inline: true },
          { name: 'Status', value: updated.isActive ? '✅ Active' : '❌ Inactive', inline: true }
        )
        .setFooter({ text: `Updated by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.admin('Product updated', interaction.user.id, {
        productId: updated.id,
        updates
      });
    } catch (error) {
      logger.error('Error editing product', error);
      await interaction.editReply({ content: '❌ Failed to edit product.' });
    }
  },

  async deleteProduct(interaction) {
    try {
      await interaction.deferReply();

      const productId = interaction.options.getString('product_id');
      const productRepo = databaseProvider.getProductRepository();

      const product = await productRepo.findById(productId);

      if (!product) {
        return interaction.editReply({ content: '❌ Product not found!' });
      }

      await productRepo.delete(productId);

      await interaction.editReply({
        content: `✅ Product **${product.name}** has been deleted.`
      });

      logger.admin('Product deleted', interaction.user.id, {
        productId,
        productName: product.name
      });
    } catch (error) {
      logger.error('Error deleting product', error);
      await interaction.editReply({ content: '❌ Failed to delete product.' });
    }
  },

  async listProducts(interaction) {
    try {
      await interaction.deferReply();

      const productRepo = databaseProvider.getProductRepository();
      const stockRepo = databaseProvider.getStockRepository();

      const products = await productRepo.findAll();

      if (products.length === 0) {
        return interaction.editReply({ content: 'No products found.' });
      }

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📦 Product List')
        .setDescription(`Total: ${products.length} product(s)`)
        .setTimestamp();

      for (const product of products.slice(0, 25)) {
        const stock = await stockRepo.getAvailableCount(product.id);
        const status = product.isActive ? '✅' : '❌';

        embed.addFields({
          name: `${status} ${product.name}`,
          value: `**ID:** \`${product.id}\`\n**Price:** ${Formatter.formatCurrency(product.price)}\n**Stock:** ${stock}\n**Category:** ${product.category}`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error listing products', error);
      await interaction.editReply({ content: '❌ Failed to list products.' });
    }
  }
};
